import assert from 'node:assert/strict';
import {parseFragment} from 'parse5';
import {pipelinePresentation,parallelismReader} from '../site/readers/parallelism.js';
const walk=node=>[node,...(node.childNodes||[]).flatMap(walk)];
const attr=(node,key)=>node.attrs?.find(a=>a.name===key)?.value;
const text=node=>node.nodeName==='#text'?node.value:(node.childNodes||[]).map(text).join('');
const initial=pipelinePresentation();
const html=parallelismReader(s=>s),nodes=walk(parseFragment(html));
for(const [layout,markup] of [['desktop',initial.desktop],['mobile',initial.mobile]]){
  const svg=nodes.find(n=>attr(n,'class')===`pipeline-${layout}`);
  assert(svg,layout);assert.equal(attr(svg,'aria-label'),initial.label);
  assert(html.includes(`>${markup}</svg>`),`${layout}: exact static embedding`);
}
assert.equal(text(nodes.find(n=>attr(n,'data-clock')!==undefined)),'1 / 9');
const activeCounts=[1,2,3,4,4,4,3,2,1];
for(let tick=0;tick<9;tick++){
  const scene=pipelinePresentation(tick);
  assert.equal(scene.clock,`${tick+1} / 9`);
  const expected=[];
  // Independently enumerate arrival time: microbatch b reaches stage s at b+s.
  for(let stage=0;stage<4;stage++){
    const batch=tick-stage;
    if(batch>=0&&batch<6)expected.push(`stage ${stage+1}, microbatch ${batch+1}`);
  }
  assert.equal(scene.label,`Clock ${tick+1} of nine. Active microbatches: ${expected.join('; ')}`);
  for(const [layout,markup,width,height] of [['desktop',scene.desktop,640,200],['mobile',scene.mobile,340,350]]){
    assert(!/NaN|Infinity|undefined/.test(markup));
    const elements=walk(parseFragment(`<svg>${markup}</svg>`)),rects=elements.filter(n=>n.tagName==='rect');
    assert.equal(rects.length,36);assert.equal(rects.filter(n=>attr(n,'opacity')==='1').length,24);
    assert.equal(rects.filter(n=>attr(n,'class')==='pipeline-active').length,activeCounts[tick]);
    for(const rect of rects){
      const x=Number(attr(rect,'x')),y=Number(attr(rect,'y'));
      assert(x>=0&&y>=0&&x+Number(attr(rect,'width'))<=width&&y+Number(attr(rect,'height'))<=height);
    }
    const labels=elements.filter(n=>n.tagName==='text').map(text);
    for(let b=1;b<=6;b++)assert.equal(labels.filter(v=>v===`μ${b}`).length,4);
    for(let s=1;s<=4;s++)assert(labels.includes(`S${s}`));
    if(layout==='mobile')for(let clock=1;clock<=9;clock++)assert(labels.includes(String(clock)));
  }
}
assert.throws(()=>pipelinePresentation(-1));assert.throws(()=>pipelinePresentation(9));assert.throws(()=>pipelinePresentation(.5));
console.log('Pipeline static/runtime presentation: both initial SVGs, nine clocks, active ownership, 24 occupied cells, labels and bounded geometry pass.');
