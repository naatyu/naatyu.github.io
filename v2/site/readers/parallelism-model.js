export function matmul(a,b){if(!Array.isArray(a)||!Array.isArray(b)||!a.length||!b.length||!a[0].length||!b[0].length||a.some(r=>r.length!==a[0].length)||b.some(r=>r.length!==b[0].length)||a[0].length!==b.length||[...a.flat(),...b.flat()].some(x=>!Number.isFinite(x)))throw new RangeError('Invalid matrix shapes or entries');return a.map(r=>b[0].map((_,k)=>r.reduce((s,x,j)=>s+x*b[j][k],0)));}
export const matrixA=[[1,2,3,4],[2,0,1,3]],matrixB=[[1,0],[0,1],[1,1],[2,-1]];
// Rank i sends to i+1 and receives from i-1. Query ownership stays fixed.
export function ringFrame(ranks,tick){
  if(!Number.isInteger(ranks)||ranks<1||ranks>64||!Number.isInteger(tick)||tick<0||tick>=ranks)throw new RangeError('Invalid context ring state');
  return Array.from({length:ranks},(_,rank)=>({rank,queryOwner:rank,kvOwner:(rank-tick+ranks)%ranks,sendTo:(rank+1)%ranks,receiveFrom:(rank-1+ranks)%ranks}));
}
// Two query positions per rank; query q sees keys 1..q, including itself.
export function causalOwnership(ranks){
  if(!Number.isInteger(ranks)||ranks<1||ranks>1024)throw new RangeError('Invalid causal rank count');
  const positions=2*ranks;
  return Array.from({length:ranks},(_,rank)=>{
    const contiguous=[2*rank+1,2*rank+2],zigzag=[rank+1,positions-rank];
    return {rank,contiguous,zigzag,contiguousWork:contiguous.reduce((a,b)=>a+b,0),zigzagWork:zigzag.reduce((a,b)=>a+b,0)};
  });
}
export function contractExample(){const partial0=matmul(matrixA.map(r=>r.slice(0,2)),matrixB.slice(0,2)),partial1=matmul(matrixA.map(r=>r.slice(2)),matrixB.slice(2));return {partial0,partial1,result:partial0.map((r,i)=>r.map((x,j)=>x+partial1[i][j]))};}
export function pipelineFrame(stages,microbatches,tick){if(!Number.isInteger(stages)||!Number.isInteger(microbatches)||stages<1||microbatches<1||!Number.isInteger(tick)||tick<0||tick>stages+microbatches-2)throw new RangeError('Invalid pipeline state');const clocks=stages+microbatches-1;return {clocks,utilization:microbatches/clocks,idleFraction:(stages-1)/clocks,overhead:(stages-1)/microbatches,cells:Array.from({length:stages},(_,s)=>Array.from({length:clocks},(_,t)=>{const batch=t-s;return {stage:s,tick:t,batch:batch>=0&&batch<microbatches?batch:null,active:t===tick&&batch>=0&&batch<microbatches};}))};}
export function adamStateBytes(parameters,ranks,stage){if(!Number.isFinite(parameters)||parameters<0||!Number.isInteger(ranks)||ranks<1||![0,1,2,3].includes(stage))throw new RangeError('Invalid state layout');const weights=2*parameters/(stage>=3?ranks:1),grads=2*parameters/(stage>=2?ranks:1),optimizer=12*parameters/(stage>=1?ranks:1);return {weights,grads,optimizer,total:weights+grads+optimizer};}
