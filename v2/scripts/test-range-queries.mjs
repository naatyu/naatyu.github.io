import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {arraysReader} from '../prototypes/readers/arrays.js';
import {findDecision} from '../prototypes/readers/choosing-model.js';
import {assertGeneratedMarkup} from './check-generated-markup.mjs';
const html=assertGeneratedMarkup(arraysReader(s=>'/atlas/'+s));
const code=html.match(/aria-label="Fenwick sum Python"><code>([\s\S]*?)<\/code>/)?.[1].replaceAll('&lt;','<').replaceAll('&gt;','>').replaceAll('&amp;','&');
assert(code);assert.equal(code.split('\n').length,14);
assert.equal(findDecision('range-queries').target,'algorithms/arrays#ranges');
for(const scope of ['id="ranges"','slot 0 is unused','sums [0,end)','Assignment needs delta=new−old','it need not be commutative','Range updates require a separate lazy-tag design','a linear build also exists'])assert(html.includes(scope),scope);
const check=String.raw`
import sys,json,itertools
ns={};exec(sys.stdin.read(),ns);add=ns['fenwick_add'];prefix=ns['fenwick_prefix']
states=ranges=0
for n in range(7):
    for values in itertools.product((-1,0,1),repeat=n):
        a=list(values);tree=[0]*(n+1)
        for i,v in enumerate(a):add(tree,i,v)
        for change in [None]+[(i,d) for i in range(n) for d in (-2,0,3)]:
            b=a[:];t=tree[:]
            if change is not None:i,d=change;b[i]+=d;add(t,i,d)
            for i in range(1,n+1):assert t[i]==sum(b[i-(i&-i):i])
            for end in range(n+1):assert prefix(t,end)==sum(b[:end])
            for l in range(n+1):
                for r in range(l,n+1):assert prefix(t,r)-prefix(t,l)==sum(b[l:r]);ranges+=1
            assert a==list(values);states+=1
t=[0]*9
for i,v in enumerate(range(1,9)):add(t,i,v)
assert [t[i] for i in (7,6,4)]==[7,11,10]
assert prefix(t,7)==28 and prefix(t,7)-prefix(t,2)==25
before=t[:];add(t,4,10)
assert [i for i in range(9) if t[i]!=before[i]]==[5,6,8]
assert prefix(t,7)==38 and prefix(t,7)-prefix(t,2)==35
for fn,args in [(add,([0],0,1)),(add,([0,0],-1,1)),(add,([0,0],1,1)),(prefix,([0,0],-1)),(prefix,([0,0],2))]:
    try:fn(*args)
    except IndexError:pass
    else:raise AssertionError('invalid bounds accepted')
print(json.dumps({'states':states,'ranges':ranges}))
`;
const result=JSON.parse(execFileSync('/usr/bin/python3',['-c',check],{input:code,encoding:'utf8'}));
assert(result.states>18000);assert(result.ranges>400000);
// The public segment cover is disjoint and complete; its merge is not subtraction.
const values=[1,2,3,4,5,6,7,8],cover=[[2,4],[4,6],[6,7]];
assert.deepEqual(cover.flatMap(([l,r])=>Array.from({length:r-l},(_,i)=>l+i)),[2,3,4,5,6]);
assert.deepEqual(cover.map(([l,r])=>values.slice(l,r).reduce((a,b)=>a+b,0)),[7,11,7]);
assert.deepEqual(cover.map(([l,r])=>Math.min(...values.slice(l,r))),[3,5,7]);
assert.equal(cover.map(([l,r])=>values.slice(l,r).join('')).join(''),'34567');
assert.equal(Math.min(...values.slice(0,7))-Math.min(...values.slice(0,2)),0);
assert.equal(Math.min(...values.slice(2,7)),3);
console.log(`Range queries:actual14-line Fenwick helpers pass${result.states} mutable states/${result.ranges} exact range queries,block ownership,bounds and public update path;segment cover/order/minimum counterexample pass.`);
