import {rangePlayback} from "./topic-tools.js";
import {bellmanTrace,clippedSurrogate,groupAdvantages,binarySampling,ptgsTemperature} from "./rl-model.js";
const fmt=x=>Number(x.toFixed(4)).toString();
const percent=x=>fmt(100*x)+"%";
const controls="<div class='dense-actions'><button data-play>Play</button><button data-reset>Replay</button></div>";
function bars(rows){
 return "<div class='rl-bars'>"+rows.map(([label,value])=>"<div><span>"+label+"</span><div class='rl-track'><span style='width:"+100*value+"%'></span></div><code>"+percent(value)+"</code></div>").join("")+"</div>";
}
export function bellmanBody(step=0){
 const s=bellmanTrace(3)[step];
 return "<div class='rl-values'>"+s.values.map((v,i)=>"<div><span>State "+i+"</span><strong>"+fmt(v)+"</strong><small>"+s.actions[i]+"</small></div>").join("")+"</div><p>Sweep "+step+". "+(step===0?"Start at zero. State 0 can cash out for .4 or continue. State 1 can cash out for 1 or wait at cost −.1.":step===1?"State 1 now has value 1. State 0 still used the preceding zero estimate, so cashing out wins.":"The downstream reward has reached state 0. Continuing is now worth .9, more than cashing out for .4.")+"</p><p>Discount γ=.9; fixed terminal value 0. Each sweep reads only the preceding values.</p>";
}
export function clipBody(ratio=1,advantage=1){
 const m=clippedSurrogate(ratio,advantage),x=r=>50+(r-.1)/3.9*450,y=j=>190-j*38;
 const raw=[],actual=[];
 for(let i=1;i<=80;i++){
 const r=.1+3.9*(i-1)/79;raw.push(x(r)+","+y(r*advantage));actual.push(x(r)+","+y(clippedSurrogate(r,advantage).objective));
 }
 return "<div class='rl-plot' tabindex='0' role='region' aria-label='Scrollable signed clipping graph'><svg viewBox='0 0 540 410' role='img' aria-label='Objective versus assigned probability ratio. Dashed line is ordinary ratio times advantage; solid line is the clipped surrogate.'><line x1='50' y1='190' x2='505' y2='190' stroke='#8e8491'/><line x1='50' y1='32' x2='50' y2='347' stroke='#8e8491'/>"+[.8,1.2].map(r=>"<line x1='"+x(r)+"' y1='32' x2='"+x(r)+"' y2='347' stroke='#8e8491' stroke-dasharray='3 5'/><text x='"+x(r)+"' y='366' text-anchor='middle'>"+r+"</text>").join("")+"<polyline points='"+raw.join(" ")+"' fill='none' stroke='#cf879e' stroke-width='2' stroke-dasharray='6 5'/><polyline points='"+actual.join(" ")+"' fill='none' stroke='#bfdff2' stroke-width='3'/><circle cx='"+x(ratio)+"' cy='"+y(m.objective)+"' r='6' fill='#bfdff2' stroke='#f4edf1'/><text x='500' y='366' text-anchor='end'>4</text><text x='50' y='366'>0.1</text><text x='280' y='397' text-anchor='middle'>Assigned ratio ρ — not training time</text><text x='56' y='27'>Maximized objective: "+(advantage>0?"positive":advantage<0?"negative":"zero")+" advantage</text></svg></div><p>ρ="+fmt(ratio)+", A="+fmt(advantage)+", bounds[.8,1.2]. Ordinary ρA="+fmt(m.raw)+"; surrogate="+fmt(m.objective)+".</p><p>Gradient with respect to log ρ: "+(m.kink?"boundary is nondifferentiable":fmt(m.logRatioGradient))+". "+(m.active?"The beneficial-side branch is flat.":advantage===0?"Zero task advantage supplies no directional pressure.":"The ordinary branch is active; this can remain true outside the clipping interval.")+"</p><p>Dashed burgundy: ρA. Solid blue: min(ρA,clip(ρ)A). This is one score coordinate, not a guarantee about a complete parameter update.</p>";
}
export function groupBody(successes=2){
 const rewards=Array.from({length:4},(_,i)=>i<successes?1:0),m=groupAdvantages(rewards);
 return "<div class='rl-group'>"+rewards.map((r,i)=>"<div><span>Response "+(i+1)+"</span><strong>"+(r?"Success":"Failure")+"</strong><span>Reward "+r+"</span><code>A="+fmt(m.normalized[i])+"</code><small>RLOO="+fmt(m.rloo[i])+"</small></div>").join("")+"</div><p>"+successes+" successes/4. Mean="+fmt(m.mean)+"; population std="+fmt(m.std)+". "+(m.std===0?"All rewards agree, so centered task advantages are zero. Other regularization terms may still update the policy.":"The group supplies outcome contrast. This does not identify which token caused success.")+"</p>";
}
export function coverageBody(k=10){
 const rows=[["Broad",[.4,.4]],["Concentrated",[.9,0]]],values=rows.map(([name,ps])=>[name,ps.reduce((s,p)=>s+binarySampling(p,k).coverage/2,0)]);
 return bars(values)+rows.map(([name,ps])=>"<p>"+name+": task probabilities["+ps.join(",")+"], individual pass@"+k+" ["+ps.map(p=>percent(binarySampling(p,k).coverage)).join(",")+"].</p>").join("")+"<p>Equal task weights; "+k+" independent attempts per task. "+(k===1?"Concentrated single-attempt accuracy is higher.":"With repeated attempts, the broad policy reaches both tasks. More attempts cannot help the assigned zero-support second task.")+"</p><p>No measured policy or training trajectory is represented here.</p>";
}
export function ptgsBody(draw=.5,q=.5,tau=1.5){
 const m=ptgsTemperature(draw,q,tau);
 return "<div class='rl-values'><div><span>Selected Beta draw</span><strong>"+fmt(draw)+"</strong><small>Not actual measured success</small></div><div><span>Exponent h</span><strong>"+fmt(m.exponent)+"</strong><small>Pivot q="+fmt(q)+"</small></div><div><span>Temperature</span><strong>"+fmt(m.temperature)+"</strong><small>Bounds["+fmt(m.minimum)+","+fmt(m.maximum)+"]</small></div></div><p>"+(draw<q?"Lower sampled success increases temperature.":draw>q?"Higher sampled success lowers temperature.":"At the target pivot, temperature equals Tref=1.")+" This rule does not predict that actual success will equal the target.</p><p>This is the exact controller mapping for a manually selected draw. A real PTGS controller samples its Beta posterior and updates task history.</p>";
}
function scene(key,title,inputs,body,caption,play=false){return "<figure class='topic-scene' data-rl-lab='"+key+"'><h3>"+title+"</h3>"+inputs+(play?controls:"")+"<div data-body>"+body+"</div><figcaption>"+caption+"</figcaption></figure>";}
export function rlScenes(){return {
 bellman:scene("bellman","Watch future value reach an earlier decision","<label>Bellman sweep<input aria-label='Bellman sweep' type='range' min='0' max='3' step='1' value='0'></label>",bellmanBody(),"Exact three-state example; sweep index is not measured training time.",true),
 clip:scene("clip","Clipping depends on advantage sign","<label>Advantage<select aria-label='Clipping advantage'><option value='1'>+1</option><option value='-1'>−1</option><option value='0'>0</option></select></label><label>Assigned probability ratio<input aria-label='Assigned probability ratio' type='range' min='1' max='40' step='1' value='10'></label>",clipBody(),"Manual or opt-in sweep of a one-coordinate surrogate, not an optimizer simulation.",true),
 group:scene("group","Keep the prompt fixed; change the outcome contrast","<label>Successes in a four-response group<input aria-label='Group successes' type='range' min='0' max='4' step='1' value='2'></label>",groupBody(),"Fixed prompt and group size; population std and epsilon 1e−8."),
 coverage:scene("coverage","Same tasks, different reachable coverage","<label>Attempts per task<input aria-label='Attempts per task' type='range' min='1' max='128' step='1' value='10'></label>",coverageBody(),"Exact independent-attempt probabilities. This is not an empirical coverage curve."),
 ptgs:scene("ptgs","Separate the sampled estimate from the success target","<label>Selected posterior draw<input aria-label='Selected posterior draw' type='range' min='0' max='100' step='1' value='50'></label><label>Target success pivot<select aria-label='Target success pivot'><option value='.25'>0.25</option><option value='.5' selected>0.5</option><option value='.75'>0.75</option></select></label><label>Temperature span tau<select aria-label='Temperature span tau'><option value='1'>1</option><option value='1.5' selected>1.5</option><option value='3'>3</option></select></label>",ptgsBody(),"Tref=1. The control selects a draw; it does not resample or learn a posterior.")
};}
export function mountRLScenes(article){
 const lab=k=>article.querySelector("[data-rl-lab='"+k+"']");
 const write=(l,body)=>{l.querySelector("[data-body]").innerHTML=body;};
 const b=lab("bellman"),bs=b.querySelector("input");rangePlayback(article,b,()=>write(b,bellmanBody(Number(bs.value))),10000);
 const c=lab("clip"),cs=c.querySelector("select"),cr=c.querySelector("input"),draw=()=>write(c,clipBody(Number(cr.value)/10,Number(cs.value)));
 const playback=rangePlayback(article,c,draw,18000);cs.addEventListener("change",()=>{playback.stop();draw();});
 const g=lab("group"),gs=g.querySelector("input");gs.addEventListener("input",()=>write(g,groupBody(Number(gs.value))));
 const a=lab("coverage"),as=a.querySelector("input");as.addEventListener("input",()=>write(a,coverageBody(Number(as.value))));
 const t=lab("ptgs"),ts=t.querySelector("input"),selects=[...t.querySelectorAll("select")],tdraw=()=>write(t,ptgsBody(Number(ts.value)/100,Number(selects[0].value),Number(selects[1].value)));
 ts.addEventListener("input",tdraw);for(const s of selects)s.addEventListener("change",tdraw);
}
