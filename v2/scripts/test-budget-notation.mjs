import assert from 'node:assert/strict';
import {parseFragment} from 'parse5';
import {scalingReader,scalingMeta} from '../site/readers/scaling.js';
import {practiceReader,practiceMeta} from '../site/readers/practice.js';
import {efficiency} from '../site/readers/practice-model.js';
import {assertGeneratedMarkup} from './check-generated-markup.mjs';
const text=n=>(n.value||'')+(n.childNodes||[]).map(text).join('');
function parsed(reader){
 const html=assertGeneratedMarkup(reader(s=>s)),nodes=[];
 function walk(n){nodes.push(n);for(const c of n.childNodes||[])walk(c);}walk(parseFragment(html));
 return {html,nodes,prose:text(parseFragment(html)),annotations:nodes.filter(n=>n.tagName==='annotation').map(text)};
}
const scaling=parsed(scalingReader),practice=parsed(practiceReader),expected={
  "scaling.js": [
    "6\\times7\\times10^9\\times10^{12}",
    "4.2\\times10^{22}",
    "10^{23}",
    "10^{23}",
    "D\\approx20N",
    "C=n\\,t_{\\rm seconds}\\,F_{\\rm peak}\\,u",
    "5.74\\times10^{22}",
    "5.75\\times10^{22}",
    "\\frac{15\\times10^{12}}{8\\times10^9}\\approx1{,}875",
    "\\frac{14.8\\times10^{12}}{37\\times10^9}=400",
    "\\frac{23\\times10^{12}}{32\\times10^9}\\approx719",
    "\\frac{23\\times10^{12}}{3\\times10^9}\\approx7{,}667",
    "\\frac DN",
    "\\frac D{N_{\\rm act}}"
  ],
  "practice.js": [
    "\\operatorname{EG}=1.3",
    "1-\\frac1{1.3}\\approx23.1\\%",
    "f(C)=1+C^{-0.5}",
    "C'=4",
    "L'=1.4",
    "\\operatorname{EG}=1.5625",
    "\\operatorname{EG}_{\\rm FLOPs}=1.03",
    "\\operatorname{EG}_{\\rm Time}=0.82",
    "L'\\le E",
    "2.6\\times10^{-4}",
    "2.6\\times10^{-5}",
    "\\frac{45\\times10^{12}}{100.6\\times10^6}\\approx447{,}316",
    "\\frac{130-100}{100}=30\\%",
    "\\frac{130-100}{130}\\approx23.1\\%"
  ]
};
expected['scaling.js'].push(String.raw`5.74221312\times10^{22}`);
for(const[r,key,total,inline]of[[scaling,'scaling.js',119,84],[practice,'practice.js',21,14]]){
 for(const a of expected[key])assert(r.annotations.includes(a),a);
 assert.equal(r.nodes.filter(n=>n.tagName==='math').length,total);
 assert.equal((r.html.match(/class="inline-math"/g)||[]).length,inline);
 assert(!r.prose.includes('inlineMath(String.raw'));
}
assert.equal(expected['scaling.js'].length,15);assert.equal(expected['practice.js'].length,14);
assert.equal((scaling.html.match(/<table style="min-width:640px">/g)||[]).length,2);
for(const s of ['not feasibility guarantees','about 21.9B parameters and 438B tokens','Active TPP is not a fitted dense-model optimum','not controlled cross-model comparisons','historical observations'])assert(scaling.prose.includes(s),s);
for(const s of ['same target loss','not a measured model','not measured true entropy','outside the fit range','not GPU-hours'])assert(practice.prose.includes(s),s);
const table=practice.nodes.find(n=>n.tagName==='table'&&n.childNodes.some(c=>c.tagName==='caption'&&text(c)==='One cost difference, two percentage denominators'));
assert(table);const cells=[];
function collect(n){if(n.tagName==='td')cells.push(n);for(const c of n.childNodes||[])collect(c);}collect(table);
assert.equal(cells.length,6);
assert.equal(text(cells[0]),'How much extra does the baseline need?');assert.equal(text(cells[1]),'Candidate: 100');
assert.equal(text(cells[3]),'How much does the candidate save?');assert.equal(text(cells[4]),'Equivalent baseline: 130');
// Exact token/parameter arithmetic uses integer counts, independent of displayed formatting.
for(const[tokens,params,rounded]of[[15n*10n**12n,8n*10n**9n,1875n],[148n*10n**11n,37n*10n**9n,400n],[23n*10n**12n,32n*10n**9n,719n],[23n*10n**12n,3n*10n**9n,7667n]])assert.equal((2n*tokens+params)/(2n*params),rounded);
const compute=64n*30n*86400n*989n*10n**12n*35n/100n;
assert.equal(compute,57422131200000000000000n);
assert.equal((Number(compute)/1e22).toFixed(2),'5.74');
assert.equal((Math.sqrt(Number(compute)/120)/1e9).toFixed(1),'21.9');
assert.equal(Math.round(20*Math.sqrt(Number(compute)/120)/1e9),438);
assert.equal(Math.round(45e12/100.6e6),447316);
const example=efficiency(1.4,4);assert(Math.abs(example.baseline-6.25)<1e-12);assert(Math.abs(example.gain-1.5625)<1e-12);
let cases=0;
for(const baseline of [1,2,4,10,130,1000])for(const cost of [.5,1,4,100,400]){
 const loss=1+1/Math.sqrt(baseline),m=efficiency(loss,cost);
 assert(Math.abs(m.gain-baseline/cost)<1e-10);
 assert(Math.abs(m.saving-(baseline-cost)/baseline)<1e-10);cases++;
}
assert.equal((130-100)/100,.3);assert(Math.abs((130-100)/130-(1-1/1.3))<1e-15);
assert.throws(()=>efficiency(1,100),RangeError);assert.throws(()=>efficiency(.9,100),RangeError);
assert.equal(scalingMeta.date,'2026-04-08');assert.equal(practiceMeta.date,'2026-06-02');
console.log('Budget notation:29 inline additions,exact parsed conditions/percentage table,integer exposure/compute checks and'+cases+' independent inverse/saving identities pass;not empirical optimality or measured speed.');
