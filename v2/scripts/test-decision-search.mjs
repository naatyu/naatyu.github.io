import assert from 'node:assert/strict';
import {decisionLeaves,matchDecisions} from '../site/readers/choosing-model.js';
const ids=q=>matchDecisions(q).map(x=>x.id);
for(const q of ['', '   ','the and of in','!!!','completelyunrelatedxyz'])assert.deepEqual(ids(q),[]);
for(const [query,first]of [['range queries','range-queries'],['range qureies','range-queries'],['RANGE QUERY','range-queries'],['Fenwíck','range-queries'],['segment trees','range-queries'],['negative weights','negative'],['nonnegative weights','nonnegative'],['running medain','running-median'],['sliding windwo','variable-window'],['0-1 BFS','zero-one'],['0–1 BFS','zero-one'],['largest-first','safe-local'],['signed sum','signed-sum']])assert.equal(ids(query)[0],first,query);
assert(ids('binary seach').includes('sorted-search'));
assert.equal(ids('ＲＡＮＧＥ ＱＵＥＲＩＥＳ')[0],'range-queries');
let typos=0;
for(const leaf of decisionLeaves){
  for(const query of [leaf.label,leaf.method]){
    const results=matchDecisions(query);
    assert(results.includes(leaf),leaf.id+' '+query);
    assert.equal(new Set(results.map(x=>x.id)).size,results.length);
    assert.deepEqual(ids(query),ids(query));
    assert(results.every(x=>decisionLeaves.includes(x)));
  }
  const word=leaf.method.match(/[A-Za-z]{5,}/)?.[0];
  if(!word)continue;
  const variants=[word.slice(0,2)+word.slice(3),word.slice(0,2)+'z'+word.slice(3),word.slice(0,2)+word[3]+word[2]+word.slice(4)];
  for(const variant of variants){const query=leaf.method.replace(word,variant);assert(matchDecisions(query).includes(leaf),leaf.id+' typo '+query);typos++;}
}
// Ranking never changes the contracts or destinations it exposes.
const negative=matchDecisions('negative weights')[0];
assert(negative.condition.includes('reachable negative cycles'));
assert.equal(negative.target,'algorithms/graphs#negative');
assert.equal(matchDecisions('range queries')[0].target,'algorithms/arrays#ranges');
console.log(`Decision search:50 label/method roundtrips,${typos} generated single-edit/transposition queries,plurals,accents,blank/unknown guards,negative/nonnegative ranking and stable exact leaf contracts pass.`);
