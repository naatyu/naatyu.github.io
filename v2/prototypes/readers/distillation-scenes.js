import {rangePlayback} from "./topic-tools.js";
import {softDistillation,reverseDistillation,twoTokenDistillation,topKTeacher,selfSampleBatch} from "./distillation-model.js";
const fmt=x=>Number(x.toFixed(5)).toString();
const percent=x=>fmt(100*x)+"%";
const controls="<div class='dense-actions'><button data-play>Play</button><button data-reset>Replay</button></div>";
function distribution(q,p,labels) {
 return "<div class='distillation-distributions'>"+labels.map((label,i)=>"<div><strong>"+label+"</strong><div class='distillation-bars'><span class='distillation-teacher' style='width:"+100*q[i]+"%'></span><span class='distillation-student' style='width:"+100*p[i]+"%'></span></div><span>Teacher "+percent(q[i])+" · Student "+percent(p[i])+"</span></div>").join("")+"</div>";
}
export function temperatureBody(tau=1) {
 const m=softDistillation([3,1,0],[1,.5,0],tau);
 return distribution(m.q,m.p,["Cat","Dog","Car"])+"<p>Temperature τ="+fmt(tau)+". KL="+fmt(m.kl)+" nats; τ² KL="+fmt(m.loss)+". Gradient with respect to unscaled student logits: ["+m.gradient.map(fmt).join(", ")+"].</p><p>Teacher logits [3,1,0]; student logits [1,.5,0]. Blue is student; burgundy is teacher. Both use the same temperature. Labels illustrate assigned alternatives, not learned semantic similarity.</p>";
}
export function gradientBody(logit=0) {
 const m=reverseDistillation([1,0],[logit,0]);
 return distribution(m.q,m.p,["A","B"])+"<div class='distillation-metrics'><div><span>Reverse KL</span><strong>"+fmt(m.kl)+"</strong><small>Nats at a fixed prefix</small></div><div><span>Correct logit gradient</span><strong>"+fmt(m.gradient[0])+"</strong><small>Exact = expected score estimator</small></div><div><span>Naive expected gradient</span><strong>"+fmt(m.naiveExpectation[0])+"</strong><small>Sampling treated as a constant</small></div></div><p>Student A-logit="+fmt(logit)+", teacher A-logit=1; B-logit=0 for both. Minimization moves opposite the displayed gradient. The direct gradient of log p(a)−log q(a) averages to zero when a is sampled from p. Multiplying the score gradient by the detached log ratio restores the conditional KL gradient.</p>";
}
export function visitationBody(logit=0) {
 const m=twoTokenDistillation([logit,4,-1],[0,0,-1]);
 const a=m.rows[0].p[0];
 return "<div class='distillation-tree' tabindex='0' role='region' aria-label='Scrollable two-token prefix tree'><svg viewBox='0 0 540 275' role='img' aria-label='Student root chooses A or B. The continuation after A has mismatched teacher and student distributions; the continuation after B agrees.'><path d='M270 65 L135 155 M270 65 L405 155' fill='none' stroke='#bfdff2' stroke-width='3'/><rect x='207' y='18' width='126' height='47' rx='12' fill='#442b38' stroke='#cf879e'/><text x='270' y='47' text-anchor='middle'>Root prefix</text><rect x='28' y='155' width='214' height='78' rx='12' fill='#442b38' stroke='#cf879e'/><rect x='298' y='155' width='214' height='78' rx='12' fill='#273b4b' stroke='#bfdff2'/><text x='135' y='183' text-anchor='middle'>After A: KL="+fmt(m.rows[1].kl)+"</text><text x='135' y='208' text-anchor='middle'>Student visits "+percent(a)+"</text><text x='405' y='183' text-anchor='middle'>After B: KL=0</text><text x='405' y='208' text-anchor='middle'>Student visits "+percent(1-a)+"</text><text x='125' y='107'>A</text><text x='395' y='107'>B</text></svg></div><div class='distillation-metrics'><div><span>Two-token KL</span><strong>"+fmt(m.kl)+"</strong></div><div><span>Root: fixed-prefix gradient</span><strong>"+fmt(m.localGradient[0])+"</strong></div><div><span>Root: full sequence gradient</span><strong>"+fmt(m.fullGradient[0])+"</strong></div></div><p>Missing visitation term: "+fmt(m.visitationGradient)+". Changing the first token changes how often the student reaches each later prefix. Immediate local feedback holds that prefix distribution fixed; full sequence KL differentiates it. At root logit 0 the local root gradient is zero, yet the complete sequence gradient is positive.</p><p>Fixed binary two-token tree. Teacher A-logits [0,0,−1]; student A-logits ["+fmt(logit)+",4,−1]. Each B-logit is 0. No EOS, variable lengths, task reward or measured training curve.</p>";
}
export function tailBody(k=2) {
 const m=topKTeacher([3,2,1,0],k);
 return "<p>Teacher logits [3,2,1,0]. Keep "+k+" entries. Retained probability="+percent(m.retainedMass)+"; omitted probability="+percent(m.tailMass)+".</p><p>Conditional target after renormalization: ["+m.conditional.map(fmt).join(", ")+"]. Original retained probabilities plus a remainder bucket: ["+m.bucket.map(fmt).join(", ")+"].</p><p>Renormalizing the retained entries answers a different question: how does the teacher choose <em>conditional on being inside the retained set</em>? The remainder bucket preserves excluded mass, but not its allocation among excluded tokens.</p>";
}
export function selfBatchBody(successes=5) {
 const m=selfSampleBatch(0,8,successes,.5);
 return distribution([.5,.5],[m.next,1-m.next],["A","B"])+"<p>Initial p(A)=.5. A occurs "+successes+" times in eight samples. Empirical fraction="+fmt(m.frequency)+"; initial SFT gradient="+fmt(m.gradient)+"; new A-logit="+fmt(m.nextLogit)+".</p><p>One gradient step with learning rate .5 gives p(A)="+fmt(m.next)+" and KL to the original="+fmt(m.driftKL)+" nats. The expectation of the <em>initial</em> gradient over fresh batches is zero. A particular batch need not have zero gradient; repeatedly fitting that fixed batch no longer trains on the current policy's distribution.</p><p>This is a constructed finite-sample explanation. It does not prove that SFT necessarily degrades a real model's task performance.</p>";
}
const scene=(key,title,inputs,body,caption,play=false)=>"<figure class='topic-scene' data-distillation-lab='"+key+"'><h3>"+title+"</h3>"+inputs+(play?controls:"")+"<div data-body>"+body+"</div><figcaption>"+caption+"</figcaption></figure>";
export function distillationScenes() {
 return {
 temperature:scene("temperature","Soft targets expose the alternatives","<label>Shared temperature<input aria-label='Distillation temperature' type='range' min='2' max='40' step='1' value='10'></label>",temperatureBody(),"Exact three-class model; τ is slider value/10.",true),
 gradient:scene("gradient","A value estimate is not automatically a training loss","<label>Student A-logit<input aria-label='Distillation student logit' type='range' min='-30' max='30' step='1' value='0'></label>",gradientBody(),"Exact fixed-prefix reverse KL; A-logit is slider value/10."),
 visitation:scene("visitation","An early decision changes later training states","<label>Root student A-logit<input aria-label='Distillation root logit' type='range' min='-30' max='30' step='1' value='0'></label>",visitationBody(),"Exact enumeration of four trajectories, not a rollout simulation.",true),
 tail:scene("tail","Top-k probabilities hide a tail","<label>Retained teacher entries<input aria-label='Retained teacher entries' type='range' min='1' max='4' step='1' value='2'></label>",tailBody(),"Aligned four-entry vocabulary; deterministic top-k with stable index tie-breaking."),
 selfBatch:scene("self-batch","Sampling from yourself does not make every batch neutral","<label>A occurrences in eight samples<input aria-label='Self-sampled A count' type='range' min='0' max='8' step='1' value='5'></label>",selfBatchBody(),"One binary-logit gradient step, not a learning curve.")
 };
}
export function mountDistillationScenes(article) {
 for(const [key,body,scale,play] of [["temperature",temperatureBody,10,true],["gradient",gradientBody,10,false],["visitation",visitationBody,10,true],["tail",tailBody,1,false],["self-batch",selfBatchBody,1,false]]) {
  const lab=article.querySelector("[data-distillation-lab='"+key+"']");
  if(!lab)continue;
  const input=lab.querySelector("input"),draw=()=>{lab.querySelector("[data-body]").innerHTML=body(Number(input.value)/scale);};
  if(play)rangePlayback(article,lab,draw,18000,input);else input.addEventListener("input",draw);
 }
}
