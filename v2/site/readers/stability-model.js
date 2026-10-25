const finite=n=>{if(!Number.isFinite(n))throw new RangeError('Expected a finite number');return n;};
const vector=g=>{if(!Array.isArray(g)||!g.length)throw new RangeError('Expected a nonempty gradient');g.forEach(finite);return g;};
export function clipGradient(g,tau,kind='norm'){
  vector(g);finite(tau);if(tau<0||!['norm','value'].includes(kind))throw new RangeError('Invalid clipping rule');
  const scale=Math.max(...g.map(Math.abs)),unit=scale?Math.hypot(...g.map(x=>x/scale)):0,norm=scale*unit;
  const clipped=kind==='value'?g.map(x=>Math.max(-tau,Math.min(tau,x))):norm>tau?g.map(x=>tau*((x/scale)/unit)):g.slice();
  return {rawNorm:norm,gradient:clipped,norm:Math.hypot(...clipped),active:kind==='norm'?norm>tau:g.some(x=>Math.abs(x)>tau)};
}
export function firstAdam(g,epsilon=.01){vector(g);finite(epsilon);if(epsilon<=0)throw new RangeError('Positive epsilon required');return g.map(x=>x===0?0:Math.sign(x)/(1+epsilon/Math.abs(x)));}
export function mixtureLoss(codeShare,web=2,code=4){[codeShare,web,code].forEach(finite);if(codeShare<0||codeShare>1)throw new RangeError('Invalid share');return (1-codeShare)*web+codeShare*code;}
export const checkpoints=Object.freeze([{tokens:'2.17T',accuracy:81,state:'Before collapse'},{tokens:'2.19T',accuracy:0,state:'Collapse'},{tokens:'2.21T',accuracy:81.7,state:'Recovery'}].map(Object.freeze));
export const transfer=Object.freeze([{label:'GPQA-Diamond after math SFT',earlier:36.3,later:29.8,detail:'Science reasoning transfer, not the in-domain math score.'},{label:'Robustness to prefilling attacks after general SFT',earlier:53,later:21,detail:'Evaluated attack robustness, not a comprehensive safety score.'}].map(Object.freeze));
export function timeline(kind){
  if(!['fast','slow','nonrecover','gradual','repeat'].includes(kind))throw new RangeError('Unknown timeline');
  return Array.from({length:13},(_,t)=>{const baseline=3-.07*t,pulse=t===5?1.2:0;
    const disturbance=kind==='fast'?pulse:kind==='slow'?(t>=5&&t<=10?1.2*(11-t)/6:0):kind==='nonrecover'?(t>=5?.8+.05*(t-5):0):kind==='gradual'?(t>=5?.13*(t-4):0):(t>=4&&t<=8?-.7:0);
    return {step:t,baseline,loss:baseline+disturbance,phase:kind==='repeat'?(t<4?'Fresh data':t<=8?'Repeated data':'Fresh data resumes'):t<5?'Before event':kind==='gradual'?'Upward drift':'After event'};
  });
}
