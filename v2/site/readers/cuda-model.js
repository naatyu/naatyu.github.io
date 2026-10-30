// Exact teaching models, not GPU timing or hardware schedulers.
const integer=(v,min,max,name)=>{if(!Number.isInteger(v)||v<min||v>max)throw new RangeError(name);return v;};
export function threadMap(n=130,block=2,warp=0,lane=0){
 integer(n,1,1024,'n');const blocks=Math.ceil(n/64);integer(block,0,blocks-1,'block');integer(warp,0,1,'warp');integer(lane,0,31,'lane');
 const wave=Math.floor(block/4),activeBlocks=Array.from({length:blocks},(_,b)=>b).filter(b=>Math.floor(b/4)===wave);
 const lanes=Array.from({length:32},(_,l)=>{const index=block*64+warp*32+l;return {lane:l,index,valid:index<n,a:index,b:2*index,result:3*index};});
 return {n,blocks,launched:blocks*64,block,warp,lane,wave,activeBlocks,lanes,selected:lanes[lane]};
}
export const accessPatterns=['contiguous','offset','strided','reversed'];
export function sectorAccess(pattern='contiguous'){
 if(!accessPatterns.includes(pattern))throw new RangeError('access pattern');
 const accesses=Array.from({length:32},(_,lane)=>{const word=pattern==='offset'?lane+1:pattern==='strided'?lane*8:pattern==='reversed'?31-lane:lane;return {lane,word,byte:word*4,sector:Math.floor(word/8)};});
 const sectors=[...new Set(accesses.map(a=>a.sector))].sort((a,b)=>a-b).map(index=>({index,words:[...new Set(accesses.filter(a=>a.sector===index).map(a=>a.word))].sort((a,b)=>a-b)}));
 return {accesses,sectors,bytes:sectors.length*32,useful:128,efficiency:128/(sectors.length*32)};
}
export const bankPatterns=['row','stride2','column','padded','broadcast'];
export function bankAccess(pattern='column'){
 if(!bankPatterns.includes(pattern))throw new RangeError('bank pattern');
 const stride={row:1,stride2:2,column:32,padded:33,broadcast:0}[pattern];
 const accesses=Array.from({length:32},(_,lane)=>{const word=lane*stride;return {lane,word,bank:word%32};});
 const banks=Array.from({length:32},(_,bank)=>{
  const words=[...new Set(accesses.filter(a=>a.bank===bank).map(a=>a.word))].sort((a,b)=>a-b);
  return {bank,requests:words.map(word=>({word,lanes:accesses.filter(a=>a.word===word).map(a=>a.lane)}))};
 });
 return {stride,accesses,banks,rounds:Math.max(...banks.map(b=>b.requests.length))};
}
export const matrixA=Array.from({length:4},(_,r)=>Array.from({length:4},(_,c)=>r*4+c+1));
export const matrixB=[[1,0,2,1],[0,1,1,2],[2,1,0,1],[1,2,1,0]];
export const gemmStrategies=['naive','shared','register'];
export function gemmState(strategy='shared',stage=0){
 if(!gemmStrategies.includes(strategy))throw new RangeError('GEMM strategy');integer(stage,0,4,'GEMM stage');
 const tile={naive:1,shared:2,register:4}[strategy],processed=stage<2?0:stage<4?2:4,kStart=stage<3?0:2;
 const partial=Array.from({length:4},(_,r)=>Array.from({length:4},(_,c)=>r<tile&&c<tile?Array.from({length:processed},(_,k)=>matrixA[r][k]*matrixB[k][c]).reduce((a,b)=>a+b,0):null));
 const aTile=stage?matrixA.slice(0,tile).map(row=>row.slice(kStart,kStart+2)):[];
 const bTile=stage?matrixB.slice(kStart,kStart+2).map(row=>row.slice(0,tile)):[];
 return {tile,stage,processed,kStart,partial,aTile,bTile,globalLoads:128/tile,sharedReads:strategy==='naive'?0:strategy==='shared'?128:64,threads:strategy==='naive'?1:4,accumulators:strategy==='register'?4:1};
}
export function pipelineSchedule(load=3,compute=2,tiles=4){
 integer(load,1,6,'load');integer(compute,1,6,'compute');integer(tiles,2,6,'tiles');
 const parallel=[],serial=[];let copyEnd=0,computeEnd=0;
 for(let i=0;i<tiles;i++){
  const start=Math.max(copyEnd,i>=2?parallel[i-2].computeEnd:0),end=start+load,begin=Math.max(end,computeEnd);
  parallel.push({tile:i,slot:i%2,loadStart:start,loadEnd:end,computeStart:begin,computeEnd:begin+compute});copyEnd=end;computeEnd=begin+compute;
  const serialStart=i*(load+compute);serial.push({tile:i,slot:0,loadStart:serialStart,loadEnd:serialStart+load,computeStart:serialStart+load,computeEnd:serialStart+load+compute});
 }
 return {load,compute,tiles,parallel,serial,parallelEnd:computeEnd,serialEnd:tiles*(load+compute)};
}
export function reductionState(stage=0){
 integer(stage,0,5,'reduction stage');let values=Array.from({length:32},(_,i)=>i+1),active=32;const transfers=[];
 for(let step=1;step<=stage;step++){
  const half=active/2;const current=[];
  for(let i=0;i<half;i++){current.push({from:i+half,to:i,value:values[i+half]});values[i]+=values[i+half];}
  active=half;if(step===stage)transfers.push(...current);
 }
 return {values,active,transfers,total:528};
}
export const cachePatterns=['row-major','hilbert'];
const hilbert4=[[0,0],[1,0],[1,1],[0,1],[0,2],[0,3],[1,3],[1,2],[2,2],[2,3],[3,3],[3,2],[3,1],[2,1],[2,0],[3,0]];
export function tileTraversal(pattern='row-major',capacity=4){
 if(!cachePatterns.includes(pattern))throw new RangeError('tile order');if(![2,4,6,8].includes(capacity))throw new RangeError('cache capacity');
 const order=pattern==='hilbert'?hilbert4.map(p=>[...p]):Array.from({length:16},(_,i)=>[Math.floor(i/4),i%4]);
 const cache=[],frames=[];let misses=0,hits=0;
 for(const [row,col]of order){const accesses=[];for(const key of [`A${row}`,`B${col}`]){
  const index=cache.indexOf(key),hit=index!==-1;if(hit){cache.splice(index,1);hits++;}else{misses++;if(cache.length===capacity)cache.shift();}cache.push(key);accesses.push({key,hit});
 }frames.push({row,col,cache:[...cache],accesses,misses,hits});}
 return {order,frames,capacity,misses,hits};
}
// 128-byte XOR swizzle over one 1024-byte-aligned region. Low four bits stay fixed.
export function xorSwizzle(offset){integer(offset,0,1023,'swizzle offset');return offset^((offset&0x380)>>3);}
