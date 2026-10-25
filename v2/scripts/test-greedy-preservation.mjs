import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {greedyReader} from '../prototypes/readers/greedy.js';
import {reviewedFragments,resolveReviewedNote} from '../prototypes/reviewed-navigation.js';
const html=greedyReader(s=>'/atlas/'+s);
const snippets=[...html.matchAll(/<pre[^>]*><code>([\s\S]*?)<\/code><\/pre>/g)].map(m=>m[1].replaceAll('&lt;','<').replaceAll('&gt;','>').replaceAll('&amp;','&'));
assert.equal(snippets.length,3);
const check=String.raw`
import json,sys,itertools
ns={}
for code in json.loads(sys.stdin.read()): exec(code,ns)
jumps=0
for n in range(8):
    for values in itertools.product(range(4),repeat=n):
        reachable={0} if values else set()
        for i in range(n):
            if i in reachable:
                reachable.update(range(i+1,min(n,i+values[i]+1)))
        assert ns['can_reach'](values)==(not values or n-1 in reachable);jumps+=1
subarrays=0
for n in range(1,7):
    for values in itertools.product(range(-2,3),repeat=n):
        expected=max(sum(values[i:j]) for i in range(n) for j in range(i+1,n+1))
        assert ns['maximum_subarray'](values)==expected;subarrays+=1
for values in [[],()]:
    try: ns['maximum_subarray'](values)
    except ValueError: pass
    else: raise AssertionError('empty input accepted')
assert ns['maximum_subarray']([-10**300,10**300,10**300])==2*10**300
pool=[(a,b) for a in range(4) for b in range(a,4)]
merges=0
for mask in range(1<<len(pool)):
    selected=[list(x) for i,x in enumerate(pool) if mask>>i&1]
    for data in [selected,list(reversed(selected))]:
        before=[x[:] for x in data];identities=[id(x) for x in data]
        result=ns['merge_intervals'](data)
        expected={x for a,b in data for x in range(2*a,2*b+1)}
        actual={x for a,b in result for x in range(2*a,2*b+1)}
        assert actual==expected
        assert all(result[i][1]<result[i+1][0] for i in range(len(result)-1))
        assert data==before and [id(x) for x in data]==identities
        assert all(id(x) not in identities for x in result);merges+=1
data=[[1,3],[1,3],[3,3],[3,5]]
out=ns['merge_intervals'](data);assert out==[[1,5]]
out[0][0]=-10;assert data==[[1,3],[1,3],[3,3],[3,5]]
assert ns['merge_intervals']([[0,10**300],[10**300,2*10**300]])==[[0,2*10**300]]
print(json.dumps({'jumps':jumps,'subarrays':subarrays,'merges':merges}))
`;
const result=JSON.parse(execFileSync('/usr/bin/python3',['-c',check],{input:JSON.stringify(snippets),encoding:'utf8'}));
assert.deepEqual(result,{jumps:21845,subarrays:19530,merges:2048});
for(const [name,count]of [['greedy',15],['intervals',13]]){
  const old='interview-prep/neetcode-roadmap/'+name;
  assert(!html.includes(old));assert.equal(Object.keys(reviewedFragments[old]).length,count);
  for(const [fragment,anchor]of Object.entries(reviewedFragments[old])){
    assert.deepEqual(resolveReviewedNote(old+'#'+fragment),{slug:'algorithms/greedy',anchor});
    assert(html.includes('id="'+anchor+'"'));
  }
}
assert(!html.includes('interview-prep/algorithms/interview-algorithms'));
console.log('Greedy preservation: actual Python passes21845 reachability arrays,19530 nonempty subarrays,2048 interval unions;empty rejection,huge integers,caller ordering/record ownership and28 headings checked.');
