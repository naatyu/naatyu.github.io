const finite=x=>Number.isFinite(x);
const int=(x,a,b)=>Number.isSafeInteger(x)&&x>=a&&x<=b;
// Each item is one illustrative atomic token, not a real model tokenizer.
export const dialog=[
 ['system','header','S',.8],['system','body','Be concise',.7],['system','end','/S',.9],
 ['user','header','U',.8],['user','body','2 + 2?',.4],['user','end','/U',.9],
 ['assistant','header','A',.8],['assistant','body','4',.6],['assistant','end','/A',.75],
 ['user','header','U',.8],['user','body','Explain',.3],['user','end','/U',.9],
 ['assistant','header','A',.8],['assistant','body','Two pairs',.5],['assistant','body','make four',.4],['assistant','end','/A',.75],
 ['pad','pad','PAD',1],['pad','pad','PAD',1]
].map(([role,kind,text,p],i)=>({role,kind,text,p,i}));
export function targetStream(policy='assistant',boundaries='end',cursor=0){
 if(!['assistant','final','all'].includes(policy)||!['none','end','both'].includes(boundaries)||!int(cursor,0,dialog.length-1))throw new RangeError('Target stream domain');
 const rows=dialog.map(t=>{const selected=t.i>0&&t.role!=='pad'&&(policy==='all'||t.role==='assistant'&&(policy!=='final'||t.i>=12))&&(t.kind==='body'||boundaries==='both'||boundaries==='end'&&t.kind==='end');return {...t,selected,predictor:t.i? t.i-1:null,nll:-Math.log(t.p)};});
 const targets=rows.filter(t=>t.selected),sum=targets.reduce((s,t)=>s+t.nll,0);return {rows,targets,sum,count:targets.length,mean:targets.length?sum/targets.length:null,current:rows[cursor]};
}
export function lowRank(rank=1,alpha=2,phase=0){
 if(!int(rank,1,3)||!finite(alpha)||alpha<0||alpha>32||!int(phase,0,3))throw new RangeError('LoRA demonstration domain');
 const W=[[1,0,1],[0,2,0],[-1,0,1],[1,1,0]],x=[1,2,1],As=[[1,0,1],[0,1,0],[1,-1,0]],Bs=[[1,0,1],[0,1,-1],[1,1,0],[-1,0,1]],A=As.slice(0,rank),B=Bs.map(r=>r.slice(0,rank)),mv=(M,v)=>M.map(r=>r.reduce((s,a,j)=>s+a*v[j],0));
 const base=mv(W,x),compressed=mv(A,x),expanded=mv(B,compressed),scale=alpha/rank,delta=expanded.map(v=>scale*v),output=base.map((v,i)=>v+delta[i]),update=B.map(r=>Array.from({length:3},(_,j)=>scale*r.reduce((s,b,k)=>s+b*A[k][j],0)));
 return {W,x,A,B,base,compressed,expanded,scale,delta,output,update,phase,trainable:rank*7,full:12};
}
export function adapterBudget(n=4096,r=16){if(!int(n,1,16384)||!int(r,1,16384))throw new RangeError('Matrix budget domain');return {full:n*n,adapter:2*n*r,fullOps:3*n*n,adapterOps:2*n*n+6*n*r,ratio:(2*n*n+6*n*r)/(3*n*n)};}
export function invariantScale(alpha,init,lrA,lrB,p,q){if(![alpha,init,lrA,lrB,p,q].every(x=>finite(x)&&x>0))throw new RangeError('Scaling domain');return {alpha:alpha/(p*q),init:init*p,lrA:lrA*p,lrB:lrB*q,initial:alpha*init*lrB,timescale:init/lrA};}
export function newToken(parts=[[1,0],[0,2]],oldLogits=[1,0,-1],hidden=[1,.5]){
 if(!parts.length||parts.some(v=>v.length!==hidden.length||!v.every(finite))||!hidden.length||!hidden.every(finite)||!oldLogits.length||!oldLogits.every(finite))throw new RangeError('Token initialization domain');
 const embedding=hidden.map((_,j)=>parts.reduce((s,v)=>s+v[j],0)/parts.length),newLogit=embedding.reduce((s,x,j)=>s+x*hidden[j],0),max=Math.max(...oldLogits,newLogit),oldMass=oldLogits.reduce((s,x)=>s+Math.exp(x-max),0),extra=Math.exp(newLogit-max),newProbability=extra/(oldMass+extra),retained=oldMass/(oldMass+extra);
 return {embedding,newLogit,newProbability,retained,oldKL:-Math.log(retained)};
}
