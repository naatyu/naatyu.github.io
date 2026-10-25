import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {parseFragment} from 'parse5';
import {reasoningReader} from '../site/readers/reasoning.js';
import {assertGeneratedMarkup} from './check-generated-markup.mjs';
const html=assertGeneratedMarkup(reasoningReader(s=>s),'Reasoning evaluator');
const sections=new Map();const text=n=>(n.nodeName==='#text'?n.value:'')+(n.childNodes||[]).map(text).join('');
function walk(n){const id=n.attrs?.find(a=>a.name==='id')?.value;if(id)sections.set(id,n);for(const c of n.childNodes||[])walk(c);}walk(parseFragment(html));
const code=[];function collect(n){if(n.tagName==='pre')code.push(text(n));for(const c of n.childNodes||[])collect(c);}collect(sections.get('extraction'));assert.equal(code.length,1);
assert(code[0].includes('def extract_last_boxed(response):'));assert.equal(code[0].trim().split('\n').length,12);
for(const [id,phrases] of [
 ['from-scratch',['pretrained open Qwen3 weights','does not pretrain','key/value caching']],
 ['evaluation-split',['non-overlapping MATH problems','underlying problem','final test set']],
 ['pipeline',['Answer extraction first measures accuracy','filters teacher examples','inference score is not automatically']],
 ['extraction',['last literal boxed marker','not a complete LaTeX parser','Empty string','No reference answer enters this parser']],
 ['rlvr',['RLVR names the reward source','GRPO names an update method','all rewards equal']],
 ['training-loop',['gradients enabled','prompt and padding positions','conceptual pseudocode']],
 ['stability',['adding KL did not prevent eventual collapse','held-out accuracy']],
 ['distillation',['verify their final answers','teacher errors','Mask prompt/padding']],
 ['book-distillation',['family alignment as an author hypothesis','4,096 tokens']],
 ['compute-allocation',['teacher/data generation, training, and recurring inference']],
 ['experiment-contract',['one-seed improvement','0.2 percentage points','educational reference']]
]){const prose=text(sections.get(id));for(const phrase of phrases)assert(prose.includes(phrase),id+': '+phrase);}
const python=String.raw`import json,sys,itertools
source=json.load(sys.stdin)
namespace={}
exec(compile(source,'rendered-boxed-reference','exec'),namespace)
extract=namespace['extract_last_boxed']
cases=[('',None),('answer 42',None),(r'\boxed{42}','42'),
       (r'\boxed{\frac{1}{2}}',r'\frac{1}{2}'),
       (r'\boxed{\{1,2\}}',r'\{1,2\}'),
       (r'\boxed{a\\{b}}',r'a\\{b}'),
       (r'\boxed{1} then \boxed{',None),
       (r'\boxed{1}\boxed{}',''),
       (r'\boxed{\boxed{2}}','2'),
       (r'答案 \boxed{√2}','√2')]
for response,expected in cases:
    assert extract(response)==expected,(response,extract(response),expected)
# Independent oracle: classify braces by preceding-backslash parity, then scan
# cumulative balances. No stateful escape flag from the implementation is reused.
def oracle(response):
    marker=r'\boxed{'
    start=response.rfind(marker)
    if start<0:return None
    start+=len(marker)
    balance=1
    for i in range(start,len(response)):
        if response[i] not in '{}':continue
        slashes=0;j=i-1
        while j>=0 and response[j]=='\\':slashes+=1;j-=1
        if slashes%2:continue
        balance+=1 if response[i]=='{' else -1
        if balance==0:return response[start:i]
    return None
count=0
for length in range(8):
    for chars in itertools.product('a{}\\',repeat=length):
        response=r'\boxed{old} then \boxed{'+''.join(chars)
        assert extract(response)==oracle(response),response
        count+=1
assert count==21845
for depth in range(31):
    payload='{'*depth+'x'+'}'*depth
    assert extract(r'\boxed{'+payload+'}')==payload
print(f'{len(cases)} explicit, {count} exhaustive escape/brace, 31 nested-depth cases pass')`;
const output=execFileSync('python3',['-c',python],{input:JSON.stringify(code[0]),encoding:'utf8'});assert(output.includes('21845'));
console.log('Reasoning evaluator: actual rendered12-line Python executes; '+output.trim()+'. Book pipeline scope assertions pass, without executing generated answers or claiming a complete LaTeX/symbolic checker.');
