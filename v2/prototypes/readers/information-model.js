export function distribution(p){if(!Array.isArray(p)||!p.length||p.includes(undefined)||p.some(x=>!Number.isFinite(x)||x<0)||Math.abs(p.reduce((a,b)=>a+b,0)-1)>1e-9)throw new RangeError('Expected a finite probability distribution');return p;}
function pair(p,q){distribution(p);distribution(q);if(p.length!==q.length)throw new RangeError('Mismatched alphabets');}
function baseScale(base){if(!Number.isFinite(base)||base<=1)throw new RangeError('Log base must exceed one');return Math.log(base);}
export function entropy(p,base=2){distribution(p);const scale=baseScale(base);return -p.reduce((s,x)=>s+(x===0?0:x*Math.log(x)/scale),0);}
export function crossEntropy(p,q,base=2){pair(p,q);const scale=baseScale(base);return p.reduce((s,x,i)=>s+(x===0?0:q[i]===0?Infinity:-x*Math.log(q[i])/scale),0);}
export function kl(p,q,base=2){pair(p,q);const scale=baseScale(base);return p.reduce((s,x,i)=>s+(x===0?0:q[i]===0?Infinity:x*(Math.log(x)-Math.log(q[i]))/scale),0);}
export function jsd(p,q,base=2){
  pair(p,q);const scale=baseScale(base);
  return p.reduce((sum,x,i)=>{
    const y=q[i];if(x===y)return sum;
    const hi=Math.max(x,y),lo=Math.min(x,y);
    // log((x+y)/2) without rounding a positive subnormal mixture to zero.
    const logMixture=Math.log(hi)+Math.log1p(lo/hi)-Math.LN2;
    return sum+(x===0?0:x*((Math.log(x)-logMixture)/scale))
      +(y===0?0:y*((Math.log(y)-logMixture)/scale));
  },0)/2;
}
export const codingP=[.125,.125,.25,.5],codingQ=[.5,.25,.125,.125];
export function codingFrame(t){if(!Number.isFinite(t)||t<0||t>1)throw new RangeError('Blend must be in [0,1]');const q=codingQ.map((v,i)=>v*(1-t)+codingP[i]*t);return {p:[...codingP],q,h:entropy(codingP),ce:crossEntropy(codingP,q),kl:kl(codingP,q)};}
