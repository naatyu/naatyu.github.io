// A small causal selector illustration, not a reproduction of the trained indexer.
export const qwenBaseRows = [
 ['MMLU',90.36,87.51,90.43],['MMLU-Redux',90.68,87.26,91.47],
 ['MMLU-Pro',73.23,68.60,70.90],['SuperGPQA',51.36,44.86,48.42],
 ['BBH',90.87,89.56,89.41],['GPQA',51.42,45.01,51.52],
 ['GSM8K',93.29,93.18,92.95],['MATH',72.78,60.54,74.38],
 ['EvalPlus',78.76,76.05,78.06],['MultiPL-E',79.09,74.50,81.68],
 ['SWEBench-Pretrain',50.99,41.66,49.24],['MGSM',89.33,86.37,85.42],
 ['MMMLU',84.86,79.74,84.53],['INCLUDE',78.40,74.37,78.90],
];
export const qwenLongRows = [
 ['RULER ≤128K',99.84,99.89],['RULER 128–256K',99.81,99.62],
 ['RULER 256–512K',97.65,98.95],['RULER 512K–1M',90.08,93.00],
 ['8-needle MRCR 128K',97.14,95.98],['8-needle MRCR 256K',94.20,93.00],
 ['8-needle MRCR 512K',30.66,40.53],['8-needle MRCR 1M',20.71,26.44],
];
export const qwenBatchRows = [
 ['Previous recipe',12.6,3.49e-3,1.5774],
 ['New predicted region',25.2,5.39e-3,1.5702],
 ['1.5× larger batch',37.7,6.92e-3,1.5707],
];
export function qsaToy(position=10,step=0){
 if(!Number.isInteger(position)||position<0||position>11)throw new RangeError('position must be 0…11');
 if(!Number.isInteger(step)||step<0||step>3)throw new RangeError('step must be 0…3');
 const keys=Array.from({length:12},(_,i)=>i<4?[1,0]:i<8?[0,1]:[-1,0]);
 const complete=Math.floor((position+1)/4),blocks=[];
 for(let b=0;b<complete;b++){
  const mean=[0,1].map(j=>keys.slice(b*4,b*4+4).reduce((s,k)=>s+k[j],0)/4);
  const norm=Math.hypot(...mean),key=mean.map(v=>norm?v/norm:0);
  blocks.push({index:b,start:b*4,end:b*4+3,score:Math.max(key[0],0)});
 }
 const selected=[...blocks].sort((a,b)=>b.score-a.score||a.index-b.index).slice(0,1);
 const tail=Array.from({length:(position+1)%4},(_,i)=>complete*4+i);
 const indices=[...selected.flatMap(b=>[b.start,b.start+1,b.start+2,b.start+3]),...tail];
 return {position,step,blocks,selected,tail,indices,keys};
}
