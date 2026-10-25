export const formats=Object.freeze({E4M3FN:{exponent:4,mantissa:3,bias:7,last:126},E5M2:{exponent:5,mantissa:2,bias:15,last:123},E2M1:{exponent:2,mantissa:1,bias:1,last:7},BF16:{exponent:8,mantissa:7,bias:127,last:32639}});
const books=new Map();
export function positiveCodebook(name){const f=formats[name];if(!f)throw new RangeError('Unknown format');if(books.has(name))return books.get(name);const values=Object.freeze(Array.from({length:f.last+1},(_,code)=>{const e=Math.floor(code/2**f.mantissa),m=code%2**f.mantissa;return e?(1+m/2**f.mantissa)*2**(e-f.bias):m*2**(1-f.bias-f.mantissa);}));books.set(name,values);return values;}
export function roundFloat(x,name='E4M3FN',scale=1){
  if(!Number.isFinite(x)||!Number.isFinite(scale)||scale<=0)throw new RangeError('Finite input and positive scale required');
  const b=positiveCodebook(name),a=Math.abs(x)/scale,max=b.at(-1);let lo=0,hi=b.length-1;
  while(lo<hi){const mid=Math.floor((lo+hi)/2);if(b[mid]<a)lo=mid+1;else hi=mid;}
  const upper=lo,lower=Math.max(0,upper-(b[upper]>a?1:0));let code;
  if(a>=max)code=b.length-1;else{const down=a-b[lower],up=b[upper]-a;code=down<up?lower:up<down?upper:lower%2===0?lower:upper;}
  const sign=x<0||Object.is(x,-0)?-1:1,q=sign*b[code],value=q*scale;
  if(!Number.isFinite(value))throw new RangeError('Reconstruction overflow');
  return {value,q,code,error:value-x,clipped:a>max,underflow:x!==0&&q===0,lower:sign>0?b[lower]*scale:-b[upper]*scale,upper:sign>0?b[upper]*scale:-b[lower]*scale};
}
export function roundEven(x){if(!Number.isFinite(x))throw new RangeError('Finite number required');const lo=Math.floor(x),f=x-lo;return f<.5?lo:f>.5?lo+1:lo%2===0?lo:lo+1;}
export function fakeQuant(x,scale=1,qmin=-7,qmax=7,zero=0){
  if(!Number.isFinite(x)||!Number.isFinite(scale)||scale<=0||![qmin,qmax,zero].every(Number.isSafeInteger)||qmin>=qmax||zero<qmin||zero>qmax)throw new RangeError('Invalid affine quantizer');
  const real=x/scale+zero,q=Math.max(qmin,Math.min(qmax,roundEven(x/scale)+zero)),value=scale*(q-zero);
  if(!Number.isFinite(value))throw new RangeError('Reconstruction overflow');return {q,value,error:value-x,clipped:real<qmin||real>qmax};
}
export function blockQuantize(outlier=64,scheme='tensor'){
  if(!Number.isFinite(outlier)||outlier<0||!['tensor','row','column','block'].includes(scheme))throw new RangeError('Invalid block scenario');
  const values=[1,1.5,2,2.5,.25,.5,.75,1,2,3,4,6,-.5,1,-2,outlier],group=i=>scheme==='tensor'?0:scheme==='row'?Math.floor(i/4):scheme==='column'?i%4:Math.floor(Math.floor(i/4)/2)*2+Math.floor((i%4)/2),count=scheme==='tensor'?1:4;
  const scales=Array(count).fill(1);
  for(let g=0;g<count;g++)scales[g]=Math.max(...values.filter((_,i)=>group(i)===g).map(Math.abs))/6||1;
  const restored=values.map((x,i)=>roundFloat(x,'E2M1',scales[group(i)]).value),errors=restored.map((x,i)=>x-values[i]);
  return {values,restored,errors,scales,groups:values.map((_,i)=>group(i)),rms:Math.sqrt(errors.reduce((s,x)=>s+x*x,0)/16),mean:errors.reduce((s,x)=>s+x,0)/16};
}
export function scaleTrace(policy='current',history=3){
  if(!['current','delayed'].includes(policy)||!Number.isInteger(history)||history<1||history>8)throw new RangeError('Invalid scale history');
  const maxima=[1,1,1,8,1,1,1,1,1],past=[1];return maxima.map((amax,step)=>{const selected=policy==='current'?amax:Math.max(...past.slice(-history)),scale=selected/6,quant=roundFloat(amax,'E2M1',scale),f={step,amax,selected,scale,value:quant.value,error:quant.error,clipped:quant.clipped};past.push(amax);return f;});
}
export function attentionRounding(a=.6,mode='nearest',delta=.25){
  if(!Number.isFinite(a)||a<0||a>1||!['nearest','floor','stochastic'].includes(mode)||![.125,.25,.5].includes(delta))throw new RangeError('Invalid attention scenario');
  const p=[a,.75*(1-a),.25*(1-a)],v=[0,2,10],reference=p.reduce((s,x,i)=>s+x*v[i],0);
  const outcomes=mode==='stochastic'?p.map(x=>{const y=x/delta,lo=Math.floor(y),f=y-lo;return [{value:lo*delta,prob:1-f},{value:(lo+1)*delta,prob:f}];}):p.map(x=>[{value:(mode==='floor'?Math.floor(x/delta):roundEven(x/delta))*delta,prob:1}]);
  let distribution=[{p:[],prob:1}];for(const choices of outcomes)distribution=distribution.flatMap(d=>choices.map(c=>({p:[...d.p,c.value],prob:d.prob*c.prob}))).filter(d=>d.prob>0);
  distribution=distribution.map(d=>({...d,output:d.p.reduce((s,x,i)=>s+x*v[i],0),mass:d.p.reduce((s,x)=>s+x,0)}));
  const expectedP=p.map((_,i)=>distribution.reduce((s,d)=>s+d.prob*d.p[i],0)),mean=distribution.reduce((s,d)=>s+d.prob*d.output,0),variance=distribution.reduce((s,d)=>s+d.prob*(d.output-mean)**2,0),bias=mean-reference;
  return {p,v,reference,expectedP,mean,variance,bias,mse:variance+bias*bias,mass:expectedP.reduce((s,x)=>s+x,0),distribution};
}
