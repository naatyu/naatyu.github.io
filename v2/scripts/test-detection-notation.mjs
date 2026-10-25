import assert from 'node:assert/strict';
import {parseFragment} from 'parse5';
import {detectionReader} from '../prototypes/readers/detection.js';
import {suppressionTrace,overlap} from '../prototypes/readers/detection-model.js';
import {assertGeneratedMarkup} from './check-generated-markup.mjs';
const html=assertGeneratedMarkup(detectionReader(()=>'')),nodes=[];
function visit(n){nodes.push(n);for(const c of n.childNodes||[])visit(c);}
visit(parseFragment(html));
const text=n=>(n.value||'')+(n.childNodes||[]).map(text).join('');
const annotations=nodes.filter(n=>n.tagName==='annotation').map(text);
for(const a of [String.raw`60\times100=6{,}000`,String.raw`10{,}000+10{,}000-6{,}000=14{,}000`,String.raw`\frac37\approx0.4286`,String.raw`\frac13`,String.raw`\operatorname{Recall}=1`,String.raw`\tau=0.2`,String.raw`\frac3{13}\approx0.2308`,String.raw`\tau=0.3`,String.raw`\operatorname{IoU}=\frac13`])assert(annotations.includes(a),a);
assert.equal(nodes.filter(n=>n.tagName==='math').length,15);
const prose=text(parseFragment(html));
for(const condition of ['removed box 1 never suppresses boxes 2/3','retained count, not a measured recall curve','not the percentage of one box covered','No ground truth is supplied','equality survives'])assert(prose.toLowerCase().includes(condition.toLowerCase()),condition);
assert(!prose.includes('inlineMath(String.raw'));
const comparison=nodes.find(n=>n.tagName==='table'&&n.childNodes?.some(c=>c.tagName==='caption'&&text(c)==='Why the survivor sets are not nested'));
assert(comparison);
const cellsInTable=[];function collect(n){if(n.tagName==='td')cellsInTable.push(text(n));for(const c of n.childNodes||[])collect(c);}collect(comparison);
assert.deepEqual(cellsInTable,['0.2','Box 0 removes box 1; removed box 1 never suppresses boxes 2/3','0,2,3','0.3','Box 1 survives box 0, then removes boxes 2/3','0,1']);
// Count integer unit cells independently of the continuous formula.
const cells=b=>{const s=new Set();for(let x=b[0];x<b[2];x++)for(let y=b[1];y<b[3];y++)s.add(x+','+y);return s;};
const areaRatio=(a,b)=>{const A=cells(a),B=cells(b),I=[...A].filter(x=>B.has(x)).length;return I/(A.size+B.size-I);};
const boxes=[[0,0,4,4],[1,2,5,6],[1,4,5,8],[3,2,7,6]];
assert.equal(areaRatio(boxes[0],boxes[1]),3/13);
assert.equal(areaRatio(boxes[1],boxes[2]),1/3);
assert.equal(areaRatio(boxes[1],boxes[3]),1/3);
function reference(threshold){const pending=[0,1,2,3],kept=[];while(pending.length){const m=pending.shift();kept.push(m);for(let j=pending.length-1;j>=0;j--)if(areaRatio(boxes[m],boxes[pending[j]])>threshold)pending.splice(j,1);}return kept;}
let cases=0;
for(let p=0;p<=100;p++){
  const input=boxes.map((box,i)=>({id:String(i),box,score:1-i/10,label:'same'}));
  const actual=suppressionTrace(input,{threshold:p/100}).at(-1).kept.map(x=>Number(x.id));
  assert.deepEqual(actual,reference(p/100));cases++;
}
assert.deepEqual(reference(.2),[0,2,3]);assert.deepEqual(reference(.3),[0,1]);
const example=overlap([0,0,100,100],[40,0,140,100]);
assert.equal(example.intersection,6000);assert.equal(example.union,14000);assert.equal(example.iou,3/7);
console.log(`Detection notation:9 exact inline formulas,${cases} independent cell-set threshold traces and static nonnested survivor comparison pass;no measured detection/recall claim.`);
