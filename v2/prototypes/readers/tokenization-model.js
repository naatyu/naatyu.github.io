// Teaching examples only: ASCII symbols, no regex chunks, no production token IDs.
export function bpeTraining(words,steps=5){
  if(!Array.isArray(words)||!words.length||words.some(w=>typeof w!=='string'||!w.length)||!Number.isInteger(steps)||steps<0)throw new Error('Invalid corpus or steps');
  let corpus=words.map(w=>Array.from(w));const frames=[{corpus:corpus.map(w=>[...w]),pair:null,count:0}];
  for(let n=0;n<steps;n++){
    const counts=new Map();for(const word of corpus)for(let i=0;i<word.length-1;i++){const key=JSON.stringify([word[i],word[i+1]]);counts.set(key,(counts.get(key)||0)+1);}
    if(!counts.size)break;
    const [key,count]=[...counts].sort((a,b)=>b[1]-a[1]||(a[0]<b[0]?-1:a[0]>b[0]?1:0))[0],pair=JSON.parse(key);
    corpus=corpus.map(word=>{const merged=[];for(let i=0;i<word.length;i++){if(i+1<word.length&&word[i]===pair[0]&&word[i+1]===pair[1]){merged.push(word[i]+word[++i]);}else merged.push(word[i]);}return merged;});
    frames.push({corpus:corpus.map(w=>[...w]),pair,count});
  }return frames;
}
export const toyPieces={a:.4,b:.3,ab:.2,ba:.1};
export function segmentationLattice(text,pieces){
  if(typeof text!=='string'||!text.length||!pieces||Object.entries(pieces).some(([s,p])=>!s.length||!Number.isFinite(p)||p<=0))throw new Error('Invalid text or weights');
  const n=text.length,z=Array(n+1).fill(0),best=Array(n+1).fill(-Infinity),paths=Array(n+1).fill(null);z[0]=1;best[0]=0;paths[0]=[];
  for(let t=1;t<=n;t++)for(let s=0;s<t;s++){
    const piece=text.slice(s,t),p=pieces[piece];if(!p)continue;z[t]+=z[s]*p;
    const score=best[s]+Math.log(p);if(score>best[t]){best[t]=score;paths[t]=[...paths[s],piece];}
  }
  if(z[n]===0)throw new Error('Text has no segmentation');
  const alternatives=[];function walk(s,path,weight){if(s===n){alternatives.push({pieces:path,weight,probability:weight/z[n]});return;}for(let t=s+1;t<=n;t++){const piece=text.slice(s,t);if(pieces[piece])walk(t,[...path,piece],weight*pieces[piece]);}}walk(0,[],1);
  return {z,best:paths[n],alternatives};
}
export function selectSegmentation(alternatives,quantile){
  if(!Number.isFinite(quantile)||quantile<0||quantile>1||!alternatives?.length)throw new Error('Invalid quantile');
  let sum=0;for(const item of alternatives){sum+=item.probability;if(quantile<sum)return item;}return alternatives.at(-1);
}
