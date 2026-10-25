import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {windowsReader} from '../prototypes/readers/windows.js';
import {reviewedFragments,resolveReviewedNote} from '../prototypes/reviewed-navigation.js';
const html=windowsReader(s=>'/atlas/'+s);
const snippets=[...html.matchAll(/<pre[^>]*><code>([\s\S]*?)<\/code><\/pre>/g)].map(m=>m[1].replaceAll('&lt;','<').replaceAll('&gt;','>').replaceAll('&amp;','&'));
assert.equal(snippets.length,6);
const check=String.raw`
import json,sys,itertools
ns={}
for code in json.loads(sys.stdin.read()): exec(code,ns)
pairs=compactions=0
for n in range(7):
    for values in itertools.combinations_with_replacement((-1,0,1,2),n):
        a=list(values);before=a[:]
        for target in range(-2,5):
            expected=any(a[i]+a[j]==target for i in range(n) for j in range(i+1,n))
            assert ns['has_pair_with_sum'](a,target)==expected;pairs+=1
        assert a==before
        count=ns['remove_duplicates'](a)
        assert a[:count]==sorted(set(values));assert len(a)==n;compactions+=1
fixed=0
for n in range(6):
    for values in itertools.product((-2,-1,0,2),repeat=n):
        a=list(values);before=a[:]
        for k in range(1,n+1):
            assert ns['max_sum_of_size_k'](a,k)==max(sum(a[i:i+k]) for i in range(n-k+1));fixed+=1
        assert a==before
for a,k in (([],1),([1],0),([1],2),([1],-1),([1],1.5),([1],True)):
    try: ns['max_sum_of_size_k'](a,k)
    except ValueError: pass
    else: raise AssertionError((a,k))
strings=centers=0
distinct=0
for n in range(7):
    for values in itertools.product((0,1,2),repeat=n):
        for k in range(-1,5):
            expected=sum(len(set(values[i:j]))<=k for i in range(n) for j in range(i+1,n+1))
            assert ns['at_most_k_distinct'](values,k)==expected;distinct+=1
            if k>=0:
                exact=sum(len(set(values[i:j]))==k for i in range(n) for j in range(i+1,n+1))
                assert ns['at_most_k_distinct'](values,k)-ns['at_most_k_distinct'](values,k-1)==exact
for k in (1.5,True,'2'):
    try: ns['at_most_k_distinct']([1,2],k)
    except ValueError: pass
    else: raise AssertionError(k)
for n in range(7):
    for chars in itertools.product('abc',repeat=n):
        s=''.join(chars)
        ranges=[(i,j,s[i:j]) for i in range(n) for j in range(i+1,n+1)]
        expected=max((len(w) for _,_,w in ranges if len(set(w))==len(w)),default=0)
        assert ns['longest_unique_substring'](s)==expected;strings+=1
        for i in range(n):
            for j in (i,i+1):
                candidates=[w for left,right,w in ranges if left+right-1==i+j and w==w[::-1]]
                expected=max(candidates,key=len,default='')
                assert ns['expand'](s,i,j)==expected;centers+=1
assert ns['longest_unique_substring']('😀a😀')==2
assert ns['expand']('😀a😀',1,1)=='😀a😀'
huge=10**300
assert ns['max_sum_of_size_k']([-huge,-huge-1],1)==-huge
assert ns['has_pair_with_sum']([-huge,huge],0)
print(json.dumps({'pairs':pairs,'compactions':compactions,'fixed':fixed,'strings':strings,'centers':centers,'distinct':distinct}))
`;
const result=JSON.parse(execFileSync('/usr/bin/python3',['-c',check],{input:JSON.stringify(snippets),encoding:'utf8'}));
assert.deepEqual(result,{pairs:1470,compactions:210,fixed:6372,strings:1093,centers:12030,distinct:6558});
for(const [name,count]of [['two-pointers',12],['sliding-window',11]]){
  const old='interview-prep/neetcode-roadmap/'+name;
  assert(!html.includes(old));assert.equal(Object.keys(reviewedFragments[old]).length,count);
  for(const [fragment,anchor] of Object.entries(reviewedFragments[old])){
    assert.deepEqual(resolveReviewedNote(old+'#'+fragment),{slug:'algorithms/windows',anchor});
    assert(html.includes('id="'+anchor+'"'));
  }
}
assert.equal((html.match(/class="inline-math"/g)||[]).length,2);
assert(!html.includes('Complete originals'));
assert(html.includes('id="coverage-lab"'));assert(html.includes('id="counting-code"'));
assert.equal((html.match(/class="dense-table-wrap"/g)||[]).length,3);
assert.equal((html.match(/class="dense-table-wrap" tabindex="0" role="region" aria-label=/g)||[]).length,3);
console.log('Window preservation: six Python functions pass1470 pair cases,210 compactions,6372 fixed sums,1093 unique strings,12030 palindrome centers and6558 at-most/exact distinct-count cases plus invalid-size/Unicode/huge-integer boundaries.');
