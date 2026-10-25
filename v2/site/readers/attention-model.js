// Pure numerical examples. All data are synthetic, not benchmark results.
export function softmaxRow(scores, allowed=scores.map(()=>true)) {
  if(!scores.length || scores.length!==allowed.length || scores.some(x=>!Number.isFinite(x))) throw new RangeError('Invalid attention row');
  const valid=scores.filter((_,i)=>allowed[i]);
  if(!valid.length) throw new RangeError('An all-masked row needs an explicit caller policy');
  const max=Math.max(...valid), weights=scores.map((x,i)=>allowed[i]?Math.exp(x-max):0);
  const sum=weights.reduce((a,b)=>a+b,0);
  return weights.map(x=>x/sum);
}
export const exampleDots=[4,1,-1,3];
export const exampleValues=[[1,0],[0,1],[1,1],[-1,0]];
export function attentionExample(temperature=1) {
  if(!Number.isFinite(temperature)||temperature<=0)throw new RangeError('Temperature must be positive');
  const scores=exampleDots.map(x=>x/2/temperature), allowed=[true,true,true,false];
  const weights=softmaxRow(scores,allowed);
  const output=[0,1].map(d=>weights.reduce((s,w,i)=>s+w*exampleValues[i][d],0));
  return {scores,allowed,weights,output};
}
export function cacheElements(tokens,layers,kvHeads,keyDim,valueDim,batch=1) {
  if([tokens,layers,kvHeads,keyDim,valueDim,batch].some(x=>!Number.isInteger(x)||x<=0))throw new RangeError('Expected positive integer dimensions');
  return batch*tokens*layers*kvHeads*(keyDim+valueDim);
}
export function onlineAttention(blocks) {
  let m=-Infinity,l=0,u=null;
  for(const {scores,values} of blocks){
    if(!scores.length)continue;
    if(scores.length!==values.length||scores.some(x=>!Number.isFinite(x))||!values[0]?.length)throw new RangeError('Invalid tile');
    u??=values[0].map(()=>0);
    if(values.some(v=>v.length!==u.length||v.some(x=>!Number.isFinite(x))))throw new RangeError('Invalid values');
    const next=Math.max(m,...scores), a=l?Math.exp(m-next):0;
    const e=scores.map(x=>Math.exp(x-next));
    u=u.map((x,d)=>a*x+e.reduce((s,w,i)=>s+w*values[i][d],0));
    l=a*l+e.reduce((a,b)=>a+b,0);m=next;
  }
  if(!l)throw new RangeError('No visible keys');
  return u.map(x=>x/l);
}

// Already mapped nonnegative features; this is not a softmax approximation.
export function featureStateRead(query,keys,values) {
  const r=query.length,dv=values[0]?.length;
  const nonnegative=a=>Array.isArray(a)&&a.every(x=>Number.isFinite(x)&&x>=0);
  if(!r||!dv||!keys.length||keys.length!==values.length||!nonnegative(query)||keys.some(k=>k.length!==r||!nonnegative(k))||values.some(v=>v.length!==dv||v.some(x=>!Number.isFinite(x))))throw new RangeError('Invalid feature state');
  const state=Array.from({length:r},()=>Array(dv).fill(0)),normalizer=Array(r).fill(0);
  for(let t=0;t<keys.length;t++)for(let a=0;a<r;a++){
    normalizer[a]+=keys[t][a];
    for(let b=0;b<dv;b++)state[a][b]+=keys[t][a]*values[t][b];
  }
  const denominator=query.reduce((s,x,a)=>s+x*normalizer[a],0);
  if(!Number.isFinite(denominator)||denominator<=0||state.flat().some(x=>!Number.isFinite(x)))throw new RangeError('Undefined or overflowing feature read');
  const output=Array.from({length:dv},(_,b)=>query.reduce((s,x,a)=>s+x*state[a][b],0)/denominator);
  if(output.some(x=>!Number.isFinite(x)))throw new RangeError('Overflowing feature read');
  return {state,normalizer,denominator,output};
}
