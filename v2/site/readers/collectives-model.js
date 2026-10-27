// Small exact integer examples. Transfers teach contracts, not a library schedule.
export const patterns=['broadcast','reduce','allreduce','allgather','reducescatter','alltoall','send-receive'];
const clone=x=>JSON.parse(JSON.stringify(x));
const block=(rank,index)=>({label:`${'ABCD'[rank]}${index}`,value:rank*4+index+1,sources:[rank]});
export function collectiveTrace(pattern){
 if(!patterns.includes(pattern))throw new RangeError('Unknown communication pattern');
 const vectors=Array.from({length:4},(_,r)=>Array.from({length:4},(_,j)=>block(r,j)));
 let inputs=clone(vectors),outputs=Array.from({length:4},()=>[]);
 if(['broadcast','send-receive'].includes(pattern)){inputs=inputs.map((v,r)=>r===0?v:[]);outputs[0]=clone(inputs[0]);}
 if(['reduce','allreduce'].includes(pattern))outputs[0]=clone(inputs[0]);
 if(pattern==='allgather'){inputs=vectors.map((v,r)=>[v[r]]);outputs=inputs.map((v,r)=>Array.from({length:4},(_,j)=>j===r?clone(v[0]):null));}
 if(pattern==='reducescatter')outputs=vectors.map((v,r)=>[clone(v[r])]);
 if(pattern==='alltoall')outputs=vectors.map((v,r)=>Array.from({length:4},(_,j)=>j===r?clone(v[r]):null));
 const frames=[{phase:'initial',transfer:null,outputs:clone(outputs)}];
 function transfer(from,to,payload,slots,mode='copy'){
  const event={from,to,payload:clone(payload),slots,mode};
  frames.push({phase:'sending',transfer:clone(event),outputs:clone(outputs)});
  payload.forEach((b,k)=>{const j=slots[k],old=outputs[to][j];outputs[to][j]=mode==='sum'?{label:`Σ${pattern==='reducescatter'?to:j}`,value:old.value+b.value,sources:[...old.sources,...b.sources].sort()}:clone(b);});
  frames.push({phase:'received',transfer:clone(event),outputs:clone(outputs)});
 }
 const full=[0,1,2,3];
 if(pattern==='broadcast')for(let r=1;r<4;r++)transfer(0,r,inputs[0],full);
 if(pattern==='send-receive')transfer(0,1,inputs[0],full);
 if(['reduce','allreduce'].includes(pattern)){
  for(let r=1;r<4;r++)transfer(r,0,inputs[r],full,'sum');
  if(pattern==='allreduce')for(let r=1;r<4;r++)transfer(0,r,outputs[0],full);
 }
 if(pattern==='allgather')for(let from=0;from<4;from++)for(let to=0;to<4;to++)if(from!==to)transfer(from,to,inputs[from],[from]);
 if(pattern==='reducescatter')for(let to=0;to<4;to++)for(let from=0;from<4;from++)if(from!==to)transfer(from,to,[inputs[from][to]],[0],'sum');
 if(pattern==='alltoall')for(let from=0;from<4;from++)for(let to=0;to<4;to++)if(from!==to)transfer(from,to,[inputs[from][to]],[from]);
 frames.push({phase:'complete',transfer:null,outputs:clone(outputs)});
 return {pattern,inputs,frames,result:clone(outputs)};
}
