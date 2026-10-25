export const detectionBoxes=[
 {id:'A',box:[20,25,120,125],score:.95,label:'person'},
 {id:'B',box:[30,30,130,130],score:.9,label:'person'},
 {id:'C',box:[65,25,165,125],score:.85,label:'person'},
 {id:'D',box:[180,45,245,110],score:.8,label:'person'},
 {id:'E',box:[22,27,122,127],score:.75,label:'bag'}
];
function validateBox(b){if(!Array.isArray(b)||b.length!==4||b.some(x=>!Number.isFinite(x))||b[2]<=b[0]||b[3]<=b[1])throw new RangeError('Expected positive-area xyxy box');}
export function overlap(a,b){
 validateBox(a);validateBox(b);
 const width=Math.max(0,Math.min(a[2],b[2])-Math.max(a[0],b[0])),height=Math.max(0,Math.min(a[3],b[3])-Math.max(a[1],b[1]));
 const intersection=width*height,areaA=(a[2]-a[0])*(a[3]-a[1]),areaB=(b[2]-b[0])*(b[3]-b[1]),union=areaA+areaB-intersection;
 const dx=(a[0]+a[2]-b[0]-b[2])/2,dy=(a[1]+a[3]-b[1]-b[3])/2,c2=(Math.max(a[2],b[2])-Math.min(a[0],b[0]))**2+(Math.max(a[3],b[3])-Math.min(a[1],b[1]))**2;
 // This bounded teaching model rejects unrepresentable intermediates; it is not an arbitrary-precision geometry kernel.
 const distance2=dx*dx+dy*dy;
 if(![intersection,areaA,areaB,union,c2,distance2].every(Number.isFinite)||areaA<=0||areaB<=0||union<=0||c2<=0||(width>0&&height>0&&intersection===0)||((dx!==0||dy!==0)&&distance2===0))throw new RangeError('Box geometry exceeds the floating-point range of this demo');
 const iou=intersection/union,centerPenalty=distance2/c2;
 if((intersection>0&&iou===0)||(distance2>0&&centerPenalty===0))throw new RangeError('Box geometry exceeds the floating-point range of this demo');
 return {intersection,union,iou,centerPenalty,diou:iou-centerPenalty};
}
export function suppressionTrace(boxes=detectionBoxes,{method='hard',threshold=.5,sigma=.5,scoreFloor=.1,classAware=true}={}){
 if(!['hard','linear','gaussian','diou'].includes(method)||!Number.isFinite(threshold)||threshold<0||threshold>1||!Number.isFinite(sigma)||sigma<=0||!Number.isFinite(scoreFloor)||scoreFloor<0||scoreFloor>1||typeof classAware!=='boolean')throw new RangeError('Invalid suppression policy');
 const ids=new Set();for(const b of boxes){validateBox(b.box);if(!Number.isFinite(b.score)||b.score<0||b.score>1||typeof b.id!=='string'||ids.has(b.id)||typeof b.label!=='string')throw new RangeError('Invalid detection');ids.add(b.id);}
 let remaining=boxes.map((b,index)=>({...b,box:[...b.box],index})).filter(b=>b.score>=scoreFloor),kept=[],removed=[];
 const snapshots=[{round:0,selected:null,kept:[],remaining:remaining.map(b=>({...b})),removed:boxes.filter(b=>b.score<scoreFloor).map(b=>({...b,reason:'initial score floor'})),comparisons:[]}];removed=[...snapshots[0].removed];
 while(remaining.length){remaining.sort((a,b)=>b.score-a.score||a.index-b.index);const selected=remaining.shift();kept.push({...selected});const next=[],comparisons=[];
  for(const b of remaining){const geometry=overlap(selected.box,b.box),comparable=!classAware||selected.label===b.label;let score=b.score,reason=null;
   if(comparable){if(method==='hard'&&geometry.iou>threshold)reason='IoU > threshold';if(method==='diou'&&geometry.diou>=threshold)reason='DIoU ≥ threshold';if(method==='linear'&&geometry.iou>=threshold)score*=1-geometry.iou;if(method==='gaussian')score*=Math.exp(-(geometry.iou**2)/sigma);}
   if(!reason&&score<scoreFloor)reason='updated score below floor';const updated={...b,score};comparisons.push({id:b.id,comparable,...geometry,before:b.score,after:score,removed:reason!==null,reason});if(reason)removed.push({...updated,reason});else next.push(updated);
  }
  remaining=next;snapshots.push({round:snapshots.length,selected:{...selected},kept:kept.map(b=>({...b})),remaining:remaining.map(b=>({...b})),removed:removed.map(b=>({...b})),comparisons});
 }
 return snapshots;
}
// A coordinate average for an already assigned cluster, not the complete WBF algorithm.
export function fuseAssignedCluster(boxes){if(!Array.isArray(boxes)||!boxes.length)throw new RangeError('Empty cluster');let total=0;for(const b of boxes){validateBox(b.box);if(!Number.isFinite(b.score)||b.score<0)throw new RangeError('Invalid weight');total+=b.score;}if(total===0)throw new RangeError('Zero cluster mass');return [0,1,2,3].map(k=>boxes.reduce((s,b)=>s+b.score*b.box[k],0)/total);}
