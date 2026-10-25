import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {parseFragment} from 'parse5';
import {diffusionReader,diffusionSections} from '../prototypes/readers/diffusion.js';
import {assertGeneratedMarkup} from './check-generated-markup.mjs';

const html=assertGeneratedMarkup(diffusionReader(s=>'/atlas/'+s+'/'));
const nodes=[];function walk(n){nodes.push(n);for(const c of n.childNodes||[])walk(c);}walk(parseFragment(html));
const attr=(n,k)=>n.attrs?.find(a=>a.name===k)?.value;
const text=n=>n.nodeName==='#text'?n.value:(n.childNodes||[]).map(text).join('');
const section=nodes.find(n=>attr(n,'id')==='consistency-implementation');assert(section);
assert(diffusionSections.some(([id])=>id==='consistency-implementation'));
const prose=text(section);
for(const phrase of ['separate JAX repository','both consistency training and distillation','not the endpoint prediction','Teacher-free targets do not imply random initialization','no extra prediction','floating-point schedule arithmetic','two network calls','training does not','last entry defines the exact cutoff','does not forward loss_norm','retains default LPIPS','loop condition remains true'])assert(prose.includes(phrase),phrase);
const annotations=nodes.filter(n=>n.tagName==='annotation').map(text);
assert(annotations.includes(String.raw`\begin{aligned}c_{\mathrm{in}}(t)&=\frac1{\sqrt{t^2+\sigma_{\mathrm{data}}^2}}\\\tau_{\mathrm{net}}&=250\log(t+10^{-44})\end{aligned}`));
const snippet=nodes.filter(n=>n.tagName==='code').map(text).find(x=>x.includes('def cm_sample('));assert(snippet);
assert(snippet.split('\n').length<=15);
const result=execFileSync('python3',['-c',snippet+`
from itertools import combinations
from math import prod, isclose
count = 0
for n in range(2,9):
    levels = [0.002+(n-1-i)/(n-1)*(80-0.002) for i in range(n)]
    for size in range(n-1):
        for mid in combinations(range(1,n-1),size):
            ids = [0,*mid,n-1]
            for initial in [-2.,0.,3.]:
                calls, draws = [], []
                def endpoint(x,t):
                    calls.append(t)
                    return x/(1+t)+t/10
                def normal():
                    z = (-1)**len(draws)*0.25*(len(draws)+1)
                    draws.append(z)
                    return z
                out = cm_sample(endpoint,initial,levels,ids,normal)
                a = [1/(1+levels[i]) for i in ids[:-1]]
                b = [levels[i]/10+(levels[j]**2-levels[-1]**2)**0.5*z
                     for i,j,z in zip(ids,ids[1:],draws)]
                expected = initial*prod(a)+sum(v*prod(a[k+1:]) for k,v in enumerate(b))
                assert isclose(out,expected,rel_tol=1e-12,abs_tol=1e-12)
                assert calls == [levels[i] for i in ids[:-1]]
                assert len(draws) == len(ids)-1
                count += 1
assert count == 381
levels = [(80**(1/7)+i/39*(.002**(1/7)-80**(1/7)))**7 for i in range(40)]
levels[0], levels[-1] = 80., .002  # Reference defines exact endpoints.
calls, draws = [], []
def endpoint(x,t):
    calls.append(t)
    return 1.
def normal():
    draws.append(1.)
    return 1.
assert cm_sample(endpoint,0.,levels,[0,22,39],normal) == 1.
assert len(calls) == 2 and len(draws) == 2
assert format(levels[22],'.6f') == '1.382368'
for ls, ids in [([],[]),([1.],[0]),([1.,1.],[0,1]),([.001,1],[0,1]),
                ([81.,.002],[0,1]),([float('nan'),.002],[0,1]),
                ([80.,.002],[0]),([80.,1.,.002],[0,1]),
                ([80.,1.,.002],[0,0,2]),([80.,1.,.002],[0,2,1,2]),
                ([80.,.002],[0.,1]),([80.,.002],[False,1])]:
    try:
        cm_sample(lambda *_: (_ for _ in ()).throw(AssertionError('must not evaluate')),0.,ls,ids,lambda:0.)
        raise AssertionError('invalid contract accepted')
    except ValueError:
        pass
print(count)
`],{encoding:'utf8'}).trim();
assert.equal(result,'381');
const pin='https://github.com/openai/consistency_models/blob/e32b69ee436d518377db86fb2127a3972d0d8716/';
for(const path of ['README.md','cm/karras_diffusion.py','scripts/cm_train.py','cm/train_util.py','cm/script_util.py','scripts/launch.sh'])assert(html.includes(pin+path),path);
console.log('Consistency implementation: actual 12-line scalar reference executes for381 expanded-affine cases, two-call terminal trace and12 pre-call rejection cases; pinned-source contract prose/MathML passes. No downloaded repository code or checkpoint executed.');
