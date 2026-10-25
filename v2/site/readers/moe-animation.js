import {inlineMath} from './math.js';
// Synthetic affine-affinity example. Not a learned router or controller trace.
export const routingPoints=[[-.7,.3],[-.3,-.5],[.1,.7],[.2,-.7],[.3,.15],[.4,-.35],[.6,.5],[.85,-.1]];
export function routingFrame(progress){
  const p=Math.max(0,Math.min(1,progress));
  const t=Math.max(0,Math.min(1,(p-.36)/.28));
  const bias=.45*t*t*(3-2*t);
  const counts=[0,0];
  const experts=routingPoints.map(([x])=>{const expert=x>=bias?0:1;counts[expert]++;return expert;});
  return {bias,counts,experts,stage:p<.16?0:p<.36?1:p<.64?2:p<.82?3:4};
}
const stages=[
  ['01 / Representations','Each point is a token’s hidden representation. Only the horizontal coordinate affects this toy router.'],
  ['02 / The decision boundary','Without a correction bias, E1 wins when x ≥ 0. Six tokens select E1; two select E2.'],
  ['03 / Shift selection','Increase E2’s bias. The boundary moves right. Stationary tokens change experts as the boundary passes them.'],
  ['04 / Inspect one token','For t5, the original affinities remain 0.65 and 0.35. Adding 0.45 makes E2’s selection score 0.80.'],
  ['05 / Selection ≠ affinity','E2 now wins for t5, but its original affinity is still 0.35. Output mixing must use the chosen recipe’s original-score weights.']
];
const affinityEquations=inlineMath(String.raw`s_1(x)=\frac{1+x}{2}`)+inlineMath(String.raw`s_2(x)=\frac{1-x}{2}`);
const selectionCondition=inlineMath(String.raw`s_2(x)+b_2>s_1(x)\iff x<b_2`);
const biasEquations=Array.from({length:46},(_,i)=>inlineMath(`b_2=${(i/100).toFixed(2)}`));
const tokenEquations='<span>Token t5:</span>'+inlineMath(String.raw`s_1=0.65`)+inlineMath(String.raw`s_2+b_2=0.35+0.45=0.80`);
const finalEquations='<span>Selection score: '+inlineMath('0.80')+'</span><span>Original affinity: '+inlineMath('0.35')+'</span>';
export function routingEquation(progress=0){
  const frame=routingFrame(progress);
  return frame.stage<2?affinityEquations:frame.stage===2?selectionCondition+biasEquations[Math.round(frame.bias*100)]:frame.stage===3?tokenEquations:finalEquations;
}
export function routingSvg(progress=0,width=720){
  const frame=routingFrame(progress),height=width<420?292:340;
    const left=28,right=width-18,top=30,bottom=height-48,px=x=>left+(x+1)/2*(right-left),py=y=>top+(1-y)/2*(bottom-top);
    const boundary=px(frame.bias),region=progress<.16?0:Math.min(1,(progress-.16)/.08),focus=frame.stage>=3;
    return `<rect x="${left}" y="${top}" width="${boundary-left}" height="${bottom-top}" fill="var(--film-blue)" opacity="${.09*region}"/><rect x="${boundary}" y="${top}" width="${right-boundary}" height="${bottom-top}" fill="var(--film-wine)" opacity="${.1*region}"/>
    ${[-.5,0,.5].map(x=>`<path class="film-grid" d="M${px(x)} ${top}V${bottom}"/>`).join('')}${[-.5,0,.5].map(y=>`<path class="film-grid" d="M${left} ${py(y)}H${right}"/>`).join('')}
    <path class="film-axis" d="M${left} ${py(0)}H${right}M${px(0)} ${top}V${bottom}"/>
    <text x="${left}" y="${bottom+19}" class="film-small">−1</text><text x="${right}" y="${bottom+19}" text-anchor="end" class="film-small">+1</text><text x="${px(0)}" y="${bottom+19}" text-anchor="middle" class="film-small">0</text><text x="${right}" y="${height-5}" text-anchor="end" class="film-small">routing coordinate x</text>
    <g opacity="${region}"><path d="M${boundary} ${top-8}V${bottom}" stroke="var(--film-ink)" stroke-width="1.5" stroke-dasharray="4 5"/><text x="${boundary}" y="${top-14}" text-anchor="middle">x = ${frame.bias.toFixed(2)}</text>
    </g>
    ${routingPoints.map(([x,y],i)=>`<g opacity="${focus&&i!==4?.25:1}"><circle cx="${px(x)}" cy="${py(y)}" r="${i===4&&focus?8:5}" fill="${region?(frame.experts[i]===0?'var(--film-wine)':'var(--film-blue)'):'var(--film-ink)'}"/>${focus&&i===4?`<circle cx="${px(x)}" cy="${py(y)}" r="16" fill="none" stroke="var(--film-blue)" opacity=".6"/>`:''}<text x="${px(x)+9}" y="${py(y)-9}" class="film-small">t${i+1}</text></g>`).join('')}`;
}
export const routingAnimation=`<figure class="routing-film" data-routing-film>
<style>
.routing-film{--film-bg:#261d2b;--film-ink:#f5eef3;--film-muted:#c9b8c6;--film-blue:#aed0ed;--film-wine:#cf7e9c;margin:32px 0;padding:24px;background:var(--film-bg);color:var(--film-ink);border-radius:18px;overflow:hidden}
.routing-film .film-eyebrow{display:flex;justify-content:space-between;gap:16px;font:11px ui-monospace,monospace;letter-spacing:.09em;color:var(--film-muted);text-transform:uppercase}
.routing-film h4{color:var(--film-ink);font-size:24px;font-weight:400;letter-spacing:-.02em;margin:20px 0 8px}
.routing-film .film-stage{color:var(--film-blue);font:12px ui-monospace,monospace;margin:0}
.routing-film .film-counts{display:flex;justify-content:space-between;gap:12px;font:12px ui-monospace,monospace;margin-top:14px}.routing-film .film-counts span:first-child{color:var(--film-blue)}.routing-film .film-counts span:last-child{color:var(--film-wine)}
.routing-film svg{display:block;width:100%;overflow:visible;margin-top:18px}
.routing-film svg text{fill:var(--film-ink);font:12px ui-monospace,monospace}
.routing-film svg .film-small{fill:var(--film-muted);font-size:11px}
.routing-film svg .film-axis{stroke:#645263;stroke-width:1}
.routing-film svg .film-grid{stroke:#645263;stroke-width:1;opacity:.25}
.routing-film .film-equation{min-height:56px;display:flex;flex-wrap:wrap;gap:8px 18px;align-items:center;font:15px Georgia,serif;color:var(--film-ink);padding:16px 0;border-top:1px solid #ffffff18}
.routing-film [data-film-caption]{min-height:76px;margin:0 0 14px;color:var(--film-muted);font-size:14px;line-height:1.65}
.routing-film .film-controls{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.routing-film button{min-height:38px;border:1px solid #ffffff28;border-radius:24px;background:transparent;color:var(--film-ink);padding:8px 15px;cursor:pointer;font:12px ui-monospace,monospace}
.routing-film button:hover{background:#ffffff12}.routing-film button:focus-visible,.routing-film input:focus-visible{outline:2px solid var(--film-blue);outline-offset:4px}
.routing-film button[data-film-play]{background:var(--film-blue);color:var(--film-bg);border:0}
.routing-film .film-scrub{flex:1;min-width:120px;display:flex;align-items:center;gap:8px;font:11px ui-monospace,monospace;color:var(--film-muted)}
.routing-film .film-scrub span{white-space:nowrap}.routing-film input{width:auto;min-width:0;flex:1;accent-color:var(--film-blue)}
.routing-film figcaption{color:var(--film-muted);font-size:11px;margin-top:18px;line-height:1.6}
@media(max-width:600px){.routing-film{padding:18px 12px}.routing-film h4{font-size:21px}.routing-film .film-equation{font-size:14px;min-height:84px}.routing-film [data-film-caption]{min-height:112px}.routing-film .film-eyebrow{font-size:10px;letter-spacing:.03em}.routing-film .film-scrub{flex-basis:100%}}
</style>
<div class="film-eyebrow"><span>Routing geometry</span><span>Synthetic · 2 experts · top-1</span></div>
<h4>A bias moves the boundary. Not the tokens.</h4>
<p class="film-stage" data-film-stage>01 / Representations</p>
<div class="film-counts" data-film-counts><span>E2 · 2 tokens</span><span>E1 · 6 tokens</span></div>
<svg data-film-svg viewBox="0 0 720 340" role="img" aria-label="Animated synthetic router: fixed token points, a selection boundary shifting right as expert 2 receives bias, and unchanged original affinities.">${routingSvg()}</svg>
<div class="film-equation" data-film-equation>${routingEquation()}</div>
<p data-film-caption aria-live="polite">Each point is a token’s hidden representation. Only the horizontal coordinate affects this toy router.</p>
<div class="film-controls"><button type="button" data-film-play aria-pressed="false">▶ Play explanation</button><button type="button" data-film-replay>↺ Replay</button><label class="film-scrub"><span>Timeline</span> <input type="range" min="0" max="1000" value="0" step="1" data-film-scrub aria-label="Routing animation timeline"></label></div>
<figcaption>Original mathematical schematic. These affine affinities are illustrative, not measured logits or a trained model. The vertical coordinate does not affect selection. Exact ties select E1. A fixed bias shift is not a balancing algorithm; it can overcorrect load. This example does not define a top-1 output-normalization recipe.</figcaption>
</figure>`;

export function mountRoutingAnimation(article){
  const root=article.querySelector('[data-routing-film]');if(!root)return;
  const svg=root.querySelector('[data-film-svg]'),scrub=root.querySelector('[data-film-scrub]'),play=root.querySelector('[data-film-play]');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  let progress=0,raf=null,last=0,stage=-1,visible=true,equationHtml='';
  const draw=()=>{
    const frame=routingFrame(progress),width=Math.max(260,root.clientWidth-48),height=width<420?292:340;
    root.querySelector('[data-film-counts]').innerHTML=`<span>E2 · ${frame.counts[1]} tokens</span><span>E1 · ${frame.counts[0]} tokens</span>`;
    svg.setAttribute('viewBox',`0 0 ${width} ${height}`);
    svg.innerHTML=routingSvg(progress,width);
    if(stage!==frame.stage){stage=frame.stage;root.querySelector('[data-film-stage]').textContent=stages[stage][0];root.querySelector('[data-film-caption]').textContent=stages[stage][1];}
    const nextEquation=routingEquation(progress);
    if(nextEquation!==equationHtml){equationHtml=nextEquation;root.querySelector('[data-film-equation]').innerHTML=equationHtml;}
    scrub.value=String(Math.round(progress*1000));
  };
  const stop=()=>{if(raf!==null)cancelAnimationFrame(raf);raf=null;last=0;play.textContent=reduced?'Next scene →':'▶ Play explanation';play.setAttribute('aria-pressed','false');};
  const tick=now=>{if(!article.isConnected||!visible||document.hidden){stop();return;}if(last)progress=Math.min(1,progress+(now-last)/26000);last=now;draw();if(progress>=1){stop();return;}raf=requestAnimationFrame(tick);};
  play.addEventListener('click',()=>{if(reduced){progress=[.16,.36,.64,.82,1].find(x=>x>progress+.001)??0;draw();return;}if(raf!==null){stop();return;}if(progress>=1)progress=0;play.textContent='Ⅱ Pause';play.setAttribute('aria-pressed','true');raf=requestAnimationFrame(tick);});
  root.querySelector('[data-film-replay]').addEventListener('click',()=>{stop();progress=0;draw();});
  scrub.addEventListener('input',()=>{stop();progress=Number(scrub.value)/1000;draw();});
  const observer=new ResizeObserver(()=>{if(!root.isConnected){observer.disconnect();return;}draw();});observer.observe(root);
  const visibility=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(!visible)stop();},{threshold:.05});visibility.observe(root);
  article.addEventListener('atlas-reader-suspend',stop);
  article.addEventListener('atlas-reader-dispose',()=>{stop();observer.disconnect();visibility.disconnect();},{once:true});
  if(reduced)play.textContent='Next scene →';draw();
}
