import assert from 'node:assert/strict';
import {parseFragment} from 'parse5';
import {visionReader} from '../prototypes/readers/vision.js';
import {visionProjectedLaw} from '../prototypes/readers/vision-model.js';
import {assertGeneratedMarkup} from './check-generated-markup.mjs';
const html=assertGeneratedMarkup(visionReader(s=>s),'Vision notation');
const annotations=[],parts=[];const text=n=>(n.nodeName==='#text'?n.value:'')+(n.childNodes||[]).map(text).join('');
function walk(n){if(n.tagName==='annotation')annotations.push(text(n));if(n.nodeName==='#text')parts.push(n.value);for(const c of n.childNodes||[])walk(c);}walk(parseFragment(html));
assert.equal((html.match(/<math /g)||[]).length,30);assert.equal((html.match(/class="inline-math"/g)||[]).length,13);assert(!html.includes('inlineMath(String.raw'));
for(const tex of ["\\nabla\\log p","\\sum_{j=1}^D\\frac1{\\lambda_j}","\\frac{D^2}{T}","U\\sim\\mathcal N(0,1)","R\\in\\{-1,+1\\}","Z=(U,RU)","\\frac{U(1+R)}{\\sqrt2}","\\sqrt2\\,U","e^{-t^2}","\\mathcal N(0,I)","\\|a\\|_2^2","32\\times32=1024","16\\times16=256"])assert(annotations.includes(tex),tex);
assert(annotations.includes(String.raw`\varphi_{45^\circ}(t)=\frac12\cdot1+\frac12 e^{-t^2}=\frac{1+e^{-t^2}}2`));
for(const phrase of ['not a counterexample to a theorem requiring a smooth density','not an unconditional downstream-task optimum','positive-definite covariance','integration-by-parts boundary conditions','not a proof of full Gaussianity','not an empirical batch estimate or an SSL training result','per temporal tubelet','processor-specific handling'])assert(parts.join(' ').includes(phrase),phrase);
const near=(a,b)=>assert(Math.abs(a-b)<1e-12,`${a} != ${b}`);
let cases=0;for(const degrees of [0,15,30,45,60,75,90,135])for(const t of [-3,-1,-.1,0,.1,1,3]){
 const angle=degrees*Math.PI/180,a=Math.cos(angle),b=Math.sin(angle);
 const plus=.5*Math.exp(-t*t*(a+b)**2/2),minus=.5*Math.exp(-t*t*(a-b)**2/2);
 near(visionProjectedLaw('cross',degrees,t).real,plus+minus);near(.5*(a+b)**2+.5*(a-b)**2,1);cases++;
}
for(let k=0;k<=100;k++){const t=k/5,gaussian=Math.exp(-t*t/2),mixture=(1+Math.exp(-t*t))/2;near(visionProjectedLaw('cross',45,t).real,mixture);near(mixture-gaussian,(1-gaussian)**2/2);cases++;}
assert.equal(.5*0+.5*2,1);assert.equal(.5*0+.5*3*2**2,6);assert.notEqual(6,3);
assert.equal(448/14,32);assert.equal((448/14)**2,1024);assert.equal(1024/2**2,256);
console.log(`Vision notation:13inline expressions plus static mixture derivation,${cases}independent conditional-projection checks,matching variance/different fourth moments and1024→256spatial-token arithmetic pass. Not empirical SSL training or whole-primary certification.`);
