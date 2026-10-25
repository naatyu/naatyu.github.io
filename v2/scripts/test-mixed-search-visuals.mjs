import assert from 'node:assert/strict';
import {exactSearchTrace} from '../prototypes/readers/search-links-model.js';
import {orderedTreeTrace} from '../prototypes/readers/ordered-tree-model.js';
const sourceValues=[2,5,8,12,16,23,38,56,72,91];
const sourceFrames=exactSearchTrace(sourceValues,23);
assert.deepEqual(sourceFrames.slice(1).map(f=>[f.left,f.right,f.middle,f.nextLeft,f.nextRight,f.result]),[[0,9,4,5,9,null],[5,9,7,5,6,null],[5,6,5,5,6,5]]);
let checks=0;
for(let n=0;n<=40;n++)for(let target=-2;target<=2*n+2;target++){
  const values=Array.from({length:n},(_,i)=>2*i),before=[...values],frames=exactSearchTrace(values,target);
  const expected=values.indexOf(target);assert.equal(frames.at(-1).result,expected);assert.deepEqual(values,before);
  for(const f of frames.slice(1)){
    if(f.middle===null)continue;
    assert(f.left<=f.middle&&f.middle<=f.right);
    if(f.result===null){assert(f.nextRight-f.nextLeft<f.right-f.left);if(expected>=0)assert(f.nextLeft<=expected&&expected<=f.nextRight);}
    else assert.equal(values[f.result],target);
  }
  checks++;
}
assert.equal(exactSearchTrace([2,2,2],2).at(-1).result,1);
assert.throws(()=>exactSearchTrace([2,1],2));assert.throws(()=>exactSearchTrace([Infinity],2));assert.throws(()=>exactSearchTrace([],NaN));
const dfs=[[1,4,8],[2],[3],[],[5,7],[6],[],[],[9],[]],bfs=[[1,2],[3,4],[5,6],[],[],[],[]];
assert.deepEqual(orderedTreeTrace(dfs,'dfs').at(-1).visited,[0,1,2,3,4,5,6,7,8,9]);
assert.deepEqual(orderedTreeTrace(dfs,'dfs')[4].frontier,[4,8]);
assert.deepEqual(orderedTreeTrace(bfs,'bfs').at(-1).visited,[0,1,2,3,4,5,6]);
assert.deepEqual(orderedTreeTrace(bfs,'bfs')[2].frontier,[2,3,4]);
let treeChecks=0;
// All increasing-parent rooted trees through seven vertices; parent IDs provide
// an independent recursive preorder and distance-based breadth-first oracle.
function enumerate(n,index=1,parents=[]){
  if(index===n){
    const children=Array.from({length:n},()=>[]);parents.forEach((p,i)=>children[p].push(i+1));
    const preorder=[];function visit(v){preorder.push(v);children[v].forEach(visit);}visit(0);
    const depths=[0];parents.forEach((p,i)=>depths[i+1]=depths[p]+1);
    const breadth=Array.from({length:n},(_,i)=>i).sort((a,b)=>depths[a]-depths[b]||preorder.indexOf(a)-preorder.indexOf(b));
    for(const mode of ['dfs','bfs']){
      const frames=orderedTreeTrace(children,mode);assert.equal(frames.length,n+1);assert.deepEqual(frames.at(-1).visited,mode==='dfs'?preorder:breadth);
      for(const f of frames){assert.equal(new Set([...f.visited,...f.frontier]).size,f.visited.length+f.frontier.length);assert(f.visited.length+f.frontier.length<=n);assert.deepEqual(f.visited,frames.at(-1).visited.slice(0,f.visited.length));}
    }
    treeChecks++;return;
  }
  for(let p=0;p<index;p++)enumerate(n,index+1,[...parents,p]);
}
for(let n=1;n<=7;n++)enumerate(n);
assert.deepEqual(orderedTreeTrace([]),[{current:null,visited:[],frontier:[]}]);
for(const bad of [[[1],[0]],[[1,1],[]],[[],[]],[[1],[2],[1]],[[2],[1],[]]])assert.throws(()=>orderedTreeTrace(bad));
assert.throws(()=>orderedTreeTrace([[]],'inorder'));
console.log(`Mixed search visuals: ${checks} exact search cases; exact 23 probes; ${treeChecks} rooted ordered trees with DFS/BFS independent orders and disjoint frontier/visited state.`);
