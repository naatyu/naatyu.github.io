export function samplingDistribution(logits,{temperature=1,topK=0,topP=1,banned=[]}={}){
 if(!Array.isArray(logits)||!logits.length||logits.some(x=>!Number.isFinite(x))||!Number.isFinite(temperature)||temperature<0||!Number.isInteger(topK)||topK<0||topK>logits.length||!Number.isFinite(topP)||topP<=0||topP>1||banned.some(i=>!Number.isInteger(i)||i<0||i>=logits.length))throw new RangeError('Invalid sampling configuration');
 const order=logits.map((z,i)=>({z,i})).filter(x=>!banned.includes(x.i)).sort((a,b)=>b.z-a.z||a.i-b.i);if(!order.length)throw new RangeError('No eligible token');
 if(temperature===0)return logits.map((_,i)=>i===order[0].i?1:0);
 const max=order[0].z;let probabilities=logits.map((z,i)=>banned.includes(i)?0:Math.exp((z-max)/temperature));let total=probabilities.reduce((s,v)=>s+v,0);probabilities=probabilities.map(v=>v/total);
 const kept=topK?order.slice(0,topK):order;total=kept.reduce((s,{i})=>s+probabilities[i],0);probabilities=probabilities.map((v,i)=>kept.some(x=>x.i===i)?v/total:0);
 let cumulative=0;const nucleus=[];for(const {i} of kept){nucleus.push(i);cumulative+=probabilities[i];if(cumulative>=topP)break;}
 total=nucleus.reduce((s,i)=>s+probabilities[i],0);return probabilities.map((v,i)=>nucleus.includes(i)?v/total:0);
}
export function guidedLogits(final,reference,strength){if(!Array.isArray(final)||!Array.isArray(reference)||!final.length||final.length!==reference.length||[...final,...reference,strength].some(x=>!Number.isFinite(x))||strength<0)throw new RangeError('Invalid guidance state');return final.map((v,i)=>v+strength*(v-reference[i]));}
