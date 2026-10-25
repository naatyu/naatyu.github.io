import assert from 'node:assert/strict';
import './test-greedy-preservation.mjs';
import {readFile} from 'node:fs/promises';
import {combinationTrace,mergeTrace,schedulingTrace,overlapTrace,reachableTrace} from '../site/readers/search-choice-model.js';
import {backtrackingMeta,backtrackingSections,backtrackingReader} from '../site/readers/backtracking.js';
import {greedyMeta,greedySections,greedyReader} from '../site/readers/greedy.js';
import {readerMetas,readerAliases,renderDenseReader} from '../site/readers/index.js';
import {rank} from '../site/search.js';
await import('./test-backtracking-preservation.mjs');
let combinationCases=0;
for(let n=0;n<=6;n++)for(let encoded=0;encoded<3**n;encoded++){
  let k=encoded;const input=Array.from({length:n},()=>{const x=1+k%3;k=Math.floor(k/3);return x;});
  for(let target=0;target<=12;target++){
    combinationCases++;const before=[...input],expected=new Set();
    for(let mask=0;mask<2**n;mask++){const selection=input.filter((_,i)=>mask&(1<<i));if(selection.reduce((a,b)=>a+b,0)===target)expected.add(JSON.stringify(selection.sort((a,b)=>a-b)));}
    const frames=combinationTrace(input,target),answers=frames.at(-1).results.map(r=>JSON.stringify(r));
    assert.deepEqual(input,before);assert.equal(new Set(answers).size,answers.length);assert.deepEqual(new Set(answers),expected);
    assert.deepEqual(frames.at(-1).path,[]);assert.deepEqual(frames.at(-1).calls,[]);
    for(let i=0;i<frames.length;i++){
      const f=frames[i];assert.equal(f.sum,f.path.reduce((s,j)=>s+f.values[j],0));assert(f.path.every((x,j)=>j===0||f.path[j-1]<x));assert(f.results.every(r=>r.reduce((a,b)=>a+b,0)===target));
      if(f.event==='choose')assert.deepEqual(f.path,[...frames[i-1].path,f.index]);
      if(f.event==='undo'){assert.equal(frames[i-1].path.at(-1),f.index);assert.deepEqual(f.path,frames[i-1].path.slice(0,-1));}
      if(f.event==='enter'){assert.equal(f.calls.length,f.path.length+1);assert.equal(f.calls.at(-1).sum,f.sum);}
    }
  }
}
assert.deepEqual(combinationTrace([1,2,2],3).at(-1).results,[[1,2]]);assert(combinationTrace([1,2,2],3).some(f=>f.event==='duplicate'));assert.throws(()=>combinationTrace([0,1],1));assert.throws(()=>combinationTrace([-1,2],1));
assert.throws(()=>combinationTrace([Number.MAX_SAFE_INTEGER,1],1));assert.throws(()=>reachableTrace([1,Number.MAX_SAFE_INTEGER]));
const possibilities=[];for(let a=0;a<4;a++)for(let b=a+1;b<=4;b++)possibilities.push([a,b]);let intervalCases=0;
const covers=(range,t,closed)=>range[0]<=t&&(closed?t<=range[1]:t<range[1]);
for(let mask=0;mask<2**possibilities.length;mask++){
  intervalCases++;const input=possibilities.filter((_,i)=>mask&(1<<i)).map(x=>[...x]),before=JSON.stringify(input);
  let optimum=0;for(let subset=0;subset<2**input.length;subset++){const selected=input.filter((_,i)=>subset&(1<<i)).sort((a,b)=>a[0]-b[0]);if(selected.every((j,i)=>i===0||selected[i-1][1]<=j[0]))optimum=Math.max(optimum,selected.length);}
  const schedule=schedulingTrace(input);assert.equal(schedule.at(-1).kept.length,optimum);for(const f of schedule)assert(f.kept.every((j,i)=>i===0||f.kept[i-1].end<=j.start));
  for(const closed of [false,true]){
    const fs=mergeTrace(input,closed);for(let i=0;i<fs.length;i++){
      const f=fs[i],processed=f.jobs.slice(0,i);assert(f.merged.every((j,k)=>k===0||(closed?f.merged[k-1].end<j.start:f.merged[k-1].end<=j.start)));
      for(let t=0;t<=4;t+=.5)assert.equal(f.merged.some(j=>covers([j.start,j.end],t,closed)),processed.some(j=>covers([j.start,j.end],t,closed)));
    }
    const events=overlapTrace(input,closed),expectedPeak=Math.max(0,...Array.from({length:9},(_,i)=>input.filter(j=>covers(j,i/2,closed)).length));
    assert.equal(events.at(-1).maximum,expectedPeak);assert.equal(events.at(-1).count,0);assert(events.every(f=>f.count===f.active.length&&f.count>=0&&f.maximum>=f.count));
  }assert.equal(JSON.stringify(input),before);
}
assert.equal(schedulingTrace([[0,9],[1,3],[3,5],[5,7]],'start').at(-1).kept.length,1);assert.equal(schedulingTrace([[0,9],[1,3],[3,5],[5,7]],'end').at(-1).kept.length,3);
assert.equal(overlapTrace([[1,3],[3,5],[2,4]],false).at(-1).maximum,2);assert.equal(overlapTrace([[1,3],[3,5],[2,4]],true).at(-1).maximum,3);assert.throws(()=>mergeTrace([[1,1]]));
let reachCases=0;for(let n=0;n<=7;n++)for(let encoded=0;encoded<4**n;encoded++){
  reachCases++;let x=encoded;const jumps=Array.from({length:n},()=>{const v=x%4;x=Math.floor(x/4);return v;}),reachable=new Set(n?[0]:[]);
  for(let i=0;i<n;i++)if(reachable.has(i))for(let d=1;d<=jumps[i]&&i+d<n;d++)reachable.add(i+d);
  const fs=reachableTrace(jumps);assert.equal(fs.at(-1).reachable,n===0||reachable.has(n-1));
  assert(fs.every((f,i)=>i===0||f.farthest>=fs[i-1].farthest));
}
const catalog=JSON.parse(await readFile(new URL('../site/catalog.json',import.meta.url),'utf8')),notes=[...readerMetas,...catalog.notes.filter(n=>!readerAliases.includes(n.slug))],link=s=>'directions.html?slug='+s;
for(const [meta,reader,sections,queries]of [[backtrackingMeta,backtrackingReader,backtrackingSections,['backtracking','pruning','combinations']],[greedyMeta,greedyReader,greedySections,['greedy','intervals','sweep line']]]){
  const html=reader(link),ids=[...html.matchAll(/ id="([^"]+)"/g)].map(m=>m[1]);assert.equal(ids.length,new Set(ids).size);for(const [id]of sections)assert(ids.includes(id));assert(renderDenseReader(meta.slug,link));assert(meta.learningGoals.length>=3);
  for(const [,slug,anchor]of html.matchAll(/href="directions\.html\?slug=([^"#]+)(?:#([^"]+))?"/g)){assert(notes.some(n=>n.slug===slug),slug);if(anchor)assert(renderDenseReader(slug,link)?.includes(`id="${anchor}"`),slug+'#'+anchor);}
  for(const q of queries)assert(rank(notes,q).some(r=>r.note===meta),q);
}
console.log(`Search/choice: ${combinationCases} combinations vs exhaustive subsets with choose/undo invariants; ${intervalCases} interval sets with exhaustive schedule counts, prefix unions and closed/half-open depth; ${reachCases} frontiers vs explicit reachability; links, anchors, search and goals pass.`);
