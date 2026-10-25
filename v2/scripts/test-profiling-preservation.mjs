import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import GithubSlugger from 'github-slugger';
import {profilingReader,profilingMeta} from '../site/readers/profiling.js';
import {reviewedNavigation,reviewedFragments,resolveReviewedNote} from '../site/reviewed-navigation.js';

const html=profilingReader(s=>s);
const ids=new Set([...html.matchAll(/ id="([^"]+)"/g)].map(m=>m[1]));
let headingCount=0;
for(const [slug,count]of [['tooling/profiling/nsys-profiler',27],['tooling/profiling/pytorch-profiler-and-gpu-trace-reading',25]]){
  const body=readFileSync(new URL('../../docs/'+slug+'.md',import.meta.url),'utf8'),g=new GithubSlugger(),headings=[];let fence=false;
  for(const line of body.split('\n')){if(line.startsWith('```')){fence=!fence;continue;}if(!fence&&/^#{1,6} /.test(line))headings.push(g.slug(line.replace(/^#+ /,'')));}
  assert.equal(headings.length,count);assert.deepEqual(Object.keys(reviewedFragments[slug]),headings);
  assert.equal(reviewedNavigation[slug].slug,profilingMeta.slug);
  for(const heading of headings){const target=resolveReviewedNote(slug+'#'+heading);assert.equal(target.slug,profilingMeta.slug);assert.ok(ids.has(target.anchor));headingCount++;}
}
assert.equal(headingCount,52);
assert.equal((html.match(/class="inline-math"/g)||[]).length,2);
assert.equal((html.match(/<math /g)||[]).length,3);
assert.ok(html.includes('QK^{\\top}'));
assert.ok(!html.includes('QK^{\\\\top}'));
assert.ok(html.includes('href="execution/serving#kv-state"'));
for(const text of ['cudaMemcpyAsync','cudaStreamSynchronize','cudaEventRecord','pthread_cond_wait','DALI','DataLoader','storage latency','Tensor Core-friendly','producer','state lifetime'])assert.ok(html.includes(text),text);
const snippets=[...html.matchAll(/<pre[^>]*><code>([\s\S]*?)<\/code><\/pre>/g)].map(m=>m[1].replaceAll('&lt;','<').replaceAll('&gt;','>').replaceAll('&amp;','&'));
assert.equal(snippets.length,12);
assert.equal((html.match(/<pre tabindex="0" role="region"/g)||[]).length,12);
const python=String.raw`
import ast,json,sys,shlex,types
snippets=json.loads(sys.argv[1])
for i in [0,1,2,3,8,9,10,11]:
    ast.parse(snippets[i])
basic=shlex.split(snippets[5])
assert basic==['nsys','profile','-o','profile_report','python','train.py','--arg1','value1','--arg2','value2']
capture=shlex.split(snippets[6].replace('\\\n',' '))
assert capture==['nsys','profile','--trace=cuda,osrt,nvtx','--sample=none','--cpuctxsw=none','--delay=10','--duration=0.8','--kill=none','-o','/tmp/train_profile','python','train.py','--arg1','value1','--arg2','value2']
assert len(snippets[7].splitlines())==5
events=[]
fake_torch=types.ModuleType('torch')
fake_torch.cuda=types.SimpleNamespace(synchronize=lambda device:events.append(('sync',device)))
fake_time=types.ModuleType('time')
def clock():
    events.append(('clock',None))
    return 10.0 if len([e for e in events if e[0]=='clock'])==1 else 13.5
fake_time.perf_counter=clock
sys.modules['torch']=fake_torch
sys.modules['time']=fake_time
scope={}
exec(snippets[8],scope)
for count in range(1,65):
    for device in [None,0,'cuda:2']:
        events.clear()
        result=scope['elapsed_cuda'](lambda:events.append(('step',None)),count,device)
        assert result==3.5
        assert events==[('sync',device),('clock',None)]+[('step',None)]*count+[('sync',device),('clock',None)]
for count in [0,-1,True,False,1.5,'2',None]:
    events.clear()
    try:
        scope['elapsed_cuda'](lambda:events.append(('step',None)),count)
    except ValueError:
        pass
    else:
        raise AssertionError('invalid iteration count accepted')
    assert events==[]
print('8 syntax checks; 2 shell argv checks; 192 fake-device timing cases; 7 invalid counts')
`;
assert.equal(execFileSync('/usr/bin/python3',['-c',python,JSON.stringify(snippets)],{encoding:'utf8'}).trim(),'8 syntax checks; 2 shell argv checks; 192 fake-device timing cases; 7 invalid counts');
for(const text of ['157.4','202.1','244.7 stage precedes tensor parallelism','specialized decode kernels','241 tokens/s','not per-step seconds','not execute a CUDA benchmark'])assert.ok(html.includes(text),text);
assert.equal(107/25.5>4.19&&107/25.5<4.20,true);
console.log('Profiling preservation: rendered Python syntax, exact capture arguments and boundary-timing control flow pass; no CUDA performance execution implied.');
