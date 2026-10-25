// Bounded exact teaching calculations, not a trained model or tuning oracle.
const finite=Number.isFinite;
// Array.every skips holes; materialize them before validating a teaching input.
const finiteVector=xs=>Array.isArray(xs)&&xs.length>0&&Array.from(xs).every(finite);
const probability=x=>finite(x)&&x>=0&&x<1;
export const gradientSequence=[1,1,1,1,1,-1,-1,-1,-1,2,0,0];
export function ema(sequence,beta){if(!probability(beta)||!finiteVector(sequence))throw new RangeError('EMA domain');let m=0;return [{step:0,input:null,raw:0,corrected:null},...sequence.map((g,i)=>{m=beta*m+(1-beta)*g;return {step:i+1,input:g,raw:m,corrected:m/(1-beta**(i+1))};})];}
export function emaInterpretation(frame,beta){
  if(frame.step===0)return 'No update direction exists before the first gradient.';
  if(beta===0)return 'No memory: the raw buffer equals the current gradient.';
  if(frame.input===0)return frame.raw===0?'The current gradient and buffer are both zero.':'The current gradient is zero. The buffer retains an earlier direction.';
  if(frame.raw===0)return 'Past and current contributions cancel in the raw buffer.';
  if(Math.sign(frame.raw)!==Math.sign(frame.input))return 'The buffer still points opposite to the current gradient. Earlier gradients delay its reversal.';
  return 'The buffer points in the current gradient direction. Earlier gradients still affect its magnitude.';
}
export function adamStep(theta,g,m,v,t,{lr=.01,beta1=.9,beta2=.95,eps=1e-8,decay=.1}={}){if(![theta,g,m,v,t,lr,eps,decay].every(finite)||v<0||!Number.isInteger(t)||t<1||lr<0||eps<=0||decay<0||!probability(beta1)||!probability(beta2))throw new RangeError('Adam domain');const nextM=beta1*m+(1-beta1)*g,nextV=beta2*v+(1-beta2)*g*g,mhat=nextM/(1-beta1**t),vhat=nextV/(1-beta2**t),adaptive=lr*mhat/(Math.sqrt(vhat)+eps),shrink=lr*decay*theta;return {theta:theta-adaptive-shrink,m:nextM,v:nextV,mhat,vhat,adaptive,shrink};}
export function noiseModel(batch,mode='constant',base=.1){if(!Number.isInteger(batch)||batch<1||batch>256||!['constant','sqrt','linear'].includes(mode)||!finite(base)||base<=0)throw new RangeError('Noise domain');const mean=1,variance=16,lr=base*(mode==='sqrt'?Math.sqrt(batch):mode==='linear'?batch:1),gradientVariance=variance/batch,updateVariance=lr**2*gradientVariance,snr=mean**2/gradientVariance,steps=256/batch;return {batch,lr,gradientVariance,updateVariance,snr,updateMean:-lr*mean,updateSD:Math.sqrt(updateVariance),steps,dataDrift:-steps*lr*mean,dataVariance:steps*updateVariance};}
export const nsCoefficients={taylor:[15/8,-5/4,3/8],fast:[3.4445,-4.7750,2.0315]};
// Normalize at unit scale so finite huge/tiny singular values keep their direction.
export function nsFrames(values,variant='taylor',steps=8){if(!finiteVector(values)||values.some(s=>s<0)||!Object.hasOwn(nsCoefficients,variant)||!Number.isInteger(steps)||steps<0||steps>20)throw new RangeError('NS domain');const largest=Math.max(...values),scaled=values.map(x=>largest?x/largest:0),norm=Math.hypot(...scaled);let s=scaled.map(x=>norm?x/norm:0);const [a,b,c]=nsCoefficients[variant],frames=[{step:0,values:[...s]}];for(let i=1;i<=steps;i++){s=s.map(x=>a*x+b*x**3+c*x**5);frames.push({step:i,values:[...s]});}return frames;}
export function signRms(rows,cols,rank=Math.min(rows,cols)){if(![rows,cols,rank].every(Number.isInteger)||rows<1||cols<1||rank<0||rank>Math.min(rows,cols))throw new RangeError('Matrix shape');return Math.sqrt(rank/(rows*cols));}
// The reported norm may exceed Number.MAX_VALUE; clipped components must not
// collapse merely because the intermediate norm or scale is unrepresentable.
export function normClip(g,threshold){if(!finiteVector(g)||!finite(threshold)||threshold<0)throw new RangeError('Clip domain');const largest=Math.max(...g.map(Math.abs));if(!largest)return {norm:0,scale:1,values:[...g]};const scaled=g.map(x=>x/largest),unitNorm=Math.hypot(...scaled),scale=Math.min(1,(threshold/largest)/unitNorm);return {norm:largest*unitNorm,scale,values:scale===1?[...g]:scaled.map(x=>x*(threshold/unitNorm))};}
export function schedule(t,{warmup=5,start=80,min=.1,kind='wsd'}={}){if(!finite(t)||t<0||t>100||!finite(warmup)||warmup<0||warmup>=100||!finite(start)||start<warmup||start>=100||!finite(min)||min<0||min>1||!['wsd','cosine'].includes(kind))throw new RangeError('Schedule domain');if(warmup&&t<warmup)return t/warmup;if(kind==='wsd')return t<=start?1:1-(1-min)*(t-start)/(100-start);return min+(1-min)*(1+Math.cos(Math.PI*(t-warmup)/(100-warmup)))/2;}
export function decayHistory(rates,lambda){if(!finiteVector(rates)||rates.some(x=>x<0)||!finite(lambda)||lambda<0||rates.some(x=>x*lambda>=1))throw new RangeError('Decay domain');return rates.reduce((s,lr)=>s*(1-lr*lambda),1);}
