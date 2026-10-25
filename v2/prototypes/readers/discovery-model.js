const unit=x=>{if(!Number.isFinite(x)||x<0||x>1)throw new RangeError('Expected a probability');return x;};
export function binaryEntropy(p){unit(p);return p===0||p===1?0:-p*Math.log2(p)-(1-p)*Math.log2(1-p);}
export const discoveryStages=[
 ['Experience','Notice a tension','An observation disagrees with an explanation, or two accepted principles conflict.'],
 ['Hypothesis','Propose an explanation','Choose variables and causal claims. This step can change the question, not only a parameter.'],
 ['Formalization','Make the premise precise','State the domain, assumptions and quantities that the explanation relates.'],
 ['Deduction','Derive a consequence','Compute a prediction under those premises. A valid deduction does not establish that the premises describe nature.'],
 ['Experiment','Seek a distinguishing observation','Choose a test where competing explanations predict different outcomes.'],
 ['Revision','Keep, restrict or replace','Compare with external evidence. One successful test is support within its domain, not final truth.']
];
export function discoveryStage(step){if(!Number.isInteger(step)||step<0||step>=discoveryStages.length)throw new RangeError('Invalid stage');return {step,label:discoveryStages[step][0],title:discoveryStages[step][1],text:discoveryStages[step][2]};}
export function discoveryExperiment(experiment,outcome,prior=.5){
 if(!['observe','do0','do1'].includes(experiment)||![0,1].includes(outcome))throw new RangeError('Invalid experiment or outcome');unit(prior);
 // A: X=U,Y=X. B: X=U,Y=U. U is fair; measured Y flips with probability .1.
 const pA=experiment==='do0'?.1:.9,pB=experiment==='observe'?.9:.5;
 const likelihoodA=outcome?pA:1-pA,likelihoodB=outcome?pB:1-pB;
 const predictive=prior*likelihoodA+(1-prior)*likelihoodB;
 const posterior=prior*likelihoodA/predictive;
 const predictOne=prior*pA+(1-prior)*pB;
 const postOne=prior*pA/predictOne,postZero=prior*(1-pA)/(1-predictOne);
 const expectedEntropy=predictOne*binaryEntropy(postOne)+(1-predictOne)*binaryEntropy(postZero);
 return {experiment,outcome,prior,pA,pB,likelihoodA,likelihoodB,predictive,posterior,priorEntropy:binaryEntropy(prior),posteriorEntropy:binaryEntropy(posterior),expectedEntropy,expectedGain:binaryEntropy(prior)-expectedEntropy};
}
