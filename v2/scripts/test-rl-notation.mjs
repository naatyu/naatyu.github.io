import assert from 'node:assert/strict';
import {parseFragment} from 'parse5';
import {rlReader} from '../site/readers/rl.js';
import {assertGeneratedMarkup} from './check-generated-markup.mjs';
const html=assertGeneratedMarkup(rlReader(s=>s),'RL revised notation');
const annotations=[],text=[];
function walk(node){
  if(node.tagName==='annotation')annotations.push(node.childNodes.map(c=>c.value||'').join(''));
  if(node.nodeName==='#text')text.push(node.value);
  for(const child of node.childNodes||[])walk(child);
}
walk(parseFragment(html));
for(const tex of [String.raw`\rho_{1:t}=\prod_{j=1}^{t}\rho_j`,String.raw`R=a_1a_2`,String.raw`Q(a_1)=0.8a_1`,String.raw`a_1-0.5`,String.raw`0.5(1-0.5)\times0.8=0.2`,String.raw`0.5(1-0.5)\times0.2=0.05`,String.raw`\beta=0`,String.raw`0\log 0=0`,String.raw`-\log_2 p`,String.raw`q=0.5`,String.raw`\tau=1.5`,String.raw`T_{\mathrm{ref}}=1`,String.raw`b_0(x)`,String.raw`\tau b_0(x)`,String.raw`R=-1`])assert(annotations.includes(tex),tex);
const parsed=text.join(' ');
for(const condition of ['two independent binary actions','future ratios integrate out','not generally prefix-measurable','not bounded by one bit','not evidence that reference anchoring never helps','not force actual success probability','cumulative model outputs and tool arguments'])assert(parsed.includes(condition),condition);
// Enumerate all four trajectories independently of the prose arithmetic.
let cases=0;
for(const first of [.1,.25,.5,.8])for(const target of [.2,.5,.8])for(const behavior of [.1,.2,.7]){
  let exact=0,prefixOnly=0,conditional=0,fullIS=0;
  for(const a of [0,1])for(const b of [0,1]){
    const pa=a?first:1-first,pb=b?behavior:1-behavior,pt=b?target:1-target;
    const reward=a*b,score=a-first;
    exact+=pa*pt*reward*score;
    prefixOnly+=pa*pb*reward*score;
    conditional+=pa*pb*(target*a)*score;
    fullIS+=pa*pb*(pt/pb)*reward*score;
  }
  const trueGradient=first*(1-first)*target;
  assert(Math.abs(exact-trueGradient)<1e-14);
  assert(Math.abs(conditional-exact)<1e-14);
  assert(Math.abs(fullIS-exact)<1e-14);
  assert(Math.abs(prefixOnly-first*(1-first)*behavior)<1e-14);
  if(first===.5&&target===.8&&behavior===.2){assert.equal(exact,.2);assert.equal(prefixOnly,.05);}
  cases++;
}
console.log(`RL notation: 15 exact inline transfers, parsed assumptions/caveats and ${cases} independently enumerated two-action cases pass.`);
