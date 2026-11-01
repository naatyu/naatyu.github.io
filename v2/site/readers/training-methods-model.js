// Assigned teaching examples, not measurements from a training run.
export function packingBudget({examples=1024,examplesPerSequence=1,sequencesPerUpdate=8,tokensPerExample=128,sequenceLength=512}={}){
  for(const n of [examples,examplesPerSequence,sequencesPerUpdate,tokensPerExample,sequenceLength])
    if(!Number.isSafeInteger(n)||n<=0)throw new RangeError('Expected positive safe integers');
  if(examplesPerSequence*tokensPerExample>sequenceLength)throw new RangeError('Examples do not fit');
  const sequences=Math.ceil(examples/examplesPerSequence);
  const result={sequences,updates:Math.ceil(sequences/sequencesPerUpdate),tokens:examples*tokensPerExample,
    slots:sequences*sequenceLength,fullUpdateTokens:examplesPerSequence*sequencesPerUpdate*tokensPerExample};
  if(!Object.values(result).every(Number.isSafeInteger))throw new RangeError('Budget exceeds exact integer range');
  return result;
}
export function icepopMask(ratio,lower=.5,upper=5){
  if(![ratio,lower,upper].every(Number.isFinite)||ratio<0||lower<=0||upper<lower)
    throw new RangeError('Invalid likelihood ratio or mask bounds');
  return ratio>=lower&&ratio<=upper?ratio:0;
}
