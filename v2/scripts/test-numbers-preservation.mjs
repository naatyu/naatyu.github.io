import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {numbersReader} from '../site/readers/numbers.js';
import {reviewedFragments,resolveReviewedNote} from '../site/reviewed-navigation.js';

const html=numbersReader(slug=>'/atlas/'+slug);
const decode=value=>value.replaceAll('&lt;','<').replaceAll('&gt;','>').replaceAll('&amp;','&');
const snippets=[...html.matchAll(/<pre(?: [^>]*)?><code>([\s\S]*?)<\/code><\/pre>/g)].map(match=>decode(match[1])).filter(code=>code.startsWith('def ')||code.startsWith('from math import gcd'));
const checks=String.raw`
import sys,json,re,itertools,math,collections
functions={}
for code in json.loads(sys.stdin.read()):
    namespace={}
    exec(code,namespace)
    for name in re.findall(r'^def (\w+)\(',code,re.M):
        functions[name]=namespace[name]
expected={'mask_subsets','single_number','count_bits','next_power_of_two','is_power_of_two','align_up','align_down','align_down_arbitrary','align_up_arbitrary','gcd','lcm','mod_power','slope_key'}
assert set(functions)==expected,set(functions)
f=functions
subset_cases=0
for n in range(6):
    for source in itertools.product([-1,0,1],repeat=n):
        values=list(source); before=values[:]
        actual=f['mask_subsets'](values)
        wanted=[tuple(values[i] for i in indices) for k in range(n+1) for indices in itertools.combinations(range(n),k)]
        assert collections.Counter(map(tuple,actual))==collections.Counter(wanted)
        assert values==before
        assert len({id(answer) for answer in actual})==len(actual)
        subset_cases+=1
for unique in range(-100,101):
    values=[-107,43,-107,unique,43]
    assert f['single_number'](values)==unique
    assert f['single_number'](list(reversed(values)))==unique
for n in range(65536):
    assert f['count_bits'](n)==bin(n).count('1')
    assert f['is_power_of_two'](n)==(n in {1<<k for k in range(16)})
for n in range(1,10001):
    result=f['next_power_of_two'](n)
    assert result>=n and result//2<n
    assert result in {1<<k for k in range(15)}
alignment_cases=0
for x in range(-40,129):
    for a in range(1,34):
        down=(x//a)*a; up=-((-x)//a)*a
        assert f['align_down_arbitrary'](x,a)==down
        assert f['align_up_arbitrary'](x,a)==up
        if x>=0 and a in {1,2,4,8,16,32}:
            assert f['align_down'](x,a)==down
            assert f['align_up'](x,a)==up
        alignment_cases+=1
for a in range(-40,41):
    for b in range(-40,41):
        assert f['gcd'](a,b)==math.gcd(a,b)
        expected=0 if a==0 or b==0 else abs(a//math.gcd(a,b)*b)
        assert f['lcm'](a,b)==expected
for base in range(-10,11):
    for exponent in range(12):
        for mod in range(1,56):
            assert f['mod_power'](base,exponent,mod)==pow(base,exponent,mod)
for dy in range(-10,11):
    for dx in range(-10,11):
        key=f['slope_key'](dy,dx)
        if dy==dx==0:
            assert key is None
        else:
            ky,kx=key
            assert ky*dx==kx*dy
            assert math.gcd(abs(ky),abs(kx))==1
            assert kx>0 or kx==0 and ky>0
            assert f['slope_key'](-3*dy,-3*dx)==key
invalid=[('count_bits',(-1,)),('next_power_of_two',(0,)),('next_power_of_two',(-1,)),('align_up',(-1,8)),('align_down',(-1,8)),('mod_power',(2,-1,3)),('mod_power',(2,1,0))]
for name in ['align_down','align_up']:
    invalid += [(name,(1,a)) for a in [0,-1,3,6]]
for name in ['align_down_arbitrary','align_up_arbitrary']:
    invalid += [(name,(1,a)) for a in [0,-1]]
for name,args in invalid:
    try:
        f[name](*args)
        raise AssertionError('invalid domain accepted: '+name)
    except ValueError:
        pass
print(json.dumps({'functions':len(functions),'subsets':subset_cases,'alignmentPairs':alignment_cases}))
`;
const result=JSON.parse(execFileSync('/usr/bin/python3',['-c',checks],{input:JSON.stringify(snippets),encoding:'utf8'}));
assert.equal(result.functions,13);assert.equal(result.subsets,364);assert.equal(result.alignmentPairs,5577);
const sources=['interview-prep/neetcode-roadmap/bit-manipulation','interview-prep/neetcode-roadmap/math-and-geometry','programming/python/bit-tricks-powers-of-two-and-alignment'];
let fragments=0;
for(const source of sources){
  assert(!html.includes(source));
  for(const [fragment,anchor] of Object.entries(reviewedFragments[source])){
    assert.deepEqual(resolveReviewedNote(source+'#'+fragment),{slug:'algorithms/numbers',anchor});
    assert(html.includes('id="'+anchor+'"'),fragment);fragments++;
  }
}
assert.equal(fragments,43);
assert(!html.includes('Complete original references'));
console.log(`Numbers preservation: ${result.functions} actual Python functions, ${result.subsets} subset inputs, ${result.alignmentPairs} signed alignment pairs, exhaustive bit/arithmetic references,43 reviewed headings pass.`);
