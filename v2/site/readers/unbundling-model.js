// Source: Unbundling Multimodal Vision Encoding, Table 3 (1.7B; 2.6e21 FLOPs).
export const visionAllocations=Object.freeze([
 {id:'early',label:'First eight layers · vision only',placement:'early',users:'vision',vqa:45.0,ocr:36.0,text:50.4},
 {id:'late',label:'Last eight layers · vision only',placement:'late',users:'vision',vqa:35.1,ocr:23.3,text:49.8},
 {id:'spread',label:'Eight spread layers · vision only',placement:'spread',users:'vision',vqa:37.6,ocr:28.1,text:50.0},
 {id:'every',label:'All 28 layers · narrow vision branches',placement:'every',users:'vision',vqa:39.4,ocr:31.3,text:50.7},
 {id:'all-branch',label:'First eight layers · branch for all tokens',placement:'early',users:'all',vqa:42.3,ocr:30.8,text:51.2},
 {id:'shared',label:'First eight layers · widen shared FFNs',placement:'early',users:'all',vqa:40.1,ocr:29.6,text:51.2},
]);
export const visionReferences=Object.freeze([{label:'Scratch encoder',vqa:44.4,ocr:38.2,text:49.7},{label:'Encoder-free',vqa:39.0,ocr:25.2,text:50.7}]);
export const visionMetrics=Object.freeze({vqa:'Avg. VQA',ocr:'OCR / chart',text:'Avg. Text'});
export function allocationState(id='early',metric='vqa'){
 const config=visionAllocations.find(c=>c.id===id);
 if(!config||!Object.hasOwn(visionMetrics,metric))throw new RangeError('Unknown visual capacity configuration');
 // Spread positions follow the publisher's schematic, not an implementation specification.
 const positions=config.placement==='every'?Array.from({length:28},(_,i)=>i):config.placement==='spread'?[0,4,8,12,15,19,23,27]:Array.from({length:8},(_,i)=>i+(config.placement==='late'?20:0));
 const layers=Array.from({length:28},(_,index)=>({index,selected:positions.includes(index),share:positions.includes(index)?1/positions.length:0}));
 return {config,metric,layers,score:config[metric],budget:0.4,activeLayers:positions.length,references:visionReferences.map(r=>({label:r.label,score:r[metric]}))};
}
export function fusionState(modality='vision',stage=0){
 if(!['vision','text'].includes(modality)||!Number.isInteger(stage)||stage<0||stage>4)throw new RangeError('Unknown fusion token or stage');
 const vision=modality==='vision';
 return {modality,stage,vision,shared:true,branch:vision,queryWidth:2048,keyWidth:1024,valueWidth:1024,outputWidth:2048,attentionPasses:1,
  // Assigned scalar example of only the FFN residual addition. No attention is simulated.
  toy:{residual:2,shared:3,vision:vision?5:0,output:vision?10:5}};
}
