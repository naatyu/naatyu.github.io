import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {recurrenceReader} from '../prototypes/readers/recurrence.js';
const html=recurrenceReader(s=>s);
const blocks=[...html.matchAll(/<pre[^>]*aria-label="Recirculation [^\"]*"[^>]*><code>([\s\S]*?)<\/code><\/pre>/g)].map(m=>m[1].replaceAll('&lt;','<').replaceAll('&gt;','>').replaceAll('&amp;','&'));
assert.equal(blocks.length,3);
const python=process.env.ATLAS_TORCH_PYTHON||'python3';
const program=String.raw`
import ast,json,sys
blocks=json.load(sys.stdin)
trees=[ast.parse(s) for s in blocks]
assert [n.name for t in trees for n in ast.walk(t) if isinstance(n,ast.FunctionDef)] == ['mix_for_recirculation','make_adaptive_mixer','adaptive_mix']
for t in trees: compile(t,'rendered-recirculation','exec')
print('Three rendered Recirculation functions compile.')
if sys.argv[1]=='syntax': sys.exit(0)
import itertools,torch,numpy as np
scope={}
for block in blocks: exec(block,scope)
mix,build,adaptive=[scope[n] for n in ['mix_for_recirculation','make_adaptive_mixer','adaptive_mix']]
torch.manual_seed(17)
cases=0
for d,batch,dtype,a,b in itertools.product([1,2,7],[1,3],[torch.float32,torch.float16,torch.bfloat16],[0.,.15,1.],[0.,.85,1.]):
    dst=torch.randn(batch,d).to(dtype); src=torch.randn(batch,d).to(dtype)
    dst[0]=0
    if batch>1:src[1]=0
    saved=[t.clone() for t in (dst,src)]
    result=mix(dst,src,a,b)
    dn=np.sqrt(np.sum(dst.float().numpy()**2,axis=-1,keepdims=True))
    sn=np.sqrt(np.sum(src.float().numpy()**2,axis=-1,keepdims=True))
    expected_source=torch.from_numpy(src.float().numpy()*(dn/np.maximum(sn,1e-6))).to(dtype)
    expected=b*dst+a*expected_source
    torch.testing.assert_close(result,expected,rtol=.02,atol=.002)
    assert result.dtype==dtype and torch.isfinite(result).all()
    assert all(torch.equal(x,y) for x,y in zip(saved,(dst,src)))
    cases+=1
tiny=torch.tensor([[1e-9,0.]])
torch.testing.assert_close(mix(torch.tensor([[1.,0.]]),tiny,1.,0.),torch.tensor([[.001,0.]]))
for d in [1,2,7,16]:
    net=build(d)
    assert sum(p.numel() for p in net.parameters())==5*d*d+8*d
    dst=torch.randn(3,d);src=torch.randn(3,d)
    coefficients=net(torch.cat([src,dst],-1)).sigmoid()
    torch.testing.assert_close(coefficients[:,:d],torch.full_like(dst,.1))
    torch.testing.assert_close(coefficients[:,d:],torch.full_like(dst,.9))
    torch.testing.assert_close(adaptive(net,dst,src),mix(dst,src,.1,.9))
    # Two updates expose gradients to hidden MLP weights after zero final initialization.
    downstream=torch.nn.Linear(d,d)
    for p in downstream.parameters():p.requires_grad_(False)
    old=[p.clone() for p in downstream.parameters()]
    optimizer=torch.optim.SGD(net.parameters(),lr=.1)
    for step in range(2):
        optimizer.zero_grad()
        loss=downstream(adaptive(net,dst,src)).square().sum()
        loss.backward()
        assert net[-1].weight.grad.abs().sum()>0
        if step:assert net[1].weight.grad.abs().sum()>0
        optimizer.step()
    assert all(torch.equal(a,b) for a,b in zip(old,downstream.parameters()))
    assert all(p.grad is None for p in downstream.parameters())
print(f'{cases} fixed-mixing CPU cases, zero/tiny norms, dtype/nonmutation, four adapter dimensions/parameter counts/initial coefficients and frozen-downstream gradient propagation pass.')
`;
console.log(execFileSync(python,['-c',program,process.env.ATLAS_TORCH_PYTHON?'tensors':'syntax'],{input:JSON.stringify(blocks),encoding:'utf8'}).trim());
