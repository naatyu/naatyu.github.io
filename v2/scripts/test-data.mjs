import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {normalize,tokenShares,exposure,twoSourceInterval,toyMetrics,objective,kl,corpus,parsedText,jaccard,lshProbability,dedupFrames,maskedMean} from '../prototypes/readers/data-model.js';
import {dataMeta,dataReader,dataSections} from '../prototypes/readers/data.js';
import {readerMetas,renderDenseReader} from '../prototypes/readers/index.js';
import {reviewedNavigation,resolveReviewedNote} from '../prototypes/reviewed-navigation.js';
import {rank} from '../prototypes/search.js';
const near=(a,b,e=1e-10)=>assert(Math.abs(a-b)<=e*Math.max(1,Math.abs(a),Math.abs(b)),`${a} != ${b}`);
let massCases=0;
for(let a=0;a<=5;a++)for(let b=0;b<=5;b++)for(let c=0;c<=5;c++)if(a+b+c)for(const lengths of [[1,1,1],[100,400,2000],[0,1,2],[1e6,1,1]]){if(a*lengths[0]+b*lengths[1]+c*lengths[2]===0)continue;const shares=tokenShares([a,b,c],lengths),total=a*lengths[0]+b*lengths[1]+c*lengths[2];shares.forEach((v,i)=>near(v,[a,b,c][i]*lengths[i]/total));near(shares.reduce((a,b)=>a+b),1);massCases++;}
near(normalize([1e308,1e308])[0],.5);near(normalize([Number.MIN_VALUE,Number.MIN_VALUE])[0],.5);
for(const invalid of [Array(2),[1,,2],[undefined,1],[NaN,1],[Infinity,1]]){
  assert.throws(()=>normalize(invalid));assert.throws(()=>maskedMean(invalid,[1,1]));
}
const tinyPrior=[Number.MIN_VALUE,1];
assert(Number.isFinite(kl([1,0],tinyPrior)));
near(kl([1,0],tinyPrior),-Math.log(Number.MIN_VALUE));
let capsCases=0;
for(let D=20;D<=160;D++)for(let p=0;p<=100;p++){const x=p/100,rows=exposure(D,[x,1-x],[20,80],[2,1]),interval=twoSourceInterval(D);near(rows[0].tokens+rows[1].tokens,D);near(rows[0].epochs,D*x/20);near(rows[1].epochs,D*(1-x)/80);const expected=D*x<=40+1e-10&&D*(1-x)<=80+1e-10;assert.equal(rows.every(x=>x.feasible),expected);assert.equal(interval.feasible,D<=120);if(interval.feasible)assert.equal(expected,x>=interval.lo-1e-12&&x<=interval.hi+1e-12);capsCases++;}
for(let p=0;p<=100;p++){const w=p/100,m=toyMetrics(w);near(m.code,.2+(1-w)**2);near(m.general,.2+w*w);for(let q=0;q<=100;q++)assert(objective(q/100,w)>=objective(w,w)-1e-12);if(p<100){const next=toyMetrics((p+1)/100);assert(next.code<m.code);assert(next.general>m.general);}}
for(const prior of [[1,1],[1,2],[0,1]]){near(kl(prior,prior),0);for(let p=0;p<=100;p++)assert(kl([p,100-p],prior)>=-1e-12);}assert.equal(kl([1,1],[0,1]),Infinity);near(kl([0,1],[0,1]),0);
for(const priority of ['curated','web']){const fs=dedupFrames(priority);assert.deepEqual(fs.map(f=>f.kept),[6,6,5,4,3,2]);for(const f of fs){assert.equal(f.documents.length,6);assert.equal(new Set(f.documents.map(d=>d.id)).size,6);assert(f.documents.find(d=>d.id==='W2').kept);assert.equal(f.documents.filter(d=>d.kept).length,f.kept);}assert(fs.at(-1).documents.find(d=>d.id===(priority==='curated'?'C0':'W0')).kept);assert(!fs.at(-1).documents.find(d=>d.id===(priority==='curated'?'W0':'C0')).kept);}
near(jaccard(corpus[0].text,corpus[3].text),.8);near(jaccard(corpus[0].text,corpus[4].text),.8);assert.equal(parsedText(corpus[0].text),parsedText(corpus[2].text));
// Enumerate all permutations of the union: exact ideal MinHash collision probability.
function permutations(xs){if(!xs.length)return [[]];return xs.flatMap((x,i)=>permutations(xs.filter((_,j)=>j!==i)).map(p=>[x,...p]));}
let minhashCases=0;for(let a=1;a<16;a++)for(let b=1;b<16;b++){const A=new Set([0,1,2,3].filter(i=>a&(1<<i))),B=new Set([0,1,2,3].filter(i=>b&(1<<i))),U=[...new Set([...A,...B])],orders=permutations(U),match=orders.filter(o=>o.find(x=>A.has(x))===o.find(x=>B.has(x))).length,overlap=[...A].filter(x=>B.has(x)).length;near(match/orders.length,overlap/U.length);minhashCases++;}
for(let p=0;p<=100;p++)for(const b of [1,5,20])for(const r of [1,2,5])near(lshProbability(p/100,b,r),1-(1-(p/100)**r)**b);
near(maskedMean([1,2,3],[1,0,1]),2);near(maskedMean([1,2,3],[1,1,1]),2);assert.equal(maskedMean([1],[0]),null);
for(const fn of [()=>normalize([]),()=>normalize([0,0]),()=>normalize([-1,1]),()=>tokenShares([1],[1,2]),()=>exposure(0,[1],[1],[1]),()=>twoSourceInterval(1,[1,2,3],[1,1,1]),()=>toyMetrics(-1),()=>objective(.5,2),()=>kl([1],[1,1]),()=>dedupFrames('random'),()=>lshProbability(1,0,1),()=>maskedMean([1],[.5])])assert.throws(fn);
const html=dataReader(s=>'directions.html?slug='+s),ids=[...html.matchAll(/ id="([^"]+)"/g)].map(m=>m[1]);assert.equal(ids.length,new Set(ids).size);for(const[id]of dataSections)assert(ids.includes(id));assert.equal(dataMeta.date,'2026-04-08');assert(dataMeta.prototype);assert(!html.includes('undefined'));
const snippet=html.match(/<pre><code>(def masked_token_mean[\s\S]*?)<\/code><\/pre>/)[1];
execFileSync('python3',['-c',snippet+'\nfor bits in range(256):\n    mask=[(bits >> i) & 1 for i in range(8)]\n    selected=[i+1 for i in range(8) if mask[i]]\n    expected=sum(selected)/len(selected) if selected else None\n    assert masked_token_mean(list(range(1,9)),mask)==expected\nprint("Reader Python reduction: 256 masks pass")'],{encoding:'utf8'});
const minhashSnippet=html.match(/<pre[^>]*><code>(def minhash_item[\s\S]*?)<\/code><\/pre>/)[1];
execFileSync('python3',['-c',minhashSnippet+`
from itertools import permutations
from fractions import Fraction
A, B = {1,2,3,4}, {1,2,3,5}
matches = 0
for order in permutations(A | B):
    rank = {item: i for i, item in enumerate(order)}
    matches += minhash_item(A, rank) == minhash_item(B, rank)
assert matches == 72
assert Fraction(matches, 120) == Fraction(len(A & B), len(A | B))
for order, expected in [([2,5,4,1,3],(2,2)),([4,2,5,1,3],(4,2)),([5,3,4,2,1],(3,5))]:
    rank = {item: i for i, item in enumerate(order)}
    assert (minhash_item(A, rank), minhash_item(B, rank)) == expected
try:
    minhash_item(set(), {})
    raise AssertionError('Empty set must fail')
except ValueError:
    pass
`],{encoding:'utf8'});
const exactLsh=Number(execFileSync('python3',['-c','from fractions import Fraction\nprint(float(1-(1-Fraction(4,5)**10)**5))'],{encoding:'utf8'}));
near(lshProbability(.8,5,10),exactLsh);
for(const formula of ['s^r','(1-s^r)^b','1-(1-s^r)^b'])assert(html.includes(`<annotation encoding="application/x-tex">${formula}</annotation>`));
assert.equal((html.match(/class="inline-math"/g)||[]).length,4);
for(const path of ['docs/ai/training/data/data-mixture-optimization.md','docs/ai/training/data/deduplication-and-memorization-control.md'])assert.equal(await readFile(new URL('../../'+path,import.meta.url),'utf8'),execFileSync('git',['show','HEAD:'+path],{cwd:new URL('../../',import.meta.url),encoding:'utf8'}));
const catalog=JSON.parse(await readFile(new URL('../prototypes/catalog.json',import.meta.url),'utf8')),notes=[...readerMetas,...catalog.notes.filter(n=>!reviewedNavigation[n.slug])];for(const [,s,anchor]of html.matchAll(/href="directions\.html\?slug=([^"#]+)(?:#([^"]+))?"/g)){assert(notes.some(n=>n.slug===s),s);if(anchor)assert(renderDenseReader(s,x=>'directions.html?slug='+x)?.includes(`id="${anchor}"`));}for(const q of ['data mixture','MinHash','deduplication','epoch cap','token share','Pareto'])assert(rank(notes,q).some(r=>r.note===dataMeta),q);
for(const old of ['ai/training/data/data-mixture-optimization','ai/training/data/deduplication-and-memorization-control']){assert(!notes.some(n=>n.slug===old));assert(!html.includes('slug='+old));assert.equal(resolveReviewedNote(old).slug,dataMeta.slug);}
assert(html.includes('R_D'));assert(!html.includes('The old claim'));
console.log(`Training data: ${massCases} token-mass cases, ${capsCases} horizon/cap cases, 10,201 priority comparisons, 225 exhaustive MinHash set pairs, 909 LSH probabilities, duplicate ownership, contradiction retention, masks, KL support, domains, routes and search pass.`);
