import {profilerPhase,intervalAccounting,launchTimeline} from './profiling-model.js';
import {rangePlayback} from './topic-tools.js';
const n=x=>Number(x.toFixed(3)).toString();
const text=(x,y,t,color='#f0e7ef')=>`<text x="${x}" y="${y}" fill="${color}">${t}</text>`;
const svg=(label,body)=>`<div class="profiling-plot" tabindex="0" role="region" aria-label="${label}"><svg viewBox="0 0 620 300" role="img" aria-label="${label}">${body}</svg></div>`;
export function profilingScheduleBody(wait=1,warmup=2,active=3,repeat=1){
 const colors={wait:'#66596a',warmup:'#ab7890',record:'#bddaf4',done:'#3c3141'},phases=Array.from({length:21},(_,i)=>profilerPhase(i,{wait,warmup,active,repeat}));
 const cells=phases.map((r,i)=>{const x=16+(i%7)*84,y=45+Math.floor(i/7)*72,color=r.phase==='record'?'#251b2b':'#f0e7ef';return`<rect x="${x}" y="${y}" width="76" height="60" rx="6" fill="${colors[r.phase]}"/>`+text(x+7,y+20,`Step${i}`,color)+text(x+7,y+41,r.save?'save':r.phase,color);}).join('');
 const retained=phases.flatMap((r,i)=>r.phase==='record'?[i]:[]),saves=phases.flatMap((r,i)=>r.save?[i]:[]);
 return svg('Assigned profiling phases by iteration',text(16,24,'Independent iteration index, not wall-clock time')+cells)+`<p data-profiling-result>wait=${wait}; warmup=${warmup}; active=${active}; repeat=${repeat}; recorded steps=${retained.join(',')}; saves=${saves.join(',')}.</p><p>Wait runs without collection; warmup prepares collection; record retains events. The last active step requests saving. External application warmup happens before this schedule and is a separate operation.</p>`;
}
export function profilingOverlapBody(offset=2){
 const events=[[0,4],[offset,offset+4]],r=intervalAccounting(events,0,12);
 const bar=(a,b,y,color)=>`<rect x="${80+a*42}" y="${y}" width="${(b-a)*42}" height="35" rx="5" fill="${color}"/>`;
 return svg('Two independent stream intervals and their union',text(15,55,'StreamA')+bar(0,4,35,'#ba879b')+text(15,125,'StreamB')+bar(offset,offset+4,105,'#bddaf4')+text(15,205,'Union')+r.merged.map(([a,b])=>bar(a,b,185,'#bddaf4')).join('')+[0,4,8,12].map(t=>text(80+t*42,255,`${t}ms`)).join(''))+`<p data-profiling-result>Offset=${offset}ms; summed durations=${r.sum}ms; union busy=${r.busy}ms; double-counted overlap=${r.overlap}ms; idle in fixed12ms window=${r.idle}ms.</p><p>Two independent assigned4ms intervals. The sum stays8ms while overlap and the union change. A union of kernel-active intervals is not SM utilization, useful work, or a measurement of resource contention.</p>`;
}
export function profilingLaunchBody(launch=10,sync='async',step=5){
 const r=launchTimeline({count:5,launchMS:launch/10,kernelMS:2,synchronizeEach:sync==='sync'}),x=t=>100+t*15;
 const bar=(e,y,color)=>`<rect x="${x(e[0])}" y="${y}" width="${(e[1]-e[0])*15}" height="38" fill="${color}"/>`;
 return svg('Assigned CPU submission and serial GPU execution',text(15,50,'CPU API')+r.cpu.slice(0,step).map(e=>bar(e,30,'#ba879b')).join('')+text(15,130,'GPU work')+r.gpu.slice(0,step).map(e=>bar(e,110,'#bddaf4')).join('')+r.cpu.slice(0,step).map((e,i)=>`<path d="M${x(e[1])} 68L${x(r.gpu[i][0])} 110" stroke="#a48da6" fill="none"/>`).join('')+[0,5,10,15,20,25,30].map(t=>text(x(t),185,`${t}`)).join('')+text(100,215,'Time(ms); connecting lines identify launch→kernel ownership.')+text(100,255,`Reveal:${step}/5 launches. Full model completion:${n(r.end)}ms`))+`<p data-profiling-result>Launch cost=${n(launch/10)}ms; mode=${sync}; reveal=${step}/5; full completion=${n(r.end)}ms; GPU kernel sum=${n(r.deviceAccounting.sum)}ms; GPU idle=${n(r.deviceAccounting.idle)}ms; CPU launch sum=${n(r.hostAccounting.sum)}ms.</p><p>${sync==='sync'?'The host waits for each kernel before submitting the next. These inserted waits change the schedule.':launch/10<=2?'After the first launch, the assigned GPU work can remain continuously fed. A dense lane alone does not say whether the kernels are compute- or memory-bound.':'The host takes longer to submit each kernel than the assigned GPU takes to execute it. Recurring gaps remain after startup.'} Reveal is an explanatory stage, not physical playback time. No queue, contention, transfer or measured speedup is inferred.</p>`;
}
const options=(max,start=0,selected=start)=>Array.from({length:max-start+1},(_,i)=>`<option value="${i+start}"${i+start===selected?" selected":""}>${i+start}</option>`).join("");
export function profilingScenes(){return{
 schedule:`<div class="topic-scene" data-profiling-lab="schedule"><h3>Separate application warmup from profiler phases</h3><label>Wait iterations<select aria-label="Profiling wait iterations">${options(3,0,1)}</select></label><label>Warmup iterations<select aria-label="Profiling warmup iterations">${options(3,0,2)}</select></label><label>Active iterations<select aria-label="Profiling active iterations">${options(4,1,3)}</select></label><label>Repeat cycles<select aria-label="Profiling repeat cycles">${options(2,1)}</select></label><div data-body>${profilingScheduleBody(1,2,3,1)}</div></div>`,
 overlap:`<div class="topic-scene" data-profiling-lab="overlap"><h3>Summed duration is not elapsed time</h3><label>Second-stream start(ms)<input aria-label="Profiling stream offset" type="range" min="0" max="8" step="1" value="2"></label><div data-body>${profilingOverlapBody()}</div></div>`,
 launch:`<div class="topic-scene" data-profiling-lab="launch"><h3>Follow a launch to the kernel it submits</h3><label>CPU launch cost ×10(ms)<input aria-label="Profiling launch cost" data-cost type="range" min="0" max="40" step="1" value="10"></label><label>Submission policy<select aria-label="Profiling submission policy"><option value="async">Asynchronous submission</option><option value="sync">Wait after every kernel</option></select></label><label>Reveal launch ownership<input aria-label="Profiling launch reveal" data-stage type="range" min="0" max="5" step="1" value="5"></label><div class="dense-actions"><button data-play>Play</button><button data-reset>Replay</button></div><div data-body>${profilingLaunchBody()}</div></div>`
};}
export function mountProfilingScenes(article){
 for(const lab of article.querySelectorAll('[data-profiling-lab]')){
  const body=lab.querySelector('[data-body]');
  if(lab.dataset.profilingLab==='launch'){
   const cost=lab.querySelector('[data-cost]'),mode=lab.querySelector('select'),stage=lab.querySelector('[data-stage]'),draw=()=>{body.innerHTML=profilingLaunchBody(Number(cost.value),mode.value,Math.round(Number(stage.value)));};
   const playback=rangePlayback(article,lab,draw,12000,stage);for(const el of[cost,mode])el.addEventListener(el.tagName==='SELECT'?'change':'input',()=>{playback.stop();draw();});
  }else if(lab.dataset.profilingLab==='schedule'){
   const selects=[...lab.querySelectorAll('select')],draw=()=>{body.innerHTML=profilingScheduleBody(...selects.map(x=>Number(x.value)));};for(const s of selects)s.addEventListener('change',draw);draw();
  }else{const slider=lab.querySelector('input'),draw=()=>{body.innerHTML=profilingOverlapBody(Number(slider.value));};slider.addEventListener('input',draw);draw();}
 }
}
