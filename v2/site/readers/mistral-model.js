// ML4 report §3 / Figure 3, restricted to the illustrated layer excerpts.
// These are real layer identities, not a complete model configuration.
export const mistralLayers=Object.freeze([0,1,2,3,4,5,6,7,32,33,34,35,36,37,38,39,40,41,42,43]);
export const mistralStages=Object.freeze(['Initial compressed checkpoint','Attention surgery','Dense indexer warm-up','Joint sparse adaptation']);
export function mistralLayer(layer,stage=0){
 if(!mistralLayers.includes(layer)||!Number.isInteger(stage)||stage<0||stage>3)throw new RangeError('Invalid ML4 layer or stage');
 const originallyLocal=layer%4!==3;
 const owner=stage===0?(originallyLocal?layer:layer===7?3:layer===39||layer===43?35:layer):(layer===39||layer===43?35:layer);
 const indexOwner=stage===3&&originallyLocal&&layer>=16?layer-layer%4:stage===3?layer:null;
 return {layer,stage,originallyLocal,owner,shared:owner!==layer,window:stage===0&&originallyLocal?512:null,position:originallyLocal?(stage===0?'RoPE':'LeRoPE + SSMax'):'NoPE',indexOwner,sparse:stage===3,backboneFrozen:stage===2};
}
export function lengthBonuses(lengths,correct,lambda=0.4){
 if(!Array.isArray(lengths)||!lengths.length||!Array.isArray(correct)||correct.length!==lengths.length||lengths.some(x=>!Number.isSafeInteger(x)||x<1)||correct.some(x=>typeof x!=='boolean')||!Number.isFinite(lambda)||lambda<0||lambda>1)throw new RangeError('Invalid length-bonus inputs');
 const accepted=lengths.filter((_,i)=>correct[i]);
 if(!accepted.length)return {minimum:null,width:null,maximum:null,bins:lengths.map(()=>null),bonus:lengths.map(()=>0)};
 const minimum=Math.min(...accepted),width=minimum/10;
 // Integer arithmetic avoids round-off at exact 10%-bin boundaries.
 const bins=lengths.map(x=>Number((10n*(BigInt(x)-BigInt(minimum))-(x<minimum?BigInt(minimum)-1n:0n))/BigInt(minimum)));
 const last=Math.max(...bins.filter((_,i)=>correct[i]));
 const bonus=bins.map((b,i)=>correct[i]&&last>0?lambda*((last-b)/last):0);
 return {minimum,width,maximum:minimum+width*last,bins,bonus};
}
export const lengthCases=Object.freeze({mixed:{label:'Mixed outcomes',lengths:[100,109,110,150,60],correct:[true,true,true,true,false]},tied:{label:'Successful answers in one bin',lengths:[100,104,109,60],correct:[true,true,true,false]},failed:{label:'No successful answers',lengths:[80,120,200],correct:[false,false,false]}});
export function rolloutHistory(step=0){
 if(!Number.isInteger(step)||step<0||step>4)throw new RangeError('Invalid rollout step');
 // Synthetic token counts, update times and versions. No simulated neural values.
 const segments=[{version:0,count:3},{version:1,count:2},{version:2,count:2}];
 const completed=step===0?0:step<=2?1:step===3?2:3;
 return {step,version:step<2?0:step<4?1:2,segments:segments.slice(0,completed),pendingUpdate:step===2,cache:segments.slice(0,completed).flatMap(s=>Array.from({length:s.count},()=>s.version))};
}
export function mistralGroupWeights(groups){
 if(!Array.isArray(groups)||!groups.length||groups.some(g=>!Number.isSafeInteger(g.rollouts)||g.rollouts<1||!Number.isSafeInteger(g.tokens)||g.tokens<g.rollouts))throw new RangeError('Invalid groups');
 return groups.map(g=>({perToken:g.rollouts/g.tokens,total:g.rollouts}));
}
