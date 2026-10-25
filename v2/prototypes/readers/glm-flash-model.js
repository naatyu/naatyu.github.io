// One-head conceptual reference. q and k have already passed Q/K normalization.
export function kdaStep(state,key,value,decay,beta,query){
 const d=key.length,v=value.length;
 if(!d||!v||state.length!==d||state.some(row=>row.length!==v)||decay.length!==d||query.length!==d)throw new RangeError('KDA dimensions');
 if(![...state.flat(),...key,...value,...decay,beta,...query].every(Number.isFinite)||decay.some(x=>x<0||x>1)||beta<0||beta>1)throw new RangeError('KDA domain');
 const forgotten=state.map((row,i)=>row.map(x=>x*decay[i]));
 const prediction=value.map((_,j)=>key.reduce((sum,k,i)=>sum+k*forgotten[i][j],0));
 const residual=value.map((x,j)=>x-prediction[j]);
 const updated=forgotten.map((row,i)=>row.map((x,j)=>x+beta*key[i]*residual[j]));
 const output=value.map((_,j)=>query.reduce((sum,q,i)=>sum+q*updated[i][j],0)/Math.sqrt(d));
 return {forgotten,prediction,residual,updated,output};
}
export const kdaDemo={state:[[2,1],[0,3]],key:[1,0],value:[5,4],decay:[.5,.25],beta:.5,query:[1,0]};
export const kdaDemoStep=()=>kdaStep(kdaDemo.state,kdaDemo.key,kdaDemo.value,kdaDemo.decay,kdaDemo.beta,kdaDemo.query);

// A single complete four-token pool, with one softmax for each feature.
export function poolKey(keys,logits){
 const d=keys[0]?.length;
 if(keys.length!==4||logits.length!==4||!d||keys.some(x=>x.length!==d)||logits.some(x=>x.length!==d)||![...keys.flat(),...logits.flat()].every(Number.isFinite))throw new RangeError('Pool dimensions/domain');
 const weights=Array.from({length:4},()=>Array(d));
 const pooled=Array.from({length:d},(_,c)=>{const max=Math.max(...logits.map(x=>x[c])),mass=logits.map(x=>Math.exp(x[c]-max)),sum=mass.reduce((a,b)=>a+b,0);return keys.reduce((s,k,r)=>{weights[r][c]=mass[r]/sum;return s+weights[r][c]*k[c];},0);});
 return {weights,pooled};
}
// Contiguous, unpadded prefix only. Stable ties are a demo choice, not a kernel promise.
export function poolPositions(visible,scores,budget=2048){
 if(!Number.isInteger(visible)||visible<0||!Number.isInteger(budget)||budget<0||budget%4||scores.length<Math.floor(visible/4)||!scores.every(Number.isFinite))throw new RangeError('Pool selection domain');
 const complete=Math.floor(visible/4),selected=Array.from({length:complete},(_,i)=>i).sort((a,b)=>scores[b]-scores[a]||a-b).slice(0,budget/4);
 const raw=selected.flatMap(i=>[4*i,4*i+1,4*i+2,4*i+3]),tail=Array.from({length:visible%4},(_,i)=>complete*4+i);
 return {complete,selected,raw,tail,positions:[...raw,...tail]};
}
