const finite=(...xs)=>{if(xs.some(x=>!Number.isFinite(x)))throw new RangeError('Finite values required');};
export function fgmMeanCase(theta,psi,t){
  finite(theta,psi,t);
  if(t<=0||t>=1)throw new RangeError('Interior flow time required');
  const variance=(1-t)**2+t*t,factor=t*t/(variance*variance);
  const ideal=factor*theta*theta,naive=factor*psi*psi;
  const correction=2*factor*psi*(theta-psi);
  const values={variance,ideal,naive,correction,total:naive+correction,idealGradient:2*factor*theta,naiveGradient:0,correctionGradient:2*factor*psi};
  if(Object.values(values).some(v=>!Number.isFinite(v)))throw new RangeError('Nonfinite flow example');
  return values;
}
export function sidGeneratorNoise(t){
  if(!Number.isFinite(t)||t<0||t>.8)
    throw new RangeError('Generator time outside [0,.8]');
  const low=.002**(1/7),high=80**(1/7);
  return (low+t*(high-low))**7;
}
export function sidCoordinateLoss(y,teacher,auxiliary,mixing=1.2){
  if(!Number.isFinite(mixing)||![y,teacher,auxiliary].every(a=>
    Array.isArray(a)&&a.length>0&&a.length===y.length&&Array.from(a).every(Number.isFinite)))
    throw new RangeError('Aligned finite coordinate arrays required');
  const scale=Math.max(1e-5,y.reduce((s,v,i)=>s+Math.abs(v-teacher[i]),0)/y.length);
  const loss=y.reduce((s,v,i)=>{
    const delta=teacher[i]-auxiliary[i];
    return s+delta*((1-mixing)*delta+auxiliary[i]-v)/scale;
  },0);
  if(!Number.isFinite(scale)||!Number.isFinite(loss))throw new RangeError('Nonfinite loss');
  return {scale,loss};
}
export function consistencyPair(data,z,t,s){
  finite(data,z,t,s);
  if(s<=0||t<=s)throw new RangeError('Positive reverse noise levels required');
  const high=data+t*z,low=data+s*z;
  const conditionalScore=-z/t;
  const eulerLow=high+(s-t)*(-t*conditionalScore);
  return {high,low,conditionalScore,eulerLow};
}
export function progressiveTarget(abarT,abarS,x,y){
  finite(abarT,abarS,x,y);
  if(abarT<0||abarT>=1||abarS<=abarT||abarS>1)
    throw new RangeError('Distinct reverse VP levels required');
  const aT=Math.sqrt(abarT),aS=Math.sqrt(abarS);
  const ratio=Math.sqrt((1-abarS)/(1-abarT));
  const clean=(y-ratio*x)/(aS-ratio*aT);
  return {clean,next:aS*clean+ratio*(x-aT*clean)};
}
export function vpMarginal(integratedBeta,clean,kind='vp'){
  finite(integratedBeta,clean);
  if(integratedBeta<0||!['vp','sub-vp'].includes(kind))
    throw new RangeError('Nonnegative integrated beta and VP kind required');
  const amplitude=Math.exp(-integratedBeta/2),vpVariance=-Math.expm1(-integratedBeta);
  return {amplitude,mean:amplitude*clean,variance:kind==='vp'?vpVariance:vpVariance**2};
}
export function langevinStep(x,score,step,z){
  if([x,score,step,z].some(v=>!Number.isFinite(v))||step<=0)
    throw new RangeError('Finite values and positive step required');
  return x+step*score+Math.sqrt(2*step)*z;
}
export function ddimStep(abarT,abarS,x,eps){
  finite(abarT,abarS,x,eps);
  if(abarT<=0||abarT>=1||abarS<=abarT||abarS>1)
    throw new RangeError('Reverse DDIM levels required');
  const clean=(x-Math.sqrt(1-abarT)*eps)/Math.sqrt(abarT);
  const signal=Math.sqrt(abarS)*clean,noise=Math.sqrt(1-abarS)*eps;
  return {clean,signal,noise,next:signal+noise};
}
export function ancestralStep(abarPrev,beta,x,eps,z,mode='posterior'){
  if([abarPrev,beta,x,eps,z].some(v=>!Number.isFinite(v)))
    throw new RangeError('Finite values required');
  const invalidSchedule=abarPrev<=0||abarPrev>1||beta<=0||beta>=1;
  const invalidMode=!['posterior','beta'].includes(mode);
  if(invalidSchedule||invalidMode)throw new RangeError('Invalid DDPM step');
  const alpha=1-beta,abar=abarPrev*alpha;
  const mean=(x-beta*eps/Math.sqrt(1-abar))/Math.sqrt(alpha);
  const variance=mode==='beta'?beta:beta*(1-abarPrev)/(1-abar);
  const noiseStd=abarPrev===1?0:Math.sqrt(variance);
  return {mean,variance,noiseStd,next:mean+noiseStd*z};
}
export function forwardMoments(step,beta=.08,x0=2){finite(step,beta,x0);if(!Number.isInteger(step)||step<0||step>10000||beta<=0||beta>=1)throw new RangeError('Invalid forward schedule');const log=step*Math.log1p(-beta),abar=Math.exp(log),variance=-Math.expm1(log);return {step,beta,abar,a:Math.sqrt(abar),sigma:Math.sqrt(variance),mean:Math.sqrt(abar)*x0,variance,snr:variance===0?null:abar/variance};}
export function reversePosterior(abarPrev,beta,xt,x0){finite(abarPrev,beta,xt,x0);if(abarPrev<=0||abarPrev>1||beta<=0||beta>=1)throw new RangeError('Invalid posterior');const alpha=1-beta,abar=abarPrev*alpha,den=1-abar,c0=Math.sqrt(abarPrev)*beta/den,ct=Math.sqrt(alpha)*(1-abarPrev)/den;return {c0,ct,mean:c0*x0+ct*xt,variance:beta*(1-abarPrev)/den};}
export function parameterization(abar,x0,eps){finite(abar,x0,eps);if(abar<=0||abar>=1)throw new RangeError('Interior noise level required');const a=Math.sqrt(abar),sigma=Math.sqrt(1-abar),xt=a*x0+sigma*eps,v=a*eps-sigma*x0;return {a,sigma,xt,v,x0FromV:a*xt-sigma*v,epsFromV:sigma*xt+a*v,conditionalScore:-eps/sigma,epsErrorWeightForScore:1/(sigma*sigma)};}
export function mixtureScore(x,sigma){finite(x,sigma);if(sigma<=0)throw new RangeError('Positive sigma required');const centers=[-2,2],logs=centers.map(c=>-((x-c)**2)/(2*sigma*sigma)),top=Math.max(...logs),raw=logs.map(l=>Math.exp(l-top)),total=raw[0]+raw[1],posterior=raw.map(w=>w/total),conditional=centers.map(c=>(c-x)/(sigma*sigma)),mean=posterior[0]*-2+posterior[1]*2,score=posterior.reduce((s,w,i)=>s+w*conditional[i],0),logDensity=top+Math.log(total)-Math.log(2*sigma*Math.sqrt(2*Math.PI));return {x,sigma,posterior,conditional,mean,score,logDensity,tweedie:x+sigma*sigma*score};}
export function gaussianFlow(t,z=1){finite(t,z);if(t<0||t>4)throw new RangeError('Time outside [0,4]');const variance=1+t,x=z*Math.sqrt(variance),score=-x/variance,velocity=x/(2*variance);return {t,z,variance,x,score,velocity,endpoint:x/Math.sqrt(variance),posteriorMean:x/variance,reverseDrift:x/variance};}
export function solverTrace(steps,kind='euler'){if(!Number.isInteger(steps)||steps<1||steps>64||!['euler','heun'].includes(kind))throw new RangeError('Invalid solver');const h=1/steps,points=[{t:0,x:1,exact:1}];let x=1;for(let i=1;i<=steps;i++){const slope=-x,predict=x+h*slope;x=kind==='euler'?predict:x+h*(slope-predict)/2;points.push({t:i*h,x,exact:Math.exp(-i*h)});}return {steps,kind,points,value:x,exact:Math.exp(-1),error:Math.abs(x-Math.exp(-1)),nfe:steps*(kind==='heun'?2:1)};}
export function shortcutIdentity(x,t,d){finite(x,t,d);if(d<=0||t<0||t+2*d>1+1e-12)throw new RangeError('Invalid shortcut');const jump=(state,dt)=>state*Math.exp(-dt),velocity=(state,dt)=>(jump(state,dt)-state)/dt,first=jump(x,d),second=jump(first,d),long=jump(x,2*d);return {first,second,long,shortVelocity:velocity(x,d),nextVelocity:velocity(first,d),longVelocity:velocity(x,2*d)};}
export function shortcutTarget(field,x,t,d){
  finite(x,t,d);
  const level=Math.log2(128*d);
  if(typeof field!=='function'||!Number.isInteger(level)||level<0||level>6)
    throw new RangeError('Dyadic half-step from 1/128 to 1/2 required');
  if(t<0||t+2*d>1)throw new RangeError('Target extends outside [0,1]');
  const query=d===1/128?0:d;
  const first=field(x,t,query);finite(first);
  const mid=x+d*first;finite(mid);
  const second=field(mid,t+d,query);finite(second);
  const target=first/2+second/2;finite(target);
  return {first,mid,second,target,studentStep:2*d};
}
export function progressiveSchedule(start){if(!Number.isInteger(start)||start<1||start>4096||(start&(start-1)))throw new RangeError('Power of two required');const stages=[start];while(stages.at(-1)>1)stages.push(stages.at(-1)/2);return stages;}
