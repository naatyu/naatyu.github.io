import {threadMap,sectorAccess,bankAccess,gemmState,pipelineSchedule,reductionState,matrixA,matrixB,accessPatterns,bankPatterns,gemmStrategies,tileTraversal,cachePatterns} from './cuda-model.js';
import {rangePlayback} from './topic-tools.js';
import {registerReaderState} from './reader-state.js';
const txt=(x,y,s,cls='')=>`<text x="${x}" y="${y}" class="${cls}">${s}</text>`;
const svg=(h,title,body)=>`<div class="cuda-scroll" tabindex="0" role="region" aria-label="${title}; scroll horizontally on narrow screens"><svg viewBox="0 0 700 ${h}" role="img" aria-label="${title}" class="cuda-svg"><title>${title}</title>${body}</svg></div>`;
const status=s=>`<p class="cuda-reading" role="status">${s}</p>`;
const option=(v,label,selected)=>`<option value="${v}"${v===selected?' selected':''}>${label}</option>`;
const patternLabels={'row-major':'Row-major',hilbert:'Hilbert',contiguous:'Aligned',offset:'Offset by one float',strided:'Stride 8',reversed:'Reverse lanes',row:'Stride 1',stride2:'Stride 2',column:'Column · stride 32',padded:'Padded · stride 33',broadcast:'Same word',naive:'One output per thread',shared:'Shared tile · 2×2',register:'Register tiles · 4×4 block'};
const choices=(kind,values,selected)=>`<div class="cuda-choices" role="group" aria-label="${kind}">${values.map(v=>`<button type="button" data-pattern="${v}" aria-pressed="${v===selected}">${patternLabels[v]}</button>`).join('')}</div>`;
const controls=(label,max,value=0)=>`<div class="cuda-playback"><button type="button" data-play>Play</button><button type="button" data-prev aria-label="Previous ${label} state">←</button><button type="button" data-next aria-label="Next ${label} state">→</button><button type="button" data-reset>Reset</button><label>${label}<input type="range" min="0" max="${max}" step="1" value="${value}" aria-label="${label}"></label></div>`;
const figure=(kind,title,sub,controls,body)=>`<figure class="cuda-lab cuda-${kind}" data-cuda-lab="${kind}"><figcaption><strong>${title}</strong><span>${sub}</span></figcaption>${controls}<div data-cuda-body>${body}</div></figure>`;
export function threadBody(n=130,block=2,warp=0,lane=0){
 const m=threadMap(n,block,warp,lane),s=m.selected;
 const sms=[0,1].map(sm=>`<div class="cuda-sm"><header>SM ${sm} <small>two illustrative block slots</small></header>${[0,1].map(slot=>{const b=m.wave*4+slot*2+sm;return b<m.blocks?`<div class="cuda-block ${b===block?'is-selected':''}"><b>Block ${b}</b><span>Warp ${b===block&&warp===0?'<mark>0</mark>':'0'} · 32 lanes<br>Warp ${b===block&&warp===1?'<mark>1</mark>':'1'} · 32 lanes</span></div>`:'<div class="cuda-slot">No block assigned</div>';}).join('')}</div>`).join('');
 return `<div class="cuda-dispatch"><div class="cuda-launch"><b>Grid · ${m.blocks} blocks × 64 threads</b><span>${m.launched} launched · ${n} valid outputs</span><small>Illustrative dispatch wave ${m.wave+1}: blocks ${m.activeBlocks.join(', ')}</small></div><div class="cuda-sm-floor">${sms}</div></div><div class="cuda-lane-heading">Inspect warp ${warp} in block ${block} · select a lane. Hatched cells are masked.</div><div class="cuda-lanes">${m.lanes.map(t=>`<button type="button" data-lane="${t.lane}" aria-pressed="${t.lane===lane}" class="${t.valid?'':'is-masked'}" aria-label="Lane ${t.lane}, output index ${t.index}, ${t.valid?'valid':'masked'}"><small>lane ${t.lane}</small><b>${t.index}</b></button>`).join('')}</div>${status(`<b>Block ${block} → warp ${warp} → lane ${lane} → index ${s.index}.</b> ${s.valid?`A[${s.index}]=${s.a} + B[${s.index}]=${s.b} gives C[${s.index}]=${s.result}.`:`Index ${s.index} is outside N=${n}. The bounds guard prevents every load and store for this lane.`}`)}`;
}
export function sectorBody(pattern='contiguous',lane=0){
 const m=sectorAccess(pattern),selected=m.accesses[lane];if(!selected)throw new RangeError('lane');
 const h=160+Math.ceil(m.sectors.length/8)*62;
 let b=txt(18,18,'32 lanes issue one 4-byte load each','cuda-axis');
 for(const a of m.accesses){const x=18+a.lane*20.5;b+=`<rect x="${x}" y="30" width="18" height="25" class="${a.lane===lane?'cuda-hot':'cuda-lane-mark'}"/>`+txt(x+9,47,a.lane,'cuda-center');}
 for(const [i,sector]of m.sectors.entries()){
  const x=18+(i%8)*84,y=125+Math.floor(i/8)*62;
  b+=`<rect x="${x}" y="${y}" width="75" height="48" class="cuda-sector"/>`+txt(x+5,y+17,`S${sector.index}`);
  for(let word=0;word<8;word++){const address=sector.index*8+word;b+=`<rect x="${x+5+word*8}" y="${y+27}" width="7" height="12" class="${address===selected.word?'cuda-hot':sector.words.includes(address)?'cuda-loaded':'cuda-empty'}"/>`;}
 }
 const selectedIndex=m.sectors.findIndex(s=>s.index===selected.sector),endX=18+(selectedIndex%8)*84+37,endY=125+Math.floor(selectedIndex/8)*62;
 b+=`<path d="M${27+lane*20.5},58 C${27+lane*20.5},80 ${endX},80 ${endX},${endY-4}" class="cuda-address-wire"/>`;
 return status(`<b>${m.sectors.length} sectors × 32 B = ${m.bytes} B requested.</b> 128 B of unique values used · ${(100*m.efficiency).toFixed(0)}% sector utilization.`)+svg(h,'Lane addresses and requested memory sectors',b)+status(`Lane ${lane} requests float ${selected.word}, byte offset ${selected.byte}, in sector ${selected.sector}. Each small sector cell is one float. Reverse lane order preserves the aligned sector set.`);
}
export function bankBody(pattern='column',round=0){
 const m=bankAccess(pattern);if(!Number.isInteger(round)||round<0||round>m.rounds)throw new RangeError('bank round');
 let b=txt(18,20,'One distinct word request per occupied cell; vertical stacks serialize','cuda-axis');
 for(const bank of m.banks){const x=27+bank.bank*20;
  b+=`<line x1="${x+8}" y1="45" x2="${x+8}" y2="307" class="cuda-rail"/>`;
  for(const [q,request]of bank.requests.entries())b+=`<rect x="${x}" y="${298-q*8}" width="16" height="7" class="${q<round?'cuda-loaded':'cuda-pending'}"><title>Bank ${bank.bank}, word ${request.word}, lanes ${request.lanes.join(', ')}</title></rect>`;
  b+=txt(x+8,329,bank.bank,'cuda-center');
 }
 if(round)b+=`<line x1="20" y1="${302-(round-1)*8}" x2="675" y2="${302-(round-1)*8}" class="cuda-service-line"/>`;
 b+=txt(18,354,'Bank index 0–31 · blue = served, burgundy = waiting','cuda-axis');
 const served=m.banks.flatMap(bank=>bank.requests[round-1]?[bank.requests[round-1]]:[]);
 return status(`<b>${m.rounds} logical service ${m.rounds===1?'round':'rounds'}.</b> Showing ${round}/${m.rounds}. ${pattern==='broadcast'?'All 32 readers share one word request.':`${m.banks.filter(b=>b.requests.length).length} banks receive requests.`}`)+svg(370,'Shared-memory bank queues for one warp',b)+status(round?`Round ${round} serves ${served.length} distinct word ${served.length===1?'request':'requests'}. ${pattern==='broadcast'?'The requested word is broadcast to all 32 lanes.':`Examples: words ${served.slice(0,4).map(r=>r.word).join(', ')}${served.length>4?'…':''}.`} Queue order is illustrative; rounds are not measured cycles.`:'No requests have been served yet. Different words in one bank queue separately. Readers of one identical word share a request.');
}
const matrix=(name,rows,cellClass=()=>'',owner=()=>'',small=false)=>`<div class="cuda-matrix-wrap"><b>${name}</b><div class="cuda-matrix ${small?'cuda-small-matrix':''}" style="--cols:${rows[0]?.length||1}">${rows.length?rows.map((row,r)=>row.map((v,c)=>`<span class="${cellClass(r,c)}"><b>${v===null?'·':v}</b>${owner(r,c)?`<small>${owner(r,c)}</small>`:''}</span>`).join('')).join(''):'<span class="cuda-empty-tray">Not loaded</span>'}</div></div>`;
export function gemmBody(strategy='shared',stage=0){
 const m=gemmState(strategy,stage),inputA=(r,c)=>stage&&r<m.tile&&c>=m.kStart&&c<m.kStart+2?'is-resident':'',inputB=(r,c)=>stage&&c<m.tile&&r>=m.kStart&&r<m.kStart+2?'is-resident':'';
 const owner=(r,c)=>r<m.tile&&c<m.tile?`T${strategy==='register'?Math.floor(r/2)*2+Math.floor(c/2):r*m.tile+c}`:'';
 const captions=['Select the top-left output tile. No operands have moved.','Load operands for k=0,1. The blue cells now have local copies.','Accumulate k=0,1. C[0,0] currently contains 1×1 + 2×0 = 1.','Reuse the staging space for k=2,3 after all prior readers finish.','Accumulate k=2,3. C[0,0] becomes 1 + 3×2 + 4×1 = 11.'];
 return status(`<b>Stage ${stage}/4.</b> ${captions[stage]}`)+`<div class="cuda-gemm-inputs">${matrix('A · global memory',matrixA,inputA)}<span class="cuda-times">×</span>${matrix('B · global memory',matrixB,inputB)}</div><div class="cuda-residency"><header>${strategy==='naive'?'Direct operands → registers':'Global memory → shared staging → registers'}</header><div class="cuda-gemm-trays" style="--staging-rows:${Math.max(2,m.tile)}">${matrix('A operands',m.aTile,()=>'',()=>'',true)}${matrix('B operands',m.bTile,()=>'',()=>'',true)}</div></div><div class="cuda-gemm-output">${matrix('C accumulators · selected block',m.partial,(r,c)=>r<m.tile&&c<m.tile?'is-accumulator':'',(r,c)=>owner(r,c))}<div class="cuda-ownership"><b>${m.tile}×${m.tile} output block</b><p>${m.threads} ${m.threads===1?'thread':'threads'} · ${m.accumulators} output ${m.accumulators===1?'accumulator':'accumulators'} per thread.</p><p>For the full 4×4 product: <strong>${m.globalLoads} global float loads</strong>${m.sharedReads?` and ${m.sharedReads} shared operand reads`:''}.</p></div></div>`+status('The full-product counts exclude 16 final C stores and ignore caches. Larger register tiles also enlarge this example’s block tile. T labels identify output owners; the scene does not claim a measured speedup.');
}
export function pipelineBody(load=3,compute=2,tiles=4,time=10){
 const m=pipelineSchedule(load,compute,tiles);if(!Number.isInteger(time)||time<0||time>m.serialEnd)throw new RangeError('pipeline time');
 const x=t=>112+t*560/m.serialEnd,bar=(a,b,y,cls,label)=>`<rect x="${x(a)}" y="${y}" width="${Math.max(1,x(b)-x(a))}" height="24" class="${cls}"/>${x(b)-x(a)>22?txt((x(a)+x(b))/2,y+17,label,'cuda-center'):''}`;
 let b='';
 const lanes=[['Serial copy',58],['Serial compute',96],['Overlap copy',178],['Overlap compute',216],['Buffer A owned',274],['Buffer B owned',312]];
 for(const [label,y]of lanes){b+=txt(8,y+17,label,'cuda-axis')+`<line x1="112" y1="${y+25}" x2="672" y2="${y+25}" class="cuda-rail"/>`;}
 for(const t of m.serial)b+=bar(t.loadStart,t.loadEnd,58,'cuda-loaded',t.tile)+bar(t.computeStart,t.computeEnd,96,'cuda-pending',t.tile);
 for(const t of m.parallel){b+=bar(t.loadStart,t.loadEnd,178,'cuda-loaded',t.tile)+bar(t.computeStart,t.computeEnd,216,'cuda-pending',t.tile);const y=274+t.slot*38;b+=bar(t.loadStart,t.computeEnd,y,'cuda-owned',t.tile);}
 for(let i=0;i<=4;i++){const t=i*m.serialEnd/4;b+=txt(x(t),25,Number(t.toFixed(1)),'cuda-center');}
 b+=txt(112,362,'Illustrative time units · numbers inside blocks identify tiles','cuda-axis')+`<line x1="${x(time)}" y1="35" x2="${x(time)}" y2="342" class="cuda-time-cursor"/>`;
 const owners=[0,1].map(slot=>{const t=m.parallel.find(t=>t.slot===slot&&t.loadStart<=time&&time<t.computeEnd);return `${slot?'B':'A'}: ${t?`tile ${t.tile} ${time<t.loadEnd?'loading':time<t.computeStart?'ready, waiting':'being read'}`:'free'}`;});
 return status(`<b>Serial finishes at ${m.serialEnd}; two buffers finish at ${m.parallelEnd}.</b> Cursor t=${time}. ${owners.join(' · ')}.`)+svg(380,'Copy compute overlap and buffer ownership timeline',b)+status('A buffer stays owned from the start of its load until its final compute read finishes. Copy and compute use separate ideal resources. No setup cost, contention or GPU performance measurement is modeled.');
}
export function reductionBody(stage=0){
 const m=reductionState(stage);let b=txt(18,20,'32 values · a sum tree, not a shuffle timing model','cuda-axis');
 for(const t of m.transfers){const from=27+t.from*20.5,to=27+t.to*20.5;b+=`<path d="M${from},130 Q${(from+to)/2},${Math.max(35,120-(t.from-t.to)*4)} ${to},130" class="cuda-reduce-edge"/>`;}
 for(let i=0;i<32;i++){const x=18+i*20.5;b+=`<rect x="${x}" y="135" width="18" height="28" class="${i<m.active?'cuda-loaded':'cuda-inactive'}"/>`+txt(x+9,154,m.values[i],'cuda-center')+txt(x+9,184,i,'cuda-center');}
 b+=txt(18,214,'Lane index · only the active prefix contains current partial results','cuda-axis');
 return status(`<b>Stage ${stage}/5 · ${m.active} active partial ${m.active===1?'sum':'sums'}.</b> ${stage===5?'Lane 0 holds 528 = the sum of 1 through 32.':'Each tree level combines two previously disjoint sets of contributions.'}`)+svg(235,'Warp sized reduction tree with partial sums',b);
}
export function cudaScenes(){return {
 swizzle:swizzleFigure(),
 cache:figure('cache','A different route through the same matrix','Cross-tile reuse · a deliberately simplified cache',choices('Output tile traversal',cachePatterns,'row-major')+`<div class="cuda-controls"><label>Operand-tile slots<select data-capacity aria-label="Teaching cache capacity">${[2,4,6,8].map(n=>option(n,n,4)).join('')}</select></label></div>`+controls('Tile visit',15),cacheBody()),
 thread:figure('thread','Follow one thread through the machine','Ownership map · synthetic 2-SM dispatch, not a device scheduler',`<div class="cuda-controls"><label>Outputs N<select data-n aria-label="Vector length">${[65,130,257,1024].map(n=>option(n,n,130)).join('')}</select></label><label>Block<select data-block aria-label="Block index">${[0,1,2].map(n=>option(n,n,2)).join('')}</select></label><label>Warp<select data-warp aria-label="Warp in block">${[0,1].map(n=>option(n,n,0)).join('')}</select></label></div>`,threadBody()),
 sector:figure('sector','Follow the addresses, not the lane order','Address connections · 32 lanes, 4-byte aligned floats, 32-byte sectors',choices('Global access pattern',accessPatterns,'contiguous')+controls('Selected memory lane',31),sectorBody()),
 bank:figure('bank','Watch one bank queue while its neighbors sit idle','Bank queue rack · one scalar 32-bit read per lane',choices('Shared access pattern',bankPatterns,'column')+controls('Bank service progress',100),bankBody()),
 gemm:figure('gemm','Move a tile into residence, then reuse it','Residency walkthrough · exact 4×4 FP32-style arithmetic',choices('Matrix kernel strategy',gemmStrategies,'shared')+controls('Matrix stage',4),gemmBody()),
 pipeline:figure('pipeline','Two buffers turn a sequence into a pipeline','Resource timeline · illustrative units, not microseconds',`<div class="cuda-controls"><label>Load duration<select data-load aria-label="Tile load duration">${[1,2,3,4,5,6].map(n=>option(n,n,3)).join('')}</select></label><label>Compute duration<select data-compute aria-label="Tile compute duration">${[1,2,3,4,5,6].map(n=>option(n,n,2)).join('')}</select></label><label>Tiles<select data-tiles aria-label="Pipeline tile count">${[2,3,4,5,6].map(n=>option(n,n,4)).join('')}</select></label></div>`+controls('Pipeline time progress',100,50),pipelineBody()),
 reduction:figure('reduction','Fold 32 contributions into one result','Contribution tree · inactive lanes do not hold final outputs',controls('Reduction stage',5),reductionBody())
};}
export function mountCudaScenes(article){
 for(const lab of article.querySelectorAll('[data-cuda-lab]')){
  const kind=lab.dataset.cudaLab,body=lab.querySelector('[data-cuda-body]'),slider=lab.querySelector('input[type="range"]');let lane=0,pattern=kind==='sector'?'contiguous':kind==='bank'?'column':kind==='cache'?'row-major':'shared',last='';
  const get=selector=>Number(lab.querySelector(selector).value);
  function draw(){
   const progress=slider?Number(slider.value):0;
   if(slider){lab.querySelector('[data-prev]').disabled=progress<=0;lab.querySelector('[data-next]').disabled=progress>=Number(slider.max);}
   const effective=kind==='bank'?Math.round(progress*bankAccess(pattern).rounds/100):kind==='pipeline'?Math.round(progress*pipelineSchedule(get('[data-load]'),get('[data-compute]'),get('[data-tiles]')).serialEnd/100):progress;
   const key=JSON.stringify([effective,lane,pattern,...[...lab.querySelectorAll('select')].map(e=>e.value)]);if(key===last)return;last=key;
   let html;
   if(kind==='thread')html=threadBody(get('[data-n]'),get('[data-block]'),get('[data-warp]'),lane);
   if(kind==='sector')html=sectorBody(pattern,progress);
   if(kind==='bank')html=bankBody(pattern,Math.round(progress*bankAccess(pattern).rounds/100));
   if(kind==='gemm')html=gemmBody(pattern,progress);
   if(kind==='pipeline'){const m=pipelineSchedule(get('[data-load]'),get('[data-compute]'),get('[data-tiles]'));html=pipelineBody(m.load,m.compute,m.tiles,Math.round(progress*m.serialEnd/100));}
   if(kind==='reduction')html=reductionBody(progress);
   if(kind==='cache')html=cacheBody(pattern,get('[data-capacity]'),progress);
   const scroll=body.querySelector('.cuda-scroll'),left=scroll?.scrollLeft||0,focused=scroll===document.activeElement;
   body.innerHTML=html;const next=body.querySelector('.cuda-scroll');if(next){next.scrollLeft=left;if(focused)next.focus({preventScroll:true});}
   if(slider){lab.querySelector('[data-prev]').disabled=progress<=0;lab.querySelector('[data-next]').disabled=progress>=Number(slider.max);}
  }
  const playback=slider?rangePlayback(article,lab,draw,kind==='sector'?18000:kind==='bank'?20000:kind==='pipeline'?16000:10000,slider):null;
  function setPattern(value){pattern=value;for(const b of lab.querySelectorAll('[data-pattern]'))b.setAttribute('aria-pressed',String(b.dataset.pattern===value));}
  lab.addEventListener('click',e=>{
   const button=e.target.closest('button');if(!button)return;
   if(button.dataset.lane!==undefined){lane=Number(button.dataset.lane);draw();lab.querySelector(`[data-lane="${lane}"]`).focus({preventScroll:true});}
   if(button.dataset.pattern){playback?.stop();setPattern(button.dataset.pattern);if(kind==='bank')slider.value='0';draw();}
   if(button.hasAttribute('data-prev')||button.hasAttribute('data-next')){
    playback.stop();const direction=button.hasAttribute('data-next')?1:-1;
    const count=kind==='bank'?bankAccess(pattern).rounds:kind==='pipeline'?pipelineSchedule(get('[data-load]'),get('[data-compute]'),get('[data-tiles]')).serialEnd:Number(slider.max);
    slider.value=String(Math.max(0,Math.min(Number(slider.max),(Math.round(get('input')*count/Number(slider.max))+direction)*Number(slider.max)/count)));draw();
   }
  });
  lab.addEventListener('change',e=>{if(e.target.tagName!=='SELECT')return;playback?.stop();if(kind==='thread'){
   const block=lab.querySelector('[data-block]'),selected=Math.min(Number(block.value),Math.ceil(get('[data-n]')/64)-1);block.innerHTML=Array.from({length:Math.ceil(get('[data-n]')/64)},(_,i)=>option(i,i,selected)).join('');
  }draw();});
  registerReaderState(article,'cuda-'+kind,{
   read:()=>({lane,pattern,progress:slider?Number(slider.value):0,selects:[...lab.querySelectorAll('select')].map(e=>e.value)}),
   validate:s=>{if(!s||!Number.isInteger(s.lane)||s.lane<0||s.lane>31||!Array.isArray(s.selects)||!Number.isInteger(s.progress)||s.progress<0||s.progress>Number(slider?.max||0))return false;
    if(kind==='thread'){const [n,b,w]=s.selects.map(Number);return [65,130,257,1024].includes(n)&&Number.isInteger(b)&&b>=0&&b<Math.ceil(n/64)&&[0,1].includes(w)&&s.selects.length===3&&s.pattern==='shared';}
    if(kind==='cache')return s.selects.length===1&&[2,4,6,8].includes(Number(s.selects[0]))&&cachePatterns.includes(s.pattern);
    if(kind==='pipeline'){const [l,c,t]=s.selects.map(Number);return s.pattern==='shared'&&s.selects.length===3&&[l,c,t].every(Number.isInteger)&&l>=1&&l<=6&&c>=1&&c<=6&&t>=2&&t<=6;}
    return s.selects.length===0&&(kind==='sector'?accessPatterns:kind==='bank'?bankPatterns:kind==='gemm'?gemmStrategies:['shared']).includes(s.pattern);
   },
   write:s=>{playback?.stop();lane=s.lane;setPattern(s.pattern);if(kind==='thread'){const [n,b]=s.selects;lab.querySelector('[data-n]').value=n;lab.querySelector('[data-block]').innerHTML=Array.from({length:Math.ceil(Number(n)/64)},(_,i)=>option(i,i,Number(b))).join('');}for(const [i,e]of [...lab.querySelectorAll('select')].entries())e.value=s.selects[i];if(slider)slider.value=String(s.progress);draw();}
  });
  draw();
 }
}
export function cacheBody(pattern='row-major',capacity=4,stage=0){
 const m=tileTraversal(pattern,capacity),f=m.frames[stage];if(!f)throw new RangeError('cache stage');let b=txt(22,24,'Output tile order · each cell needs one A row tile + one B column tile','cuda-axis');
 const center=([r,c])=>[55+c*67,83+r*67];
 b+=`<path d="M${m.order.map(p=>center(p).join(',')).join(' L')}" class="cuda-cache-path"/>`;
 for(let r=0;r<4;r++)for(let c=0;c<4;c++){const index=m.order.findIndex(p=>p[0]===r&&p[1]===c),x=32+c*67,y=60+r*67;
  b+=`<rect x="${x}" y="${y}" width="47" height="47" class="${index===stage?'cuda-hot':index<stage?'cuda-loaded':'cuda-empty'}"/>`+txt(x+23,y+21,`${r},${c}`,'cuda-center')+txt(x+23,y+39,`#${index+1}`,'cuda-center');
 }
 b+=txt(352,58,`LRU teaching cache · ${capacity} tile slots`,'cuda-axis');
 for(let i=0;i<capacity;i++)b+=`<rect x="352" y="${76+i*29}" width="290" height="25" class="${f.cache[i]?'cuda-loaded':'cuda-empty'}"/>`+txt(364,94+i*29,f.cache[i]||'empty')+txt(628,94+i*29,i===0?'oldest':i===f.cache.length-1?'newest':'','cuda-end');
 b+=txt(352,335,`This tile: ${f.accesses.map(a=>a.key+' '+(a.hit?'hit':'miss')).join(' · ')}`);
 return status(`<b>Visit ${stage+1}/16: C tile (${f.row},${f.col}).</b> So far: ${f.misses} operand-tile loads, ${f.hits} cache hits. Full traversal: ${m.misses} loads.`)+svg(370,'Output tile traversal and operand reuse in an ideal cache',b)+status('Each C tile requests A[row] then B[column]. The unified, fully associative LRU cache starts empty; every operand tile has equal size. This is a controlled-order reuse model, not a prediction of GPU cache misses or block scheduling.');
}
export function swizzleFigure(){
 let b=txt(30,23,'Linear layout','cuda-axis')+txt(388,23,'XOR layout · same 64 chunks','cuda-axis');
 for(const [origin,swizzled]of [[45,false],[403,true]])for(let r=0;r<8;r++)for(let physical=0;physical<8;physical++){
  const logical=swizzled?physical^r:physical,x=origin+physical*28,y=54+r*28;
  b+=`<rect x="${x}" y="${y}" width="25" height="25" class="${logical===3?'cuda-hot':'cuda-empty'}"/>`+txt(x+12.5,y+17,logical,'cuda-center');
 }
 b+=txt(45,307,'Column 3: one bank group repeatedly','cuda-axis')+txt(403,307,'Column 3: eight different bank groups','cuda-axis');
 return `<figure class="cuda-lab cuda-swizzle"><figcaption><strong>Permute the storage, keep the logical matrix</strong><span>Eight rows of eight 16-byte chunks · numbers identify logical columns</span></figcaption>${svg(330,'XOR swizzle maps logical column three to distinct physical bank groups',b)}<p class="cuda-reading">The highlighted logical column is unchanged. Row r moves chunk c to physical chunk c XOR r. The eight readers track the first 32-bit word of each highlighted chunk. The left addresses share a bank; the right addresses use distinct banks. This illustrates one aligned swizzle region, not an entire Tensor Core instruction.</p></figure>`;
}
