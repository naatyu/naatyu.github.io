import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {choosingReader} from '../prototypes/readers/choosing.js';
const html=choosingReader(s=>'/atlas/'+s);
const snippets=[...html.matchAll(/<pre[^>]*><code>([\s\S]*?)<\/code><\/pre>/g)].map(m=>m[1].replaceAll('&lt;','<').replaceAll('&gt;','>').replaceAll('&amp;','&').trim());
assert.equal(snippets.length,2);
const original=readFileSync(new URL('../../docs/interview-prep/neetcode-roadmap/choosing-algorithms-from-constraints.md',import.meta.url),'utf8').match(/```python\n([\s\S]*?)\n```/)[1];
assert.equal(snippets[0],original);
const check=String.raw`
import sys,json,itertools
ns={}
for code in json.loads(sys.stdin.read()): exec(code,ns)
pairs=counts=0
for n in range(8):
    for values in itertools.product((-1,0,1),repeat=n):
        a=list(values);before=a[:]
        for target in range(-3,4):
            possible=[(i,j) for i in range(n) for j in range(i+1,n) if a[i]+a[j]==target]
            answer=ns['two_sum'](a,target)
            assert (answer is not None)==bool(possible)
            if answer is not None: assert tuple(answer) in possible
            expected=sum(sum(a[i:j])==target for i in range(n) for j in range(i+1,n+1))
            assert ns['count_exact_sum'](a,target)==expected
            assert a==before;pairs+=1;counts+=1
assert ns['two_sum']([1,1,2],3)==[1,2]
assert ns['two_sum']([3],6) is None
assert ns['count_exact_sum']([0,0],0)==3
assert ns['count_exact_sum']([5,-2],3)==1
huge=10**300
assert ns['two_sum']([huge,huge],2*huge)==[0,1]
assert ns['count_exact_sum']([huge,-huge,0],0)==3
assert ns['two_sum']([],0) is None and ns['count_exact_sum']([],0)==0
print(json.dumps({'pairs':pairs,'counts':counts}))
`;
const result=JSON.parse(execFileSync('/usr/bin/python3',['-c',check],{input:JSON.stringify(snippets),encoding:'utf8'}));
assert.deepEqual(result,{pairs:22960,counts:22960});
assert.equal((html.match(/class="inline-math"/g)||[]).length,90);
assert.equal((html.match(/<math /g)||[]).length,91);
const tables=[...html.matchAll(/<div class="dense-table-wrap"([^>]*)>/g)];
assert.equal(tables.length,7);
for(const [,attributes]of tables){assert(attributes.includes('tabindex="0"'));assert(attributes.includes('role="region"'));assert(attributes.includes('aria-label="'));}
assert(!html.includes('Complete original'));
for(const old of ['interview-prep/neetcode-roadmap/choosing-algorithms-from-constraints','interview-prep/algorithms/top-6-coding-interview-concepts'])assert(!html.includes(old));
console.log('Choosing preservation: two actual callable Python blocks pass22960 pair and22960 exact-sum cases; verbatim source pair function, empty/duplicate/300-digit/ownership checks;1display+90inline MathML formulas.');
