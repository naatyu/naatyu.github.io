// Controlled scalar rounding model, not a GPU/framework kernel emulator.
export const precisionFormats={bf16:{label:'BF16',bits:7},fp32:{label:'FP32',bits:23},fp64:{label:'FP64',bits:52}};
const buffer=new ArrayBuffer(4),view=new DataView(buffer);
export function roundPrecision(value,format){
  if(!precisionFormats[format]||!Number.isFinite(value))throw new RangeError('Finite value and known precision required');
  if(format==='fp64')return value;
  if(format==='fp32')return Math.fround(value);
  view.setFloat32(0,value,false);
  const bits=view.getUint32(0,false);
  // Round FP32 to BF16, nearest/ties-to-even; the scene uses normal values.
  view.setUint32(0,((bits+0x7fff+((bits>>>16)&1))&0xffff0000)>>>0,false);
  return view.getFloat32(0,false);
}
export function precisionCliffFrame(margin=18,format='fp32'){
  if(!Number.isFinite(margin)||margin<0||margin>48||!precisionFormats[format])throw new RangeError('Margin must lie in [0,48]');
  const cast=x=>roundPrecision(x,format),r=cast(Math.exp(-margin)),denominator=cast(1+r);
  const targetProbability=cast(1/denominator),other=cast(cast(r/2)/denominator);
  const standardTarget=cast(targetProbability-1),fixedTarget=-cast(r/denominator);
  const standard=[standardTarget,other,other],fixed=[fixedTarget,other,other];
  return {margin,format,r,denominator,targetProbability,standard,fixed,
    standardLoss:cast(Math.log(denominator)),fixedLoss:cast(Math.log1p(Math.exp(-margin))),
    standardSum:standard.reduce((a,b)=>a+b,0),fixedSum:fixed.reduce((a,b)=>a+b,0),
    cliff:(precisionFormats[format].bits+1)*Math.LN2};
}
function probabilities(logits){const maximum=Math.max(...logits),weights=logits.map(x=>Math.exp(x-maximum)),sum=weights.reduce((a,b)=>a+b,0);return weights.map(x=>x/sum);}
export function nearMatchGradient(student,teacher){
  if(!Array.isArray(student)||!Array.isArray(teacher)||student.length<2||student.length!==teacher.length||[...student,...teacher].some(x=>!Number.isFinite(x)))throw new RangeError('Matching finite logit vectors required');
  const target=probabilities(teacher),prediction=probabilities(student),delta=student.map((x,i)=>x-teacher[i]);
  if(target.some(x=>x===0)||delta.some(x=>Math.abs(x)>1))throw new RangeError('Teaching model requires positive support and nearby logits');
  const mean=target.reduce((sum,p,i)=>sum+p*delta[i],0),centered=delta.map(x=>x-mean);
  const logNormalizer=Math.log1p(target.reduce((sum,p,i)=>sum+p*Math.expm1(centered[i]),0));
  const difference=target.map((p,i)=>p*Math.expm1(centered[i]-logNormalizer)),drift=difference.reduce((a,b)=>a+b,0);
  return {target,prediction,gradient:difference.map((x,i)=>x-prediction[i]*drift)};
}
