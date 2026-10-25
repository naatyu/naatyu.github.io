import {attentionExample,exampleDots,exampleValues} from './attention-model.js';
export function attentionFrame(progress){
  const p=Math.max(0,Math.min(1,progress));
  return {...attentionExample(),stage:Math.min(4,Math.floor(p*5)),mixProgress:p===1?1:Math.max(0,Math.min(1,(p-.8)/.2))};
}
const scenes=[
  ['01 / Compare','One query compares with four keys. The dot products are [4, 1, −1, 3]. Norms and angles both affect these scores.'],
  ['02 / Scale','The head has four key coordinates. Divide each dot product by √4 = 2 to control score variance.'],
  ['03 / Mask','The query is at the third position. The fourth token is in the future. Its logit becomes −∞ before softmax.'],
  ['04 / Normalize','Exponentiate visible scores after subtracting their maximum. Normalize these positive numbers to sum to one.'],
  ['05 / Read values','Multiply each value vector by its probability. Add the three contributions tip to tail. The future value contributes nothing. Blue segments come from v₁ and v₃; the burgundy segment comes from v₂.']
];
export function attentionSvg(p,width=720,reduced=false){
    const f=attentionFrame(p),barStart=width*.3,barEnd=width-62;
    const baseX=45,baseY=390,scale=Math.min(180,width-90);
    let cx=0,cy=0;const vectors=[];
    for(let i=0;i<3;i++){
      const t=reduced?(f.stage===4?1:0):Math.max(0,Math.min(1,f.mixProgress*3-i));
      const dx=f.weights[i]*exampleValues[i][0]*t,dy=f.weights[i]*exampleValues[i][1]*t;
      vectors.push(`<path d="M${baseX+scale*cx} ${baseY-scale*cy}l${scale*dx} ${-scale*dy}" stroke="${i===1?'#cf7e9c':'#aed0ed'}" stroke-width="3" fill="none"/><circle cx="${baseX+scale*(cx+dx)}" cy="${baseY-scale*(cy+dy)}" r="3" fill="${i===1?'#cf7e9c':'#aed0ed'}"/>`);
      cx+=dx;cy+=dy;
    }
    const bars=exampleDots.map((dot,i)=>{
      const masked=f.stage>=2&&!f.allowed[i];
      const value=f.stage===0?dot:f.stage<3?f.scores[i]:f.weights[i];
      const max=f.stage===0?4:f.stage<3?2:1;
      const y=40+i*43,bw=Math.abs(value)/max*(barEnd-barStart),x=value<0?barStart-bw:barStart;
      return `<text x="8" y="${y+14}">k${i+1}</text><rect x="${x}" y="${y}" width="${masked?0:bw}" height="20" rx="4" fill="${value<0?'#cf7e9c':'#aed0ed'}" opacity="${masked?.2:.85}"/><text x="${width-8}" y="${y+14}" text-anchor="end">${masked?(f.stage<3?'−∞':'0'):value.toFixed(f.stage<3?1:3)}</text>${i===3?`<text x="8" y="${y+33}" class="attention-svg-muted">${masked?'future · excluded':'future · not masked yet'}</text>`:''}`;
    }).join('');
    return `<path d="M${barStart} 32V189" class="attention-svg-axis"/><text x="${barStart}" y="23" text-anchor="middle" class="attention-svg-muted">0</text>${bars}<path d="M${baseX} 225V${baseY}H${width-20}" class="attention-svg-axis"/><text x="${width-20}" y="${baseY+24}" text-anchor="end" class="attention-svg-muted">value coordinate 1</text><text x="${baseX}" y="218" class="attention-svg-muted">value coordinate 2</text>
    ${f.stage===4?vectors.join(''):`<text x="${baseX+10}" y="300" class="attention-svg-muted">${f.stage<3?'First establish the retrieval weights.':'Now use the weights to read V.'}</text>`}
    ${f.stage===4?`<path d="M${baseX} ${baseY}L${baseX+scale*cx} ${baseY-scale*cy}" fill="none" stroke="#f5eef3" stroke-dasharray="3 4" opacity=".45"/><text x="${baseX}" y="247" class="attention-svg-muted">${!reduced&&f.mixProgress<1?'Partial sum':'Σ pᵢvᵢ'} = [${cx.toFixed(3)}, ${cy.toFixed(3)}]</text>`:''}`;
}
export const attentionAnimation=`<figure class="attention-film" id="attention-animation" data-attention-film>
<div class="attention-film-heading"><span>One query · four keys</span><span>Synthetic example</span></div>
<h3>Scores choose. Values contribute.</h3>
<p class="attention-film-stage" data-attention-stage>01 / Compare</p>
<svg data-attention-svg viewBox="0 0 720 425" role="img" aria-label="One causal attention row: dot products are scaled, the future key is masked, probabilities are normalized, and value vectors are added.">${attentionSvg(0)}</svg>
<div class="attention-film-equation" data-attention-equation>q·k = [4, 1, −1, 3]</div>
<p data-attention-caption aria-live="polite">One query compares with four keys.</p>
<div class="attention-film-controls"><button type="button" data-attention-play aria-pressed="false">▶ Play explanation</button><button type="button" data-attention-replay>↺ Replay</button><button type="button" data-attention-next>Next scene →</button><label>Timeline<input type="range" min="0" max="1000" step="1" value="0" aria-label="Attention animation timeline" data-attention-scrub></label></div>
<figcaption>Original mathematical illustration, not measured model behavior. Values are two-dimensional for visibility. Playback time is not compute latency. Full numbers and the static derivation remain in the text.</figcaption>
</figure>`;
export function mountAttentionAnimation(article){
  const root=article.querySelector('[data-attention-film]');if(!root)return;
  const svg=root.querySelector('[data-attention-svg]'),play=root.querySelector('[data-attention-play]'),scrub=root.querySelector('[data-attention-scrub]');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  let p=0,raf=null,last=0,visible=true,priorStage=-1;
  const draw=()=>{
    const f=attentionFrame(p),width=Math.max(260,root.clientWidth-40);
    svg.setAttribute('viewBox',`0 0 ${width} 425`);
    svg.innerHTML=attentionSvg(p,width,reduced);
    const formula=f.stage===0?'q·k = [4, 1, −1, 3]':f.stage===1?'s = q·k / √4 = [2, 0.5, −0.5, 1.5]':f.stage===2?'s + mask = [2, 0.5, −0.5, −∞]':f.stage===3?'p = [0.7662, 0.1710, 0.0629, 0]':'o = 0.7662 v₁ + 0.1710 v₂ + 0.0629 v₃';
    root.querySelector('[data-attention-equation]').textContent=formula;
    if(f.stage!==priorStage){priorStage=f.stage;root.querySelector('[data-attention-stage]').textContent=scenes[f.stage][0];root.querySelector('[data-attention-caption]').textContent=scenes[f.stage][1];}
    scrub.value=String(Math.round(p*1000));
  };
  const stop=()=>{if(raf!==null)cancelAnimationFrame(raf);raf=null;last=0;play.textContent=reduced?'Next scene →':'▶ Play explanation';play.setAttribute('aria-pressed','false');};
  const next=()=>{stop();p=[.2,.4,.6,.8,1].find(x=>x>p+.001)??0;draw();};
  const tick=now=>{if(!article.isConnected||document.hidden||!visible){stop();return;}if(last)p=Math.min(1,p+(now-last)/22000);last=now;draw();if(p===1){stop();return;}raf=requestAnimationFrame(tick);};
  play.addEventListener('click',()=>{if(reduced){next();return;}if(raf!==null){stop();return;}if(p===1)p=0;play.textContent='Ⅱ Pause';play.setAttribute('aria-pressed','true');raf=requestAnimationFrame(tick);});
  root.querySelector('[data-attention-replay]').addEventListener('click',()=>{stop();p=0;draw();});root.querySelector('[data-attention-next]').addEventListener('click',next);
  scrub.addEventListener('input',()=>{stop();p=Number(scrub.value)/1000;draw();});
  const resize=new ResizeObserver(draw);resize.observe(root);
  const intersection=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(!visible)stop();},{threshold:.05});intersection.observe(root);
  // Shared registry dispatches disposal before replacing a reader.
  article.addEventListener('atlas-reader-suspend',stop);
  article.addEventListener('atlas-reader-dispose',()=>{stop();resize.disconnect();intersection.disconnect();},{once:true});
  if(reduced)play.hidden=true;draw();
}
