import assert from 'node:assert/strict';
import './test-problem-solving-notation.mjs';
import {readFile} from 'node:fs/promises';
import {hhTrace,arrivals,questionBound} from '../site/readers/problem-solving-model.js';
import {problemSolvingReader,problemSolvingMeta,problemSolvingSections} from '../site/readers/problem-solving.js';
import {readerMetas,renderDenseReader} from '../site/readers/index.js';
import {rank} from '../site/search.js';
import {reviewedFragments,resolveReviewedNote} from '../site/reviewed-navigation.js';
const near=(a,b)=>assert(Math.abs(a-b)<1e-10,`${a} != ${b}`);
// Independent enumeration of full fair sequences and first HH occurrence.
for(let n=0;n<=16;n++){let empty=0,h=0,done=0,sum=0;for(let bits=0;bits<2**n;bits++){const s=bits.toString(2).padStart(n,'0').slice(-n||Infinity),at=s.indexOf('11');if(at>=0){done++;sum+=at+2;}else{sum+=n;if(s.endsWith('1'))h++;else empty++;}}const f=hhTrace(n).at(-1);near(f.empty,empty/2**n);near(f.h,h/2**n);near(f.done,done/2**n);near(f.truncated,sum/2**n);near(f.empty+f.h+f.done,1);}
const f=hhTrace(100).at(-1);near(f.truncated+6*f.empty+4*f.h,6);assert(f.truncated<6&&6-f.truncated<1e-8);assert(hhTrace(24).every((f,i,a)=>!i||f.done>=a[i-1].done));
let arrivalCases=0;for(let rate=0;rate<=12;rate++)for(let t=0;t<=60;t++)for(let k=1;k<=4;k++){arrivalCases++;const a=arrivals(rate,t,k),mu=rate*t/60;let total=0,mean=0,second=0,tail=0,event=0,factorial=1;for(let j=0;j<81;j++){if(j)factorial*=j;const p=Math.exp(-mu)*mu**j/factorial;total+=p;mean+=j*p;second+=j*j*p;if(j>=9)tail+=p;if(j>=k)event+=p;if(j<=8)near(a.mass[j],p);}near(total,1);near(mean,mu);near(second-mean*mean,mu);near(a.tail,tail);near(a.cdf,event);near(a.mass.reduce((x,y)=>x+y,0)+a.tail,1);assert.equal(a.expectedMinutes,rate?k*60/rate:Infinity);}
for(let b=2;b<=5;b++)for(let worlds=1;worlds<=1000;worlds++){const r=questionBound(worlds,b);assert(r.capacity>=BigInt(worlds));assert(r.depth===0||r.capacity/BigInt(b)<BigInt(worlds));}
for(const fn of [()=>hhTrace(-1),()=>hhTrace(101),()=>arrivals(-1,10),()=>arrivals(1,61),()=>arrivals(1,1,0),()=>arrivals(NaN,1),()=>questionBound(0,2),()=>questionBound(3,1)])assert.throws(fn);
const link=s=>'directions.html?slug='+s,html=problemSolvingReader(link),ids=[...html.matchAll(/ id="([^"]+)"/g)].map(m=>m[1]);assert.equal(ids.length,new Set(ids).size);for(const [id]of problemSolvingSections)assert(ids.includes(id));assert.equal(problemSolvingMeta.date,'2026-08-30');assert.equal(problemSolvingMeta.prototype,false);
const catalog=JSON.parse(await readFile(new URL('../site/catalog.json',import.meta.url),'utf8')),notes=[...readerMetas,...catalog.notes];for(const [,s,anchor]of html.matchAll(/href="directions\.html\?slug=([^"#]+)(?:#([^"]+))?"/g)){assert(notes.some(n=>n.slug===s),s);if(anchor)assert(renderDenseReader(s,link)?.includes(`id="${anchor}"`));}
for(const q of ['brain teasers','Poisson','monovariant','fixed points','pigeonhole'])assert(rank(notes,q).some(r=>r.note===problemSolvingMeta),q);
assert.equal((html.match(/class="board-removed"/g)||[]).length,2);assert.equal((html.match(/class="board-blue"/g)||[]).length,30);assert.equal((html.match(/class="board-wine"/g)||[]).length,32);
const old='interview-prep/brain-teaser-problem-solving-toolkit';assert.equal(Object.keys(reviewedFragments[old]).length,43);for(const [fragment,anchor]of Object.entries(reviewedFragments[old])){assert.equal(resolveReviewedNote(old+'#'+fragment).slug,'math/problem-solving');assert.equal(resolveReviewedNote(old+'#'+fragment).anchor,anchor);assert(ids.includes(anchor));}
assert(!html.includes('Complete original toolkit'));assert(!html.includes(old));assert(html.includes('finite absolute expectations'));assert(html.includes('independent events'));assert(html.includes('mutually exclusive events'));
console.log(`Problem solving: 17 enumerated HH distributions, tail-sum expectation, ${arrivalCases} Poisson/waiting cases, 4,000 exact information bounds, chessboard counts, domains, routes and search pass.`);
