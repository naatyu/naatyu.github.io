// Analytical inventory and state models. Not a learned model or latency predictor.
const int=(x,a,b)=>Number.isSafeInteger(x)&&x>=a&&x<=b;
export function embeddingBudget(vocab=166144,width=3072,tied=false,body=3e9){
  if(!int(vocab,1,1e6)||!int(width,1,16384)||typeof tied!=='boolean'||!Number.isFinite(body)||body<=0||body>1e12)throw new RangeError('Embedding budget domain');
  const input=vocab*width,output=tied?0:input,total=body+input+output;
  return {input,output,total,fraction:(input+output)/total,body,tied};
}
export function loopInventory(tokens=32768,passes=2,shared=false,step=0){
  if(!int(tokens,1,262144)||!int(passes,1,4)||typeof shared!=='boolean'||!int(step,0,22*passes))throw new RangeError('Loop inventory domain');
  const layers=22,heads=8,dim=128,bytes=2,copies=shared?1:passes,cache=2*layers*copies*tokens*heads*dim*bytes;
  return {layers,passes,copies,cache,applications:layers*passes,complete:step===layers*passes,round:Math.min(passes,Math.floor(step/layers)+1),block:step===layers*passes?null:step%layers+1,visited:Array.from({length:step},(_,i)=>({round:Math.floor(i/layers)+1,block:i%layers+1}))};
}
export function competencePenalty(length,budget=1000,max=4000,pass=.5,alpha=1,enabled=true){
  if(![length,budget,max,pass,alpha].every(Number.isFinite)||length<0||budget<0||max<=budget||pass<0||pass>1||alpha<0||typeof enabled!=='boolean')throw new RangeError('Penalty domain');
  const excess=Math.max(0,Math.min(1,(length-budget)/(max-budget))),penalty=enabled?alpha*pass*excess:0;return {excess,penalty};
}
export const wsdStages=[['Warmup',.1,'0 → 4.5×10⁻⁴'],['Diversity',12.4,'4.5×10⁻⁴'],['Higher quality',6.5,'4.5×10⁻⁴'],['Decay',4,'4.5×10⁻⁴ → 1.5×10⁻⁶']];
export const agentCurriculum=[{context:65536,reasoning:82.7,general:11.6,agent:5.7},{context:131072,reasoning:47.8,general:22.7,agent:29.5},{context:262144,reasoning:22.4,general:8.7,agent:68.9}];
export const behaviorResults=[['SFT',65.45,6.49,25905],['Think RLHF',68.51,.95,16781],['Non-Think RLHF',72.10,0,15182]];
export const gemmaMemory=[['E2B',4.6,.8,.05,'mobile'],['E4B',9,2.3,.14,'mobile'],['12B',24,7.65,.28,'Q4_0'],['26B-A4B total',52,16.2,.28,'Q4_0'],['31B',64,19.2,1.10,'Q4_0']];
export function globalCacheRatio(p=.25){if(!Number.isFinite(p)||p<0||p>1)throw new RangeError('Rotary fraction');return {baseline:2,shared:1+p,ratio:(1+p)/2,saved:(1-p)/2};}
