import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {stacksReader} from '../prototypes/readers/stacks.js';
import {reviewedFragments,resolveReviewedNote} from '../prototypes/reviewed-navigation.js';
const html=stacksReader(s=>'/atlas/'+s);
const snippets=[...html.matchAll(/<pre[^>]*><code>([\s\S]*?)<\/code><\/pre>/g)].map(m=>m[1].replaceAll('&lt;','<').replaceAll('&gt;','>').replaceAll('&amp;','&'));
assert.equal(snippets.length,3);
const check=String.raw`
import json,sys,itertools,fractions
ns={}
for code in json.loads(sys.stdin.read()): exec(code,ns)
valid=ns['is_valid_parentheses']; evaluate=ns['eval_rpn']; greater=ns['next_greater_indices']
def balanced(text):
    previous=None
    while previous!=text:
        previous=text
        for pair in ('()','[]','{}'): text=text.replace(pair,'')
    return text==''
delimiters=0
for n in range(6):
    for chars in itertools.product('()[]{}',repeat=n):
        text=''.join(chars);assert valid(text)==balanced(text);delimiters+=1
assert not valid('x');assert not valid('(x)')
assert valid('('*2000+')'*2000)
neighbors=0
for n in range(6):
    for a in itertools.product((-1,0,1,2),repeat=n):
        expected=[next((j for j in range(i+1,len(a)) if a[j]>v),None) for i,v in enumerate(a)]
        assert greater(a)==expected;neighbors+=1
arithmetic=0
for a in range(-20,21):
    for b in range(-20,21):
        for op in ('+','-','*','/'):
            if op=='/' and b==0: continue
            expected={'+':lambda:a+b,'-':lambda:a-b,'*':lambda:a*b,'/':lambda:int(fractions.Fraction(a,b))}[op]()
            assert evaluate([str(a),str(b),op])==expected;arithmetic+=1
huge=10**500
assert evaluate([str(-huge),'3','/'])==-huge//3+1
assert evaluate(['2','3','4','*','+'])==14
for tokens in ([],['1','2'],['+'],['1','+'],['1','2','?'],['not-an-integer']):
    try: evaluate(tokens)
    except ValueError: pass
    else: raise AssertionError(tokens)
try: evaluate(['1','0','/'])
except ZeroDivisionError: pass
else: raise AssertionError('zero division')
print(json.dumps({'delimiters':delimiters,'neighbors':neighbors,'arithmetic':arithmetic}))
`;
const result=JSON.parse(execFileSync('/usr/bin/python3',['-c',check],{input:JSON.stringify(snippets),encoding:'utf8'}));
assert.deepEqual(result,{delimiters:9331,neighbors:1365,arithmetic:6683});
const old='interview-prep/neetcode-roadmap/stack';
assert(!html.includes(old));assert(!html.includes('Complete original'));
assert.equal(Object.keys(reviewedFragments[old]).length,10);
for(const [fragment,anchor] of Object.entries(reviewedFragments[old])){
  assert.deepEqual(resolveReviewedNote(old+'#'+fragment),{slug:'algorithms/stacks',anchor});
  assert(html.includes('id="'+anchor+'"'));
}
console.log('Stack preservation: actual rendered Python passes9331 delimiter strings,1365 neighbor arrays,6683 arithmetic cases,huge signed integers and malformed inputs.');
