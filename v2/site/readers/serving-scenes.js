import {kvFootprint,pagedPrefixes,decodeSchedule} from './serving-model.js';
import {rangePlayback} from './topic-tools.js';
const n=x=>Number(x.toFixed(3)).toString();
const text=(x,y,s,color='#e4e2ed')=>`<text x="${x}" y="${y}" style="fill:${color}">${s}</text>`;
const plot=(label,height,body)=>`<div class="serving-plot" role="region" tabindex="0" aria-label="${label}"><svg viewBox="0 0 700 ${height}" role="img" aria-label="${label}">${body}</svg></div>`;
export function servingKVBody(exponent=13,batch=1,heads=8,bytes=2){
 const tokens=2**exponent,r=kvFootprint(Array(batch).fill(tokens),Array.from({length:32},()=>({heads,dim:128,bytes}))),gib=r.bytes/2**30,capacity=Math.floor(32/(gib/batch));
 return plot('KV storage by sequence, not by query head',250,text(25,30,'32 layers · head width 128 · separate K and V')+text(25,65,`${batch} sequence(s) × ${tokens} resident tokens`)+text(25,100,`${heads} KV heads × ${bytes} byte(s) per element`)+`<rect x="25" y="135" width="650" height="35" rx="8" fill="#493847"/><rect x="25" y="135" width="${650*Math.min(gib/32,1)}" height="35" rx="8" fill="#c8dff4"/>`+text(25,200,`${n(gib)} GiB KV / illustrative 32 GiB KV budget`)+text(25,232,gib>32?'Demand exceeds this assigned budget.':'This is cache capacity, not a bandwidth measurement.'))+`<p data-serving-result>Tokens=${tokens}; batch=${batch}; KV heads=${heads}; bytes/element=${bytes}; cache bytes=${r.bytes}; GiB=${n(gib)}; ideal sequence capacity=${capacity}.</p><p>The assigned 32 GiB budget is already net of weights and other allocations. The capacity calculation assumes identical lengths and no fragmentation. GQA changes KV heads, not the number of queries. Changing this control describes another architecture, not an inference-only setting for one checkpoint.</p>`;
}
export function servingPagesBody(block=4,common=8,separate=false){
 const a=Array.from({length:12},(_,i)=>i+1),b=a.map((x,i)=>i<common?x:100+x);
 const r=pagedPrefixes([{namespace:'A',tokens:a},{namespace:separate?'B':'A',tokens:b}],block);
 let body=text(25,30,`Two 12-token histories · block ${block} · common prefix ${common}`);
 r.tables.forEach((row,i)=>{body+=text(25,75+i*55,`Request ${i}: ${row.map(id=>'P'+id).join(' → ')}`);});
 body+=text(25,195,`${r.pages.length} physical pages · ${r.savedTokens} shared token positions`);
 const perRow=8,height=270+Math.ceil(r.pages.length/perRow)*60;
 r.pages.forEach((page,i)=>{const x=25+(i%perRow)*82,y=225+Math.floor(i/perRow)*60;body+=`<rect x="${x}" y="${y}" width="74" height="45" rx="6" fill="${page.owners.length>1?'#713649':'#312735'}" stroke="#c8dff4"/>`+text(x+6,y+17,`P${page.id}`)+text(x+6,y+35,`refs ${page.owners.length}`);});
 return plot('Logical request tables map to physical prefix pages',height,body)+`<p data-serving-result>Block=${block}; common=${common}; namespace=${separate?'different':'same'}; logical=${r.logicalTokens}; physical=${r.physicalTokens}; allocated=${r.allocatedTokens}; padding=${r.padding}; saved=${r.savedTokens}.</p><p>Only immutable complete blocks share in this example. Identity includes the model/cache namespace and the entire earlier token prefix. Matching one isolated token block is insufficient. Page tables preserve each request's token order; ownership counts explain when a shared page can be freed.</p>`;
}
export const servingExampleRequests=[{arrival:0,output:4},{arrival:0,output:1},{arrival:0,output:2}];
export function servingScheduleBody(policy='continuous',capacity=2,stage=0){
 const r=decodeSchedule(servingExampleRequests,capacity,policy),index=Math.floor(Math.min(Math.max(stage,0),6)*(r.frames.length-1)/6),f=r.frames[index];
 let body=text(25,30,`${policy} admission · ${capacity} slots · equal-duration toy steps`);
 r.frames.forEach((frame,t)=>{const x=125+t*70;body+=text(x,62,`${t}→${t+1}`);for(let id=0;id<3;id++){const on=frame.running.includes(id);body+=`<rect x="${x}" y="${85+id*55}" width="58" height="38" rx="7" fill="${on?(t===index?'#c8dff4':'#713649'):'#312735'}" stroke="#796079"/>`+text(x+18,109+id*55,on?'●':'—',on&&t===index?'#241c2c':'#e4e2ed');}});
 for(let id=0;id<3;id++)body+=text(25,109+id*55,`Request ${id}`);
 body+=text(25,280,`Step ${f.time}: runs [${f.running}] · admits [${f.admitted}] · finishes [${f.finished}]`);
 return plot('Decode admission across unequal output lengths',315,body)+`<p data-serving-result>Policy=${policy}; capacity=${capacity}; position=${stage}/6; step=${f.time}; makespan=${r.steps}; tokens=${r.tokens}; active=[${f.running}]; completed now=[${f.finished}].</p><p>Requests need 4, 1 and 2 output tokens. All arrive at time zero and are already prefilled. Continuous admission fills released slots on the next step; static admission waits for the batch to finish. The control spans the current timeline; adjacent positions can select the same step. No GPU speedup is measured: real step time changes with batch, context and prefill scheduling.</p>`;
}
export function servingScenes(){return{
 kv:`<div class="topic-scene" data-serving-lab="kv"><h3>One sequence can fit while the batch cannot</h3><label>Context length, power of two<input aria-label="Serving context exponent" data-length type="range" min="10" max="20" value="13" step="1"></label><label>Sequences<select aria-label="Serving cache batch" data-batch>${[1,4,16,64].map(v=>`<option>${v}</option>`).join('')}</select></label><label>KV heads<select aria-label="Serving KV heads" data-heads><option>1</option><option selected>8</option><option>32</option></select></label><label>Cache bytes per element<select aria-label="Serving cache bytes" data-bytes><option>1</option><option selected>2</option></select></label><div data-output>${servingKVBody()}</div></div>`,
 pages:`<div class="topic-scene" data-serving-lab="pages"><h3>Share histories, not merely equal blocks</h3><label>Tokens per page<select aria-label="Serving page size" data-block>${[1,2,4,8].map(v=>`<option${v===4?' selected':''}>${v}</option>`).join('')}</select></label><label>Common prefix length<select aria-label="Serving shared prefix" data-common>${[0,4,8].map(v=>`<option${v===8?' selected':''}>${v}</option>`).join('')}</select></label><label>Cache namespace<select aria-label="Serving cache namespace" data-namespace><option value="same">Same model and cache contract</option><option value="different">Different model/cache namespace</option></select></label><div data-output>${servingPagesBody()}</div></div>`,
 schedule:`<div class="topic-scene" data-serving-lab="schedule"><h3>A short request releases a decode slot</h3><label>Admission policy<select aria-label="Serving admission policy" data-policy><option value="continuous">Continuous</option><option value="static">Static batch</option></select></label><label>Decode slots<select aria-label="Serving decode slots" data-capacity>${[1,2,3].map(v=>`<option${v===2?' selected':''}>${v}</option>`).join('')}</select></label><label>Timeline position<input aria-label="Serving timeline position" data-stage type="range" min="0" max="6" step="1" value="0"></label><div class="dense-actions"><button data-play>Play</button><button data-reset>Replay</button></div><div data-output>${servingScheduleBody()}</div></div>`
};}
export function mountServingScenes(article){for(const lab of article.querySelectorAll('[data-serving-lab]')){
 const output=lab.querySelector('[data-output]'),value=s=>Number(lab.querySelector(s).value);
 if(lab.dataset.servingLab==='schedule'){
  const slider=lab.querySelector('[data-stage]');
  const draw=()=>{output.innerHTML=servingScheduleBody(lab.querySelector('[data-policy]').value,value('[data-capacity]'),Number(slider.value));};
  const playback=rangePlayback(article,lab,draw,12000,slider);
  for(const select of lab.querySelectorAll('select'))select.addEventListener('change',()=>{playback.stop();draw();});
 }else{
  const draw=()=>{output.innerHTML=lab.dataset.servingLab==='kv'?servingKVBody(value('[data-length]'),value('[data-batch]'),value('[data-heads]'),value('[data-bytes]')):servingPagesBody(value('[data-block]'),value('[data-common]'),lab.querySelector('[data-namespace]').value==='different');};
  for(const control of lab.querySelectorAll('input,select'))control.addEventListener(control.tagName==='SELECT'?'change':'input',draw);draw();
 }
}}
