import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {orderingReader} from '../prototypes/readers/ordering.js';
import {reviewedFragments,resolveReviewedNote} from '../prototypes/reviewed-navigation.js';
const html=orderingReader(s=>'/atlas/'+s);
const snippets=[...html.matchAll(/<pre[^>]*aria-label="([^"]+)"[^>]*><code>([\s\S]*?)<\/code><\/pre>/g)].map(m=>({label:m[1],code:m[2].replaceAll('&lt;','<').replaceAll('&gt;','>').replaceAll('&amp;','&')}));
assert.equal(snippets.length,8);
const check=String.raw`
import json,sys,itertools,collections,random
from fractions import Fraction
ns={}
for item in json.loads(sys.stdin.read()): exec(item['code'],ns)
random.seed(42)
arrays=ranks=capacities=frequency=partitions=prefixes=0
for n in range(7):
    for values in itertools.product(range(-1,2),repeat=n):
        ordered=sorted(values);arrays+=1
        copy=list(values)
        assert ns['insertion_sort'](copy) is copy
        assert copy==ordered
        for k in range(n+1):
            assert sorted(ns['largest_k'](values,k))==ordered[n-k:] if k else ns['largest_k'](values,k)==[]
            capacities+=1
        for k in range(n):
            data=list(values);before=collections.Counter(data)
            assert ns['quickselect'](data,k)==ordered[k]
            assert collections.Counter(data)==before
            assert ns['kth_largest'](values,k+1)==ordered[-k-1];ranks+=1
        counts=collections.Counter(values)
        for k in range(len(counts)+1):
            expected=sorted(counts,key=lambda x:(counts[x],x),reverse=True)[:k]
            assert sorted(ns['top_k_frequent'](values,k))==sorted(expected);frequency+=1
        median=ns['MedianFinder']()
        for i,x in enumerate(values):
            median.addNum(x);a=sorted(values[:i+1]);m=len(a)
            expected=a[m//2] if m%2 else Fraction(a[m//2-1]+a[m//2],2)
            assert median.findMedian()==expected
            lower=[-v for v in median.small];upper=median.large
            assert len(lower) in [len(upper),len(upper)+1]
            assert not upper or max(lower)<=min(upper)
            assert sorted(lower+upper)==a;prefixes+=1
        if n<=5:
            for pivot_index in range(n):
                data=[-999]+list(values)+[999];p=ns['lomuto'](data,1,n,pivot_index+1)
                pivot=values[pivot_index]
                assert data[p]==pivot
                assert all(x<pivot for x in data[1:p])
                assert all(x>=pivot for x in data[p+1:n+1])
                assert data[0]==-999 and data[-1]==999
                assert sorted(data[1:n+1])==ordered;partitions+=1
pool=[list(v) for n in range(3) for v in itertools.combinations_with_replacement(range(3),n)]
merges=0
for streams in itertools.product(pool,repeat=3):
    before=[v[:] for v in streams]
    assert ns['merge_k_sorted_lists'](streams)==sorted(x for v in streams for x in v)
    assert list(streams)==before;merges+=1
assert ns['merge_k_sorted_lists']([])==[]
for name,args in [('largest_k',([],1)),('largest_k',([1],True)),('largest_k',([1],0.5)),('kth_largest',([1],0)),('quickselect',([],0)),('quickselect',([1],-1)),('quickselect',([1],True)),('top_k_frequent',([1,1],2))]:
    try: ns[name](*args)
    except ValueError: pass
    else: raise AssertionError(name+' accepted invalid rank')
empty=ns['MedianFinder']()
try: empty.findMedian()
except ValueError: pass
else: raise AssertionError('empty median accepted')
huge=10**300
empty.addNum(huge);empty.addNum(huge+1)
assert empty.findMedian()==Fraction(2*huge+1,2)
other=ns['MedianFinder']();assert other.small==other.large==[]
assert ns['quickselect']([huge,huge-1,-huge],1)==huge-1
print(json.dumps(dict(arrays=arrays,ranks=ranks,capacities=capacities,frequency=frequency,partitions=partitions,prefixes=prefixes,merges=merges)))
`;
const result=JSON.parse(execFileSync('/usr/bin/python3',['-c',check],{input:JSON.stringify(snippets),encoding:'utf8'}));
assert.equal(result.arrays,1093);assert.equal(result.merges,1000);
for(const [old,count]of [['algorithms/patterns/k-way-merge',12],['algorithms/patterns/top-k-pattern',14],['algorithms/patterns/two-heaps-pattern',12],['algorithms/selection/quickselect',7],['interview-prep/neetcode-roadmap/heap-priority-queue',13]]){
  assert(!html.includes(old));assert.equal(Object.keys(reviewedFragments[old]).length,count);
  for(const [fragment,anchor]of Object.entries(reviewedFragments[old])){
    assert.deepEqual(resolveReviewedNote(old+'#'+fragment),{slug:'algorithms/ordering',anchor});
    assert(html.includes('id="'+anchor+'"'));
  }
}
console.log('Ordering preservation: actual eight Python blocks independently checked '+JSON.stringify(result)+';in-place insertion,empty/rank/large-integer contracts and58 headings pass.');
