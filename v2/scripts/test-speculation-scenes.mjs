import assert from 'node:assert/strict';
import {parseFragment} from 'parse5';
import {roundPresentation,speculativeMassRows,speculationReader} from '../prototypes/readers/speculation.js';
const walk=n=>[n,...(n.childNodes||[]).flatMap(walk)];
const attr=(n,k)=>n.attrs?.find(a=>a.name===k)?.value;
const text=n=>n.nodeName==='#text'?n.value:(n.childNodes||[]).map(text).join('');
const html=speculationReader(s=>s),nodes=walk(parseFragment(html));
for(const wrapper of nodes.filter(n=>attr(n,'class')==='dense-table-wrap')){
  assert.equal(attr(wrapper,'tabindex'),'0');assert.equal(attr(wrapper,'role'),'region');assert(attr(wrapper,'aria-label'));
  const table=walk(wrapper).find(n=>n.tagName==='table');
  assert(/min-width:(560|640)px/.test(attr(table,'style')));
}
const initial=roundPresentation();
assert(html.includes(initial.drafts));assert(html.includes(initial.committed));
assert.equal(text(nodes.find(n=>attr(n,'data-committed-row')!==undefined)),'No tokens committed yet.');
assert.equal(text(nodes.find(n=>attr(n,'data-round-caption')!==undefined)),initial.caption);
const massNode=nodes.find(n=>attr(n,'data-mass-rows')!==undefined);
assert(massNode);assert(html.includes(speculativeMassRows()));
const rows=walk(massNode).filter(n=>attr(n,'class')==='probability-row');
assert.equal(rows.length,4);
const expected=[['cat',.4,0,.4],['dog',.2,.1,.3],['bear',.1,.1,.2],['cow',.1,0,.1]];
rows.forEach((r,i)=>{
  const [token,accepted,missing,total]=expected[i];
  assert.equal(text(r),`${token}${accepted.toFixed(2)} + ${missing.toFixed(2)} = ${total.toFixed(2)}`);
  const bars=walk(r).filter(n=>n.tagName==='i');
  assert.equal(bars.length,2);
  [accepted,missing].forEach((v,j)=>assert(Math.abs(Number(attr(bars[j],'style').match(/width:([^%]+)%/)[1])-v*200)<1e-10));
});
assert(html.includes('Each full track represents probability 0.5'));
const trace=nodes.find(n=>n.tagName==='table'&&walk(n).some(c=>c.tagName==='caption'&&text(c).startsWith('Synthetic greedy round:')));
assert(trace);const traceRows=walk(trace).filter(n=>n.tagName==='tr').slice(1);
assert.equal(traceRows.length,6);
assert.deepEqual(traceRows.map(r=>text(r.childNodes.filter(n=>n.tagName==='td')[2])),['None','None','None','the blue','the blue cat','the blue cat']);
for(let step=0;step<=100;step++){
  const p=step/100,stage=Math.min(5,Math.floor(p*6)),scene=roundPresentation(p);
  assert(scene.caption.startsWith(`${stage+1} / `));
  const committedNodes=walk(parseFragment(scene.committed));
  if(stage<3)assert.equal(text(committedNodes[0]),'No tokens committed yet.');
  else{
    const tokens=committedNodes.filter(n=>n.tagName==='span');
    assert.equal(tokens.length,stage===3?2:3);
    assert.deepEqual(tokens.map(n=>attr(n,'class')),stage===3?['spec-accepted','spec-accepted']:['spec-accepted','spec-accepted','spec-correction']);
  }
  assert(!/NaN|undefined/.test(scene.drafts+scene.committed));
}
assert.throws(()=>roundPresentation(-1));assert.throws(()=>roundPresentation(2));
console.log('Speculation static scenes: four exact mass rows/scale, explicit empty commitment, six-step trace and 101 shared runtime states pass.');
