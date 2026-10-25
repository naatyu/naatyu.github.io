// Optional CPU check of the actual rendered examples. Supply an isolated torch Python.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {positionReader} from '../prototypes/readers/position.js';
const python=process.env.ATLAS_TORCH_PYTHON;
assert.ok(python,'Set ATLAS_TORCH_PYTHON to a Python interpreter with torch and numpy.');
const snippets=[...positionReader(s=>s).matchAll(/<pre[^>]*><code>([\s\S]*?)<\/code><\/pre>/g)].map(m=>m[1].replaceAll('&lt;','<').replaceAll('&gt;','>').replaceAll('&amp;','&'));
assert.equal(snippets.length,5);
const result=execFileSync(python,['-c',String.raw`
import json, sys, itertools, math
import numpy as np
import torch
parts=json.load(sys.stdin)
namespace={}
exec(parts[0], namespace)
exec(parts[1], namespace)
exec(parts[4], namespace)
frequencies=namespace['rope_frequencies']
rotate=namespace['apply_rope']
rng=np.random.default_rng(42)
cases=0
for batch,length,width,offset,base,dtype in itertools.product(
    [1,2],[0,1,5],[2,8,32],[0,1,31,4096],[10000.,500000.],
    [torch.float32,torch.float16,torch.bfloat16]):
    q=torch.tensor(rng.normal(size=(batch,4,length,width)),dtype=dtype)
    k=torch.tensor(rng.normal(size=(batch,1,length,width)),dtype=dtype)
    original_q,original_k=q.clone(),k.clone()
    cos,sin=frequencies(length,width,base=base,offset=offset)
    assert cos.shape == sin.shape == (length,width//2)
    assert cos.dtype == sin.dtype == torch.float32
    # Independent double-precision formula, using the actual quantized input.
    angles=(np.arange(length)+offset)[:,None]*base**(-np.arange(0,width,2)/width)[None,:]
    c,s=np.cos(angles),np.sin(angles)
    tolerance={torch.float32:8e-4,torch.float16:4e-3,torch.bfloat16:3e-2}[dtype]
    for x in (q,k):
        actual=rotate(x,cos[None,None],sin[None,None])
        source=x.double().numpy()
        expected=np.empty_like(source)
        expected[...,0::2]=source[...,0::2]*c-source[...,1::2]*s
        expected[...,1::2]=source[...,0::2]*s+source[...,1::2]*c
        assert actual.shape == x.shape and actual.dtype == dtype
        assert torch.isfinite(actual).all()
        np.testing.assert_allclose(actual.double().numpy(),expected,atol=tolerance,rtol=tolerance)
        np.testing.assert_allclose(actual.double().square().sum(-1).numpy(),
            x.double().square().sum(-1).numpy(),atol=tolerance*width,rtol=tolerance)
    assert torch.equal(q,original_q) and torch.equal(k,original_k)
    # Execute the published caller unchanged (its default base is 10000).
    caller=dict(namespace,q=q,k=k,offset=offset)
    exec(parts[2],caller)
    cc,ss=frequencies(length,width,offset=offset)
    assert torch.equal(caller['q'],rotate(q,cc[None,None],ss[None,None]))
    assert torch.equal(caller['k'],rotate(k,cc[None,None],ss[None,None]))
    cases+=1
def rejects(fn,*args,**kwargs):
    try: fn(*args,**kwargs)
    except ValueError: return
    raise AssertionError('expected ValueError')
for width in [0,1,3]: rejects(frequencies,4,width)
rejects(frequencies,-1,8)
for base in [0,1,-2,float('inf'),float('nan')]: rejects(frequencies,4,8,base=base)
rejects(rotate,torch.zeros(1,3),torch.zeros(1,1),torch.zeros(1,1))
rejects(rotate,torch.zeros(1,4),torch.zeros(1,1),torch.zeros(1,2))
rejects(rotate,torch.zeros(1,4),torch.zeros(1,1),torch.zeros(1,1))
print(f'{cases} CPU tensor configurations passed; float32/float16/bfloat16, grouped heads, offsets, empty sequences, norm and independent double reference; torch {torch.__version__}.')
attention=namespace['positional_attention']
attention_cases=0
for batch,length,dtype,use_rope,mask_kind in itertools.product(
    [1,2],[1,3,5],[torch.float32,torch.float16,torch.bfloat16],[False,True],
    ['default','boolean','additive']):
    q,k,v=[torch.tensor(rng.normal(size=(batch,2,length,8)),dtype=dtype) for _ in range(3)]
    cos,sin=frequencies(length,8,offset=31)
    cos,sin=cos[None,None],sin[None,None]
    allowed=np.tri(length,dtype=bool)
    if length>1: allowed[-1,0]=False  # extra restriction tests replacement mask semantics
    mask=None if mask_kind=='default' else torch.tensor(allowed)
    if mask_kind=='additive': mask=torch.where(mask,0.,-float('inf')).to(dtype)
    actual=attention(q,k,v,use_rope=use_rope,cos=cos,sin=sin,attn_mask=mask)
    qq,kk=(rotate(q,cos,sin),rotate(k,cos,sin)) if use_rope else (q,k)
    scores=qq.double().numpy()@np.swapaxes(kk.double().numpy(),-1,-2)/math.sqrt(8)
    visible=np.tri(length,dtype=bool) if mask_kind=='default' else allowed
    scores=np.where(visible,scores,-np.inf)
    weights=np.exp(scores-np.max(scores,axis=-1,keepdims=True))
    weights/=weights.sum(-1,keepdims=True)
    expected=weights@v.double().numpy()
    tolerance={torch.float32:2e-6,torch.float16:3e-3,torch.bfloat16:2e-2}[dtype]
    np.testing.assert_allclose(actual.double().numpy(),expected,atol=tolerance,rtol=tolerance)
    attention_cases+=1
q,k,v=[torch.ones(1,1,n,8) for n in [1,5,5]]
rejects(attention,q,k,v,use_rope=False)
rejects(attention,q,k,v,attn_mask=torch.ones(1,5,dtype=torch.bool))
rejects(attention,q,q,q)
# Decode token at absolute position 4 may see all keys 0..4.
actual=attention(q,k,v,use_rope=False,attn_mask=torch.ones(1,5,dtype=torch.bool))
assert torch.equal(actual,q)
print(f'{attention_cases} explicit attention-reference cases plus decode guards passed; boolean/additive/causal masks, RoPE/NoPE branches and evaluation dropout.')
`],{input:JSON.stringify(snippets),encoding:'utf8',maxBuffer:1024*1024});
console.log(result.trim());
