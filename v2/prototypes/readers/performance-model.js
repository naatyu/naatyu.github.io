// Ideal arithmetic/traffic bounds, not predictions of measured GPU performance.
const positive=(x,name)=>{if(!Number.isFinite(x)||x<=0)throw new RangeError(name+' must be positive and finite');return x;};
const natural=(x,name)=>{positive(x,name);if(!Number.isSafeInteger(x))throw new RangeError(name+' must be a safe integer');return x;};
const finiteResult=(obj)=>{for(const value of Object.values(obj))if(typeof value==='number'&&!Number.isFinite(value))throw new RangeError('Non-finite result');return obj;};

// Unsharded logical payload for uniform full-context attention. Exact bytes;
// no allocator pages, quantization metadata, cache sharing or temporary tensors.
export function kvCacheAccounting({layers,kvHeads,headWidth,elementBytes,sequence,sequences=1}){
 for(const [name,value]of Object.entries({layers,kvHeads,headWidth,elementBytes}))natural(value,name);
 for(const [name,value]of Object.entries({sequence,sequences}))if(!Number.isSafeInteger(value)||value<0)throw new RangeError(name+' must be a nonnegative safe integer');
 const bytesPerToken=2n*BigInt(layers)*BigInt(kvHeads)*BigInt(headWidth)*BigInt(elementBytes);
 return {bytesPerToken,totalBytes:bytesPerToken*BigInt(sequence)*BigInt(sequences)};
}

export function matmulAccounting({rows,inner,cols,inputBytes=2,weightBytes=2,outputBytes=2}){
 natural(rows,'rows');natural(inner,'inner');natural(cols,'cols');
 positive(inputBytes,'inputBytes');positive(weightBytes,'weightBytes');positive(outputBytes,'outputBytes');
 const inputTraffic=rows*inner*inputBytes,weightTraffic=inner*cols*weightBytes,outputTraffic=rows*cols*outputBytes;
 // One ideal read of each input and one write of output; beta=0, no tiling reloads.
 const flops=2*rows*inner*cols,bytes=inputTraffic+weightTraffic+outputTraffic;
 return finiteResult({flops,bytes,inputTraffic,weightTraffic,outputTraffic,intensity:flops/bytes});
}

export function rooflineAccounting({flops,bytes,peak,bandwidth}){
 positive(flops,'flops');positive(bytes,'bytes');positive(peak,'peak');positive(bandwidth,'bandwidth');
 const computeSeconds=flops/peak,transferSeconds=bytes/bandwidth;
 const idealSeconds=Math.max(computeSeconds,transferSeconds);
 return finiteResult({intensity:flops/bytes,ridge:peak/bandwidth,computeSeconds,transferSeconds,idealSeconds,serializedIdealSeconds:computeSeconds+transferSeconds,throughput:Math.min(peak,bandwidth*flops/bytes),regime:computeSeconds===transferSeconds?'ridge':computeSeconds>transferSeconds?'compute ceiling':'bandwidth ceiling'});
}

// One distinct matrix per row: a batch of independent matrix-vector products.
// No inter-row weight sharing, tile reloads, conversions or extra operations.
export function perRowMatmulAccounting(settings){
 const rows=natural(settings.rows,'rows');
 const one=matmulAccounting({...settings,rows:1});
 return finiteResult({...one,flops:rows*one.flops,bytes:rows*one.bytes,inputTraffic:rows*one.inputTraffic,weightTraffic:rows*one.weightTraffic,outputTraffic:rows*one.outputTraffic});
}

export function layerAccounting({sequences,sequence,width,intermediate,queryHeads,kvHeads,headWidth,experts=1,selected=1,causal=false,remat=false}){
 for(const [name,value]of Object.entries({sequences,sequence,width,intermediate,queryHeads,kvHeads,headWidth,experts,selected}))natural(value,name);
 if(width!==queryHeads*headWidth||queryHeads%kvHeads!==0||kvHeads>queryHeads||selected>experts)throw new RangeError('Inconsistent attention or expert layout');
 if(typeof causal!=='boolean'||typeof remat!=='boolean')throw new RangeError('Policies must be Boolean');
 const attentionParameters=2*width*width+2*width*kvHeads*headWidth;
 const expertParameters=3*width*intermediate;
 const activeParameters=attentionParameters+selected*expertParameters;
 const storedParameters=attentionParameters+experts*expertParameters;
 const tokens=sequences*sequence;
 const pairs=causal?sequence*(sequence+1)/2:sequence*sequence;
 const linearForward=2*tokens*activeParameters;
 const quadraticForward=4*sequences*pairs*width;
 const modelTraining=3*(linearForward+quadraticForward);
 // Both operand gradients; ideal useful pair convention. No output head, norms,
 // softmax, router, padding or actual masked-tile execution included.
 const executedTraining=modelTraining+(remat?linearForward+quadraticForward:0);
 return finiteResult({attentionParameters,expertParameters,activeParameters,storedParameters,tokens,pairs,linearForward,quadraticForward,modelTraining,executedTraining,attentionRatio:quadraticForward/linearForward});
}

export function utilizationAccounting({modelFlops,executedFlops,seconds,devices,peak}){
 positive(modelFlops,'modelFlops');positive(executedFlops,'executedFlops');positive(seconds,'seconds');natural(devices,'devices');positive(peak,'peak');
 if(executedFlops<modelFlops)throw new RangeError('Executed work cannot be smaller than the assigned model work');
 const availableFlops=seconds*devices*peak;
 // Do not clamp >1: it exposes a mismatched numerator, peak or timing window.
 return finiteResult({availableFlops,mfu:modelFlops/availableFlops,hfu:executedFlops/availableFlops,modelRate:modelFlops/seconds,executedRate:executedFlops/seconds,consistent:executedFlops<=availableFlops});
}
