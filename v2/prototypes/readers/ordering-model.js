// Comparators return negative/zero/positive. These models copy caller arrays.
export class BinaryHeap{
  constructor(compare=(a,b)=>a-b){this.values=[];this.compare=compare;}
  push(value){const a=this.values;a.push(value);let i=a.length-1;while(i>0){const p=Math.floor((i-1)/2);if(this.compare(a[p],a[i])<=0)break;[a[p],a[i]]=[a[i],a[p]];i=p;}}
  pop(){const a=this.values;if(!a.length)throw new Error('Empty heap');const result=a[0],last=a.pop();if(a.length){a[0]=last;let i=0;while(2*i+1<a.length){let c=2*i+1;if(c+1<a.length&&this.compare(a[c+1],a[c])<0)c++;if(this.compare(a[i],a[c])<=0)break;[a[i],a[c]]=[a[c],a[i]];i=c;}}return result;}
  peek(){return this.values[0];}
  get size(){return this.values.length;}
}
const valid=input=>{if(!Array.isArray(input)||input.some(x=>!Number.isFinite(x)))throw new Error('Finite numeric input required');};
export function topKTrace(input,k){
  valid(input);if(!Number.isInteger(k)||k<0||k>input.length)throw new Error('k must be in 0..input length');const heap=new BinaryHeap(),frames=[];
  const save=(index,removed,message)=>frames.push({index,removed,message,input:[...input],heap:[...heap.values],processed:index===null?0:index+1});
  save(null,null,'No input processed. Keep at most k values; the root is the smallest retained candidate.');
  for(let i=0;i<input.length;i++){heap.push(input[i]);const removed=heap.size>k?heap.pop():null;save(i,removed,removed===null?'Retain the new candidate; capacity has not been exceeded.':`Discard ${removed}, the smallest after adding this value.`);}return frames;
}
export function threeWaySelectTrace(input,k){
  valid(input);if(!Number.isInteger(k)||k<0||k>=input.length)throw new Error('Zero-based rank must be in 0..n-1');
  const values=[...input],frames=[];let lo=0,hi=values.length-1;
  const save=(event,pivot,lt,i,gt,message,answer=null)=>frames.push({event,pivot,lo,hi,lt,i,gt,k,values:[...values],message,answer});
  save('initial',null,lo,lo,hi,'Keep the interval that contains the requested rank. No pivot chosen yet.');
  while(lo<=hi){const pivot=values[lo];let lt=lo,i=lo,gt=hi;save('pivot',pivot,lt,i,gt,'Use the first active value as a deterministic teaching pivot.');
    while(i<=gt){if(values[i]<pivot){[values[lt],values[i]]=[values[i],values[lt]];lt++;i++;save('less',pivot,lt,i,gt,'Move a smaller value into the less-than region; advance both boundaries.');}
      else if(values[i]>pivot){[values[i],values[gt]]=[values[gt],values[i]];gt--;save('greater',pivot,lt,i,gt,'Move a larger value to the right; inspect the value swapped into i next.');}
      else{i++;save('equal',pivot,lt,i,gt,'Extend the equal region by one; do not create another recursive branch for this value.');}}
    if(k<lt){save('left',pivot,lt,i,gt,'Target lies left of the equal block; discard the block and larger side.');hi=lt-1;}
    else if(k>gt){save('right',pivot,lt,i,gt,'Target lies right of the equal block; discard the smaller side and block.');lo=gt+1;}
    else{save('answer',pivot,lt,i,gt,'Target rank lies inside the equal block; its value is the pivot.',pivot);break;}
  }return frames;
}
export function mergeStreamsTrace(streams){
  if(!Array.isArray(streams))throw new Error('Array of sorted streams required');for(const s of streams){valid(s);if(s.some((x,i)=>i>0&&s[i-1]>x))throw new Error('Each stream must be sorted');}
  const heap=new BinaryHeap((a,b)=>a.value-b.value||a.source-b.source||a.index-b.index),output=[],positions=streams.map(()=>0),frames=[];
  streams.forEach((s,source)=>{if(s.length)heap.push({value:s[0],source,index:0});});
  const save=(picked,message)=>frames.push({picked:picked?{...picked}:null,message,streams:streams.map(s=>[...s]),positions:[...positions],output:[...output],heap:heap.values.map(x=>({...x}))});
  save(null,'One current head from each nonempty source enters the frontier.');
  while(heap.size){const item=heap.pop();output.push(item.value);positions[item.source]++;const next=item.index+1;if(next<streams[item.source].length)heap.push({value:streams[item.source][next],source:item.source,index:next});save(item,`Emit ${item.value} from source ${item.source}; advance only that source.`);}return frames;
}
export function medianTrace(input){
  valid(input);const lower=new BinaryHeap((a,b)=>b-a),upper=new BinaryHeap(),frames=[];let count=0;
  const median=()=>count===0?null:lower.size>upper.size?lower.peek():lower.peek()/2+upper.peek()/2;
  const save=(stage,index,message)=>frames.push({stage,index,message,input:[...input],lower:[...lower.values],upper:[...upper.values],count,median:stage==='balanced'?median():null});
  save('balanced',null,'Empty stream: no median.');
  for(let i=0;i<input.length;i++){const x=input[i];count++;if(!lower.size||x<=lower.peek())lower.push(x);else upper.push(x);save('insert',i,`Insert ${x} on its ordered side; sizes may need correction before querying.`);
    if(lower.size>upper.size+1){const moved=lower.pop();upper.push(moved);save('move',i,`Move lower maximum ${moved} to upper.`);}else if(upper.size>lower.size){const moved=upper.pop();lower.push(moved);save('move',i,`Move upper minimum ${moved} to lower.`);}
    save('balanced',i,'Order and size invariants now hold; read the median from the roots.');}return frames;
}
