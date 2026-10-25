import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {recurrenceReader} from '../site/readers/recurrence.js';
const html=recurrenceReader(s=>s),blocks=[...html.matchAll(/<pre[^>]*aria-label="Feedback [^\"]*"[^>]*><code>([\s\S]*?)<\/code><\/pre>/g)].map(m=>m[1].replaceAll('&lt;','<').replaceAll('&gt;','>').replaceAll('&amp;','&'));
assert.equal(blocks.length,2);
assert.ok(!html.includes('</details>p>'), 'Feedback prose must use a real opening paragraph tag.');
assert.ok(html.includes('200B best feedback') && html.includes('400B best feedback'));
for (const text of ['first-pass loss preserves STANDARD', 'schedule starts with ordinary pretraining', 'Latest-write tracking retrieves', 'z-loss of 10⁻⁵ begins during cooldown', 'neither released weights nor an official end-to-end implementation']) assert.ok(html.includes(text), text);
const program=String.raw`
import ast,json,sys
blocks=json.load(sys.stdin)
assert [n.name for s in blocks for n in ast.walk(ast.parse(s)) if isinstance(n,ast.FunctionDef)]==['feedback_inputs','feedback_objective']
print('Two rendered feedback functions compile.')
if sys.argv[1]=='syntax':sys.exit(0)
import torch,itertools,numpy as np
scope={}
for s in blocks:exec(s,scope)
fuse,objective=scope['feedback_inputs'],scope['feedback_objective']
torch.manual_seed(27)
cases=0
for B,T,D,dtype in itertools.product([1,2],[0,1,4],[1,3],[torch.float32,torch.float64]):
    e=torch.randn(B,T,D,dtype=dtype);h=torch.randn_like(e)
    u=torch.randn(D,D,dtype=dtype);g=torch.randn_like(u)
    for p in range(1,T+1) if T else [0]:
        prefix=torch.full((B,),p,dtype=torch.long)
        result=fuse(e,h,u,g,prefix)
        expected=e.clone()
        for b in range(B):
            for t in range(p,T):
                value=np.array([sum(float(u[j,k])*float(h[b,t-1,k]) for k in range(D)) for j in range(D)])
                gate=np.array([sum(float(g[j,k])*float(e[b,t,k]) for k in range(D)) for j in range(D)])
                expected[b,t]=torch.tensor(value/(1+np.exp(-gate)),dtype=dtype)
        torch.testing.assert_close(result,expected)
        future=h.clone()
        if T:future[:,-1]+=100
        torch.testing.assert_close(fuse(e,future,u,g,prefix),result)
        cases+=1
e=torch.randn(2,4,3,dtype=torch.float64)*.1
u=torch.randn(3,3,dtype=torch.float64)*.1;g=torch.randn_like(u)*.1
prefix=torch.tensor([1,3]);x=fuse(e,e,u,g,prefix)
torch.testing.assert_close(x[1,:3],e[1,:3])
def run(x):return torch.tanh(x.cumsum(1))
for K in [1,2,3,5]:
    prefixes=[prefix]*(K-1)
    call=lambda e,h,p:fuse(e,h,u,g,p)
    loss=objective(e,run,lambda h:h.square().sum(),call,prefixes)
    h=run(e);first=h.square().sum();later=[]
    for p in prefixes:h=run(call(e,h,p));later.append(h.square().sum())
    expected=first+sum(later)/len(later) if later else first
    torch.testing.assert_close(loss,expected)
args=tuple(x.clone().requires_grad_() for x in [e,u,g])
def checked(e,u,g):return objective(e,run,lambda h:h.square().sum(),lambda e,h,p:fuse(e,h,u,g,p),[prefix,prefix])
assert torch.autograd.gradcheck(checked,args,eps=1e-6,atol=1e-5,rtol=1e-3)
states=[]
def tracked(x):
    h=run(x);h.retain_grad();states.append(h);return h
counter=[0]
def only_later(h):
    counter[0]+=1
    return h.sum()*0 if counter[0]==1 else h.square().sum()
objective(args[0],tracked,only_later,lambda e,h,p:fuse(e,h,args[1],args[2],p),[prefix]).backward()
assert states[0].grad.abs().sum()>0
print(f'{cases} shifted-fusion cases match independent scalar projections; empty/prefix/future-state checks, four loss-averaging budgets and full three-pass gradcheck pass. Later-only loss reaches earlier states.')
`;
console.log(execFileSync(process.env.ATLAS_TORCH_PYTHON||'python3',['-c',program,process.env.ATLAS_TORCH_PYTHON?'tensors':'syntax'],{input:JSON.stringify(blocks),encoding:'utf8'}).trim());
