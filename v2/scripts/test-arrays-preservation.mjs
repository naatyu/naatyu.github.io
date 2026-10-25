import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {arraysReader} from '../site/readers/arrays.js';
import {reviewedFragments,resolveReviewedNote} from '../site/reviewed-navigation.js';
const html=arraysReader(s=>'/atlas/'+s);
const snippets=[...html.matchAll(/<pre[^>]*><code>([\s\S]*?)<\/code><\/pre>/g)].map(m=>m[1].replaceAll('&lt;','<').replaceAll('&gt;','>').replaceAll('&amp;','&'));
assert.equal(snippets.length,7);
const check=String.raw`
import json,sys,itertools,math
ns={}
for code in json.loads(sys.stdin.read()): exec(code,ns)
arrays=0;pairs=0
for n in range(6):
    for values in itertools.product((-1,0,1,2),repeat=n):
        a=list(values);before=a[:]
        assert ns['contains_duplicate'](a)==(len(a)!=len(set(a)))
        assert dict(ns['frequency_counts'](a))=={v:a.count(v) for v in set(a)}
        assert ns['product_except_self'](a)==[math.prod(a[:i]+a[i+1:]) for i in range(n)]
        for target in (-2,0,2,4):
            result=ns['two_sum'](a,target)
            possible=any(a[i]+a[j]==target for i in range(n) for j in range(i+1,n))
            assert (result is not None)==possible
            if result is not None:
                i,j=result;assert 0<=i<j<n and a[i]+a[j]==target
            pairs+=1
        assert a==before;arrays+=1
words=[''.join(w) for n in range(5) for w in itertools.product('ab',repeat=n)]
groups=0
for a in words:
    for b in words:
        source=[a,b,a,''];before=source[:];expected={}
        for word in source: expected.setdefault(''.join(sorted(word)),[]).append(word)
        assert ns['group_anagrams'](source)==list(expected.values())
        assert source==before;groups+=1
assert ns['group_anagrams']([])==[]
assert ns['group_anagrams'](['ad','bc'])==[['ad'],['bc']]
for invalid in ('A',chr(96),'{','é','a b'):
    try: ns['group_anagrams']([invalid])
    except ValueError: pass
    else: raise AssertionError(invalid)
huge=10**200
assert ns['product_except_self']([huge,-huge,0])==[0,0,-huge**2]
assert ns['two_sum']([huge,huge],2*huge)==(0,1)
def sorted_reference(source):
    ordered=sorted(set(source));best=0;length=0;previous=None
    for value in ordered:
        length=length+1 if previous is not None and value==previous+1 else 1
        best=max(best,length);previous=value
    return best
runs=0
for n in range(7):
    for source in itertools.product((-2,-1,0,1,3),repeat=n):
        a=list(source);before=a[:]
        assert ns['longest_run_length'](a)==sorted_reference(a)
        assert a==before;runs+=1
assert ns['longest_run_length']([100,4,200,1,3,2,2])==4
assert ns['longest_run_length']([huge,huge+1,huge+2,huge+2])==3
class CountingSet(set):
    latest=None
    def __init__(self,items):
        super().__init__(items);self.checks=0;CountingSet.latest=self
    def __contains__(self,item):
        self.checks+=1
        return super().__contains__(item)
ns['set']=CountingSet
ownership=0
for bits in itertools.product((False,True),repeat=8):
    a=[i-4 for i,selected in enumerate(bits) if selected]*3
    assert ns['longest_run_length'](a)==sorted_reference(a)
    values=CountingSet.latest;u=len(values)
    number_of_runs=sum(1 for v in values if not set.__contains__(values,v-1))
    assert values.checks==2*u+number_of_runs;ownership+=1
print(json.dumps({'arrays':arrays,'pairs':pairs,'groups':groups,'runs':runs,'ownership':ownership}))
`;
const result=JSON.parse(execFileSync('/usr/bin/python3',['-c',check],{input:JSON.stringify(snippets),encoding:'utf8'}));
assert.deepEqual(result,{arrays:1365,pairs:5460,groups:961,runs:19531,ownership:256});
const old='interview-prep/neetcode-roadmap/arrays-and-hashing';
assert(!html.includes(old));assert(!html.includes('Complete original'));
assert.equal(Object.keys(reviewedFragments[old]).length,11);
for(const [fragment,anchor]of Object.entries(reviewedFragments[old])){
  assert.deepEqual(resolveReviewedNote(old+'#'+fragment),{slug:'algorithms/arrays',anchor});
  assert(html.includes('id="'+anchor+'"'));
}
assert.equal((html.match(/class="inline-math"/g)||[]).length,2);
assert(html.includes('id="runs"'));
assert(html.includes('Each distinct value belongs to one run'));
assert(html.includes('Spacing is schematic, not numeric distance'));
assert.equal((html.match(/<table style="min-width:640px">/g)||[]).length,5,'Two original comparisons and three range-query tables keep readable local columns');
assert(html.includes('aria-label="Stored value → earlier index"><table><caption>'),'The small live lookup table stays compact');
assert(html.includes('<figure style="margin:1.5rem 0">'),'Run diagram must not lose 80px to default mobile figure margins');
assert(html.includes('https://docs.python.org/3/builtins/time-complexity.html'));
assert.equal((html.match(/class="dense-table-wrap"/g)||[]).length,(html.match(/(?:class="dense-table-wrap" tabindex="0" role="region" aria-label="[^"]+"|tabindex="0" role="region" aria-label="[^"]+" class="dense-table-wrap")/g)||[]).length);
console.log('Array preservation: six rendered Python functions pass1365 arrays,5460 complement cases,961 stable grouping cases,19531 run inputs and256 exact membership-work counts plus invalid alphabet/large integers.');
