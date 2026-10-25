import assert from 'node:assert/strict';
import {parseFragment} from 'parse5';
import {moeReader,routerPresentation,loadPresentation,demoBatch,tokenJourney} from '../prototypes/readers/moe.js';
import {routingSvg,routingPoints,routingEquation,routingFrame} from '../prototypes/readers/moe-animation.js';
const walk=n=>[n,...(n.childNodes||[]).flatMap(walk)];
const attr=(n,k)=>n.attrs?.find(a=>a.name===k)?.value;
const text=n=>n.nodeName==='#text'?n.value:(n.childNodes||[]).map(text).join('');
const html=moeReader(s=>s),nodes=walk(parseFragment(html));
for(const [key,markup] of [['data-router-output',routerPresentation()],['data-load-output',loadPresentation()]]){
  const node=nodes.find(n=>attr(n,key)!==undefined);assert(node,key);assert(text(node).trim());assert(html.includes(markup));
}
assert(html.includes(`>${routingSvg()}</svg>`));
assert(html.includes(`data-film-equation>${routingEquation()}</div>`));
const annotations=markup=>walk(parseFragment(markup)).filter(n=>n.tagName==='annotation').map(text);
assert.deepEqual(annotations(routingEquation()),[String.raw`s_1(x)=\frac{1+x}{2}`,String.raw`s_2(x)=\frac{1-x}{2}`]);
for(let tick=0;tick<=1000;tick++){
  const p=tick/1000,f=routingFrame(p),markup=routingEquation(p),tex=annotations(markup);
  assert.equal(tex.length,2);assert(!markup.includes('katex-error'));
  if(f.stage===2){assert.equal(tex[0],String.raw`s_2(x)+b_2>s_1(x)\iff x<b_2`);assert.equal(tex[1],`b_2=${f.bias.toFixed(2)}`);}
  if(f.stage===3)assert.deepEqual(tex,['s_1=0.65','s_2+b_2=0.35+0.45=0.80']);
  if(f.stage===4)assert.deepEqual(tex,['0.80','0.35']);
}
// Solve the affine-score comparison independently, excluding exact floating ties.
for(let ix=-100;ix<=100;ix++)for(let ib=0;ib<=45;ib++){
  const x=ix/100,b=ib/100;
  if(Math.abs(x-b)<1e-12)continue;
  assert.equal((1-x)/2+b>(1+x)/2,x<b);
}
assert.equal(text(nodes.find(n=>attr(n,'data-journey-caption')!==undefined)),`1/5 · ${tokenJourney[0][0]} — ${tokenJourney[0][1]}`);
for(const width of [260,390,720])for(let tick=0;tick<=100;tick++){
  const svg=routingSvg(tick/100,width);assert(!/NaN|Infinity|undefined/.test(svg));
  const elements=walk(parseFragment(`<svg>${svg}</svg>`)),circles=elements.filter(n=>n.tagName==='circle'&&Number(attr(n,'r'))!==16);
  assert.equal(circles.length,8);
  const height=width<420?292:340;
  circles.forEach((n,i)=>{
    const x=Number(attr(n,'cx')),y=Number(attr(n,'cy'));
    assert(x>=0&&x<=width&&y>=0&&y<=height);
    assert(Math.abs(x-(28+(routingPoints[i][0]+1)/2*(width-46)))<1e-10);
  });
  for(let i=1;i<=8;i++)assert(elements.some(n=>n.tagName==='text'&&text(n)===`t${i}`));
}
for(let step=0;step<=40;step++){
  const bias=step*.02,scores=[.8,.7,.3,.2],ids=[0,1,2,3].sort((a,b)=>(scores[b]+(b===2?bias:0))-(scores[a]+(a===2?bias:0))||a-b).slice(0,2);
  const total=ids.reduce((a,i)=>a+scores[i],0),rows=walk(parseFragment(routerPresentation(bias))).filter(n=>n.tagName==='tr').slice(1);
  rows.forEach((r,i)=>{
    const selected=ids.includes(i),cells=r.childNodes.filter(n=>['th','td'].includes(n.tagName));
    assert.equal(attr(r,'class')==='is-selected',selected);
    assert.equal(text(cells[2]),(scores[i]+(i===2?bias:0)).toFixed(2));
    assert.equal(text(cells[3]),selected?(scores[i]/total).toFixed(3):'—');
  });
}
for(const speed of [.05,.2]){
  let bias=[0,0,0,0];
  for(let step=0;step<=20;step++){
    const counts=[0,0,0,0];
    for(const scores of demoBatch){let best=0;for(let i=1;i<4;i++)if(scores[i]+bias[i]>scores[best]+bias[best])best=i;counts[best]++;}
    assert.equal(counts.reduce((s,v)=>s+v,0),8);
    assert(loadPresentation(bias,step).includes(`Update ${step} · counts [${counts.join(', ')}]`));
    bias=bias.map((v,i)=>v+speed*Math.sign(2-counts[i]));
  }
}
console.log('MoE static scenes: populated router/controller/journey,303 SVG states,1001 typeset equation states,independent affine-boundary equivalence,41 original-score router states and42 independently counted controller states pass.');
