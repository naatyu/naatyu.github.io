import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {runInNewContext} from 'node:vm';
import {parseFragment} from 'parse5';
import {diffusionReader,diffusionSections} from '../site/readers/diffusion.js';
import {sidCoordinateLoss} from '../site/readers/diffusion-model.js';
import {assertGeneratedMarkup} from './check-generated-markup.mjs';
const nodes=[];
function walk(n){nodes.push(n);for(const c of n.childNodes||[])walk(c);}
walk(parseFragment(assertGeneratedMarkup(diffusionReader(()=>''),'released SiD loss')));
const attr=(n,k)=>n.attrs?.find(a=>a.name===k)?.value;
const text=n=>(n.value||'')+(n.childNodes||[]).map(text).join('');
const descendants=(n,tag)=>{const out=[];function visit(x){if(x.tagName===tag)out.push(x);for(const c of x.childNodes||[])visit(c);}visit(n);return out;};
const section=nodes.find(n=>attr(n,'id')==='sid-implementation');assert(section);
assert(diffusionSections.some(([id])=>id==='sid-implementation'));
for(const phrase of ['not the separate adversarial SiDA branch','channels and spatial coordinates','float32','value detached','sum with a pixel mean changes gradient magnitude','does not implement autograd','NaN-sample filtering','does not bound the loss or gradient','all-filtered batch case','Image pixels are overwritten','agreeing with Table 6'])assert(text(section).includes(phrase),phrase);
const formulas=descendants(section,'annotation').map(text).join(' ');
for(const tex of [String.raw`\max\left(10^{-5}`,String.raw`\frac1K\sum_{i=1}^{K}|y_i-D_{T,i}|`,String.raw`\Delta_i[(1-\lambda)\Delta_i+D_{A,i}-y_i]`])assert(formulas.includes(tex),tex);
assert(formulas.includes(String.raw`\log\sigma_{\mathrm{aux}}&=-1.2+1.2Z`));
assert(formulas.includes(String.raw`(\sigma_{\mathrm{aux}}\,0.5)^2`));
assert(text(section).includes('not the generator’s bounded uniform-time schedule'));
const code=text(descendants(section,'code')[0]);assert.equal(code,sidCoordinateLoss.toString());assert(code.split('\n').length<=15);
const rendered=runInNewContext('('+code+')');
const examples=[];
for(const size of [1,2,5])for(const y of [-2,0,2])for(const t of [-1,0,3])for(const a of [-2,1])for(const mixing of [-.25,0,1,1.2])for(const scale of [0,1e-6,1]){
  examples.push({y:Array.from({length:size},(_,i)=>(y+i%2)*scale),teacher:Array.from({length:size},(_,i)=>(t-i%2)*scale),auxiliary:Array.from({length:size},(_,i)=>(a+i%2)*scale),mixing});
}
const reference=JSON.parse(execFileSync('python3',['-c',`from decimal import Decimal, localcontext
import json,sys
examples=json.load(sys.stdin)
with localcontext() as ctx:
    ctx.prec=70
    output=[]
    for e in examples:
        y,t,a=[[Decimal(str(v)) for v in e[key]] for key in ['y','teacher','auxiliary']]
        mixing=Decimal(str(e['mixing']))
        denominator=max(Decimal('0.00001'),sum(abs(v-w) for v,w in zip(y,t))/len(y))
        loss=sum((w-u)*((w-v)-mixing*(w-u)) for v,w,u in zip(y,t,a))/denominator
        output.append([float(denominator),float(loss)])
    print(json.dumps(output))
`],{input:JSON.stringify(examples),encoding:'utf8',maxBuffer:2*1024*1024}));
const near=(a,b)=>assert(Math.abs(a-b)<=1e-11*Math.max(Math.abs(b),1e-10),`${a} != ${b}`);
for(let i=0;i<examples.length;i++){
  const e=examples[i],args=[e.y,e.teacher,e.auxiliary,e.mixing];
  for(const fn of [sidCoordinateLoss,rendered]){
    const result=fn(...args);near(result.scale,reference[i][0]);near(result.loss,reference[i][1]);
    const doubled=fn([...e.y,...e.y],[...e.teacher,...e.teacher],[...e.auxiliary,...e.auxiliary],e.mixing);
    near(doubled.scale,result.scale);near(doubled.loss,2*result.loss);
  }
}
assert.deepEqual(descendants(section,'table').slice(0,1).flatMap(t=>descendants(t,'tr').slice(1)).map(r=>descendants(r,'td').map(text)),[['[0,2]','1.00000','-2.4'],['[1,1]','0.00001','-240000']]);
const bad=[ [[],[],[]],[[1],[1,2],[0]],[[NaN],[0],[0]],[[1],[Infinity],[0]],[[1],[1],[-Infinity]],[[1],[0],[0],NaN],[undefined,[0],[0]],[[,],[0],[0]],[[1e308],[-1e308],[0]] ];
for(const args of bad){assert.throws(()=>sidCoordinateLoss(...args),RangeError);assert.throws(()=>rendered(...args),/required|Nonfinite loss/);}
const ownership=descendants(section,'table')[1];
const roles=descendants(ownership,'tr').slice(1).map(r=>descendants(r,'td').map(text));
assert.deepEqual(roles.map(r=>r.slice(0,2)),[['Auxiliary update','Auxiliary only'],['Generator update','Generator only'],['Evaluation','None']]);
const links=descendants(section,'a').map(n=>attr(n,'href'));
assert(links.length===3&&links.every(u=>u.includes('/01fbb13cf18411e5f70d187c8fb2559567e5ae1c/')));
console.log(`Released SiD: ${examples.length} Decimal comparisons and duplicate-coordinate scaling cases execute the actual rendered scalar kernel; nine invalid domains, exact example/ownership/source conditions pass. No tensor/autograd execution.`);
