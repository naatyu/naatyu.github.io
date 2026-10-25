// Exact operation states, not video frames or speed measurements.
export function crossingPartitionTrace(input){
  if(!Array.isArray(input)||input.some(v=>!Number.isFinite(v)))throw new TypeError('Finite numeric array required');
  const values=[...input],frames=[],last=values.length-1;
  let pivot=null,pivotIndex=null,i=1,j=last,rank=null;
  const candidates=values.length?[0,Math.floor(last/2),last]:[];
  const save=(stage,message)=>frames.push({values:[...values],pivot,pivotIndex,i,j,rank,candidates:[...candidates],stage,message});
  save('initial','Choose the median of the first, middle and last candidate values, not the full-array median.');
  if(!values.length){save('done','Empty input needs no partition; there is no pivot rank.');return frames;}
  pivotIndex=[...candidates].sort((a,b)=>values[a]-values[b]||a-b)[1];pivot=values[pivotIndex];
  save('choose',`The three-candidate median is ${pivot}.`);
  [values[0],values[pivotIndex]]=[values[pivotIndex],values[0]];pivotIndex=0;
  save('pivot','Keep the pivot at index 0 while both scans examine the remaining values.');
  while(i<=j){
    while(i<=j&&values[i]<pivot){save('left',`Left scan passes ${values[i]} at index ${i}: it is smaller than the pivot.`);i++;}
    save('left-stop',i<=j?`Left scan stops at ${values[i]} at index ${i}.`:'The scans have crossed; no left candidate remains.');
    while(i<=j&&values[j]>pivot){save('right',`Right scan passes ${values[j]} at index ${j}: it is larger than the pivot.`);j--;}
    save('right-stop',i<=j?`Right scan stops at ${values[j]} at index ${j}.`:'The scans have crossed; no right candidate remains.');
    if(i>j)break;
    [values[i],values[j]]=[values[j],values[i]];
    save('swap',`Swap indices ${i} and ${j}. Equal values also advance both scans, so ties cannot stall.`);
    i++;j--;
  }
  save('crossed',`The scans crossed: i=${i}, j=${j}. Place the pivot at j.`);
  [values[0],values[j]]=[values[j],values[0]];pivotIndex=j;rank=j;
  save('done',`Pivot ${pivot} has a valid final rank ${j}. Sort the two sides separately; they are not necessarily ordered yet.`);
  return frames;
}
export function mergeSortTrace(input){
  if(!Array.isArray(input)||input.some(v=>!Number.isFinite(v)))throw new TypeError('Finite numeric array required');
  let runs=input.length?[input.map((value,id)=>({value,id}))]:[],output=[],pair=null,level=0;
  const frames=[],copy=records=>records.map(r=>({...r}));
  const save=(stage,message)=>frames.push({stage,message,level,pair,runs:runs.map(copy),output:copy(output)});
  save('initial','Start with one unsorted range.');
  while(runs.some(run=>run.length>1)){
    runs=runs.flatMap(run=>{if(run.length<=1)return[run];const mid=Math.floor(run.length/2);return[run.slice(0,mid),run.slice(mid)];});level++;
    save('split','Split each remaining nonsingleton range; zero or one value needs no sorting.');
  }
  while(runs.length>1){
    for(let i=0;i+1<runs.length;i++){
      pair=i;output=[];
      save('begin','Merge these adjacent sorted runs into a separate output.');
      while(runs[i].length||runs[i+1].length){
        const left=runs[i][0],right=runs[i+1][0];
        if(left&&right)save('compare',`Compare heads ${left.value} and ${right.value}. Choose left on equal keys.`);
        const side=!right||(left&&left.value<=right.value)?i:i+1,record=runs[side].shift();output.push(record);
        save('emit',`Move ${record.value} from ${side===i?'left':'right'} to output. A missing head means that side is exhausted.`);
      }
      runs.splice(i,2,output);output=[];pair=null;
      save('merged','Replace both exhausted inputs with their sorted output.');
    }
    level++;
    save('round','This merge round is complete. An unpaired final run carries forward unchanged.');
  }
  save('done','One sorted run remains; equal keys keep their original occurrence order.');
  return frames;
}
export function insertionTrace(input){
  if(!Array.isArray(input)||input.some(v=>!Number.isFinite(v)))throw new Error('Finite numeric array required');
  const records=input.map((value,id)=>({value,id})),frames=[];
  let held=null,gap=null,sortedLength=Math.min(1,input.length);
  const save=(stage,compare,message)=>frames.push({stage,compare,message,sortedLength,gap,held:held?{...held}:null,records:records.map(r=>r?{...r}:null),values:records.map(r=>r?.value??null)});
  save('initial',null,'A prefix of zero or one value is already sorted.');
  for(let i=1;i<records.length;i++){
    held=records[i];records[i]=null;gap=i;
    save('hold',null,`Hold ${held.value} from index ${held.id}; its slot is now a gap.`);
    while(gap>0){
      const previous=records[gap-1];
      save('compare',gap-1,`Compare held ${held.value} with preceding ${previous.value}.`);
      if(previous.value<=held.value)break;
      records[gap]=previous;records[gap-1]=null;gap--;
      save('shift',null,`Move ${previous.value} right; the gap moves left. The held value stays separate.`);
    }
    const value=held.value,at=gap;
    records[gap]=held;held=null;gap=null;sortedLength=i+1;
    save('place',null,`Place ${value} at index ${at}. The first ${sortedLength} values are sorted.`);
  }
  save('done',null,'All values are placed. Equal values keep their original relative order.');
  return frames;
}
