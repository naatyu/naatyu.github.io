// Execute the actual short reader references with an isolated CPU Torch runtime.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {recurrenceReader} from '../site/readers/recurrence.js';
const python=process.env.ATLAS_TORCH_PYTHON;
assert.ok(python,'Set ATLAS_TORCH_PYTHON to an interpreter with torch and numpy.');
const html=recurrenceReader(s=>s);
const snippets=[...html.matchAll(/<pre[^>]*aria-label="(?:LSTM |Loop scaling |Shared matrix initialization |Shared stack execution )[^\"]*"[^>]*><code>([\s\S]*?)<\/code><\/pre>/g)].map(m=>m[1].replaceAll('&lt;','<').replaceAll('&gt;','>').replaceAll('&amp;','&'));
assert.equal(snippets.length,5);
console.log(execFileSync(python,['-c',String.raw`
import json, sys, itertools
import numpy as np
import torch
ns={}
for part in json.load(sys.stdin): exec(part,ns)
step,sequence=ns['lstm_step'],ns['lstm_sequence']
torch.manual_seed(41)
cases=0
for T,B,I,H,dtype,provided in itertools.product([0,1,3,7],[1,2],[1,3],[1,4],[torch.float32,torch.float64],[False,True]):
    x=torch.randn(T,B,I,dtype=dtype)*.3
    W=torch.randn(4*H,H+I,dtype=dtype)*.3
    b=torch.randn(4*H,dtype=dtype)*.3
    h,c=[torch.randn(B,H,dtype=dtype)*.3 for _ in range(2)] if provided else [torch.zeros(B,H,dtype=dtype) for _ in range(2)]
    initial=(h.clone(),c.clone())
    original=[v.clone() for v in (x,W,b,h,c)]
    hs,cs,final=sequence(x,W,b,(h,c) if provided else None)
    # Native row order i,f,g,o differs from the published reference f,i,g,o.
    native=torch.nn.LSTMCell(I,H).to(dtype)
    order=torch.cat([torch.arange(H,2*H),torch.arange(H),torch.arange(2*H,4*H)])
    with torch.no_grad():
        native.weight_hh.copy_(W[order,:H]); native.weight_ih.copy_(W[order,H:])
        native.bias_ih.copy_(b[order]); native.bias_hh.zero_()
    nh,nc=initial
    ah,ac=[v.double().numpy().copy() for v in initial]
    for t,token in enumerate(x):
        nh,nc=native(token,(nh,nc))
        torch.testing.assert_close(hs[t],nh,rtol=2e-5,atol=2e-6)
        torch.testing.assert_close(cs[t],nc,rtol=2e-5,atol=2e-6)
        # Independent NumPy gate calculation in double precision.
        z=np.concatenate((ah,token.double().numpy()),axis=-1)@W.double().numpy().T+b.double().numpy()
        f,i,g,o=np.split(z,4,axis=-1)
        sigmoid=lambda a:1/(1+np.exp(-a))
        ac=sigmoid(f)*ac+sigmoid(i)*np.tanh(g)
        ah=sigmoid(o)*np.tanh(ac)
        np.testing.assert_allclose(cs[t].double().numpy(),ac,rtol=2e-5,atol=2e-6)
        np.testing.assert_allclose(hs[t].double().numpy(),ah,rtol=2e-5,atol=2e-6)
    assert hs.shape==cs.shape==(T,B,H)
    torch.testing.assert_close(final[0],nh,rtol=2e-5,atol=2e-6)
    torch.testing.assert_close(final[1],nc,rtol=2e-5,atol=2e-6)
    assert all(torch.equal(a,b) for a,b in zip(original,(x,W,b,h,c)))
    # Chunk continuation must retain both states and equal the full sequence.
    first=sequence(x[:T//2],W,b,initial)
    second=sequence(x[T//2:],W,b,first[2])
    torch.testing.assert_close(torch.cat((first[0],second[0])),hs)
    torch.testing.assert_close(second[2][1],final[1])
    cases+=1
# Complete derivatives include the dependence of all gates on h, not just carry.
x=torch.randn(3,1,2,dtype=torch.float64,requires_grad=True)*.1
W=torch.randn(8,4,dtype=torch.float64,requires_grad=True)*.1
b=torch.randn(8,dtype=torch.float64,requires_grad=True)*.1
h=torch.randn(1,2,dtype=torch.float64,requires_grad=True)*.1
c=torch.randn(1,2,dtype=torch.float64,requires_grad=True)*.1
assert torch.autograd.gradcheck(lambda x,W,b,h,c: sequence(x,W,b,(h,c))[:2],(x,W,b,h,c),eps=1e-6,atol=1e-5,rtol=1e-3)
print(f'{cases} LSTM CPU configurations match native and independent NumPy references; empty/state/continuation/nonmutation checks and full recurrent gradcheck pass; torch {torch.__version__}.')
scales,initialize,residual,run=[ns[n] for n in ('loop_scales','initialize_shared_once','residual_sublayer','run_shared_stack')]
for K,R,p in itertools.product(range(1,9),range(1,9),[0.,.25,.5]):
    alpha,beta=scales(K,R,p)
    assert abs(alpha-(2*K*R)**p)<1e-12
    assert abs(beta-(8*K*R)**(-p))<1e-12
for args in [(0,1),(1,0),(True,1),(1,1,-.1),(1,1,float('nan'))]:
    try: scales(*args)
    except ValueError: pass
    else: raise AssertionError('expected invalid scaling rejection')
w=torch.nn.Parameter(torch.zeros(2,2)); v=torch.nn.Parameter(torch.zeros(2,2))
calls=[]
def base(t): calls.append(id(t)); t.fill_(2)
initialize([w,v,w,v],base,.25)
assert len(calls)==2 and torch.equal(w,torch.full_like(w,.5))
assert w.is_leaf and w.requires_grad and w.grad_fn is None
xx=torch.tensor([[1.,2.]])
branch=lambda x: x.square()+.3
norm=lambda x: x/(x.square().mean(-1,keepdim=True)+1e-5).sqrt()
torch.testing.assert_close(residual(xx,branch,norm,3),norm(3*xx+branch(xx)))
visits=[]
blocks=[lambda x: (visits.append(0) or x+1),lambda x: (visits.append(1) or x*2)]
torch.testing.assert_close(run(torch.zeros(1),blocks,3),torch.tensor([14.]))
assert visits==[0,1,0,1,0,1]
# The derivative of a tied parameter equals the sum of use-specific derivatives.
for rounds in [1,2,4,7]:
    shared=torch.tensor(.2,dtype=torch.float64,requires_grad=True)
    x0=torch.tensor(.4,dtype=torch.float64)
    result=run(x0,[lambda x: torch.tanh(x*shared+.1)],rounds)
    tied=torch.autograd.grad(result,shared)[0]
    copies=[shared.detach().clone().requires_grad_() for _ in range(rounds)]
    out=x0
    for weight in copies: out=torch.tanh(out*weight+.1)
    untied=torch.autograd.grad(out,copies)
    torch.testing.assert_close(tied,sum(untied))
print('192 scaling cases; initialization identity/no-grad checks, residual order, six shared visits and four tied-gradient sums pass. Not a trained Transformer or cache implementation.')
`],{input:JSON.stringify(snippets),encoding:'utf8',maxBuffer:1024*1024}).trim());
