import {ringAllReduceTrace,directAllReduceTrace,communicationVolume,exchangeState,exchangeAction} from './communication-model.js';
import {rangePlayback} from './topic-tools.js';
const inputs=Array.from({length:4},(_,r)=>Array.from({length:4},(_,j)=>10*r+j+1));
const text=(x,y,s,c='#efe7ed')=>`<text x="${x}" y="${y}" fill="${c}">${s}</text>`;
const plot=(label,body,height=350)=>`<div class="communication-plot" tabindex="0" role="region" aria-label="${label}"><svg role="img" aria-label="${label}" viewBox="0 0 700 ${height}">${body}</svg></div>`;
const num=x=>Number(x.toFixed(3));
export function communicationRingBody(stage=0){
 const trace=ringAllReduceTrace(inputs),f=trace.frames[stage];if(!f)throw new RangeError('stage');
 let body=text(24,27,`${f.phase}${stage?` · round ${f.round}`:''}`);
 for(let r=0;r<4;r++){const x=24+r*170;body+=text(x,60,`Rank ${r}`,'#bddaf4');
  for(let b=0;b<4;b++){const c=f.blocks[r][b],y=76+b*55,complete=c.contributors.length===4;body+=`<rect x="${x}" y="${y}" width="154" height="48" rx="6" fill="${complete?'#654052':'#392b42'}" stroke="#8c768e"/>`+text(x+9,y+19,`Block ${b}: ${c.values[0]}`)+text(x+9,y+37,`Sources ${c.contributors.join('+')}`,'#bddaf4');}
 }
 body+=text(24,320,stage===3?'After reduce-scatter: owners hold blocks 1,2,3,0.':stage===6?'Every rank now has [64,68,72,76].':'Each arrow sends one block to the next rank: 0 → 1 → 2 → 3 → 0.');
 const sends=f.transfers.map(t=>`R${t.source}→R${t.destination}: block${t.block}=${t.values.join(',')}`).join('; ');
 return plot('Four-rank ring: values and exact contributing ranks',body)+`<p data-communication-result>State=${stage}; phase=${f.phase}; transfer rounds completed=${stage}; ${sends||'No transfer yet.'}</p><p>Conceptual integer example. Rank r starts with [10r+1,10r+2,10r+3,10r+4]. “Sources” identifies every input already included in that block. A completed block contains all four sources. Intermediate blocks are not all valid outputs. Layout order is fixed; there are three reduction rounds and three distribution rounds. This is not measured NCCL timing.</p>`;
}
export function communicationDirectBody(stage=0,shots=1,mode='push'){
 const trace=directAllReduceTrace(inputs,{shots,mode}),index=Math.round(stage*(trace.frames.length-1)/4),f=trace.frames[index];
 const edges=f.transfers.map(t=>`<li>Rank${t.actor} ${mode==='push'?'stores':'loads'}: R${t.source}→R${t.destination}, offset${t.offset}, values[${t.values.join(',')}].</li>`).join('');
 return `<h4>${f.phase}</h4><p data-communication-result>Stage=${stage}; logical state=${index}; shots=${shots}; mode=${mode}; transfers=${f.transfers.length}; transferred elements=${f.transfers.reduce((s,t)=>s+t.values.length,0)}.</p><div class="dense-table-wrap" tabindex="0" role="region" aria-label="Direct collective result ownership"><table><caption>Result ownership at this stopped state</caption><thead><tr><th>Rank</th><th>Output currently available</th></tr></thead><tbody>${f.outputs.map((row,r)=>`<tr><td>${r}</td><td>${row?`[${row.join(',')}]`:'Not complete'}</td></tr>`).join('')}</tbody></table></div><details><summary>Read the individual peer operations</summary><ul>${edges||'<li>No peer operation in this state.</li>'}</ul></details><p>${shots===1?'One-shot sends or loads each entire peer vector. Every rank computes the full sum locally.':'Two-shot assigns partition r to owner r. Owners reduce only their partitions, then distribute the reduced partitions.'} Push and pull change the initiating rank, not the intended result. Pull assumes a valid source-ready lifetime contract. Remote data must be visible before reduction in either mode. Playback stages are normalized for comparison; repeated states are not extra communication rounds.</p>`;
}
export const creditActions=[[0,'send'],[1,'send'],[0,'consume'],[0,'send'],[0,'consume'],[1,'consume'],[1,'send'],[0,'consume'],[0,'send'],[1,'consume'],[1,'send'],[0,'consume'],[1,'consume']];
export function communicationCreditBody(stage=0){
 if(!Number.isInteger(stage)||stage<0||stage>creditActions.length)throw new RangeError('stage');
 let s=exchangeState(),last=null;for(let i=0;i<stage;i++){const [rank,action]=creditActions[i],out=exchangeAction(s,rank,action);s=out.state;last={rank,action,...out};}
 let body=text(25,28,'Two peers · two receive slots · send, consume, then advance');
 for(let rank=0;rank<2;rank++){const y=65+rank*120,p=s.peers[rank];body+=text(25,y+20,`Rank ${rank}`,'#bddaf4')+text(25,y+45,`Epoch ${p.epoch}`)+text(25,y+68,p.sent?'Sent; waiting/consuming':'Ready to send');
  for(let slot=0;slot<2;slot++){const x=230+slot*200,value=s.buffers[rank][slot];body+=`<rect x="${x}" y="${y}" width="180" height="80" rx="8" fill="${value===null?'#392b42':'#654052'}" stroke="#8c768e"/>`+text(x+12,y+25,`Receive buffer ${slot}`)+text(x+12,y+52,value===null?'Empty':`Unread peer epoch ${value}`);}
 }
 const label=last?`Rank ${last.rank} ${last.action} epoch ${last.epoch}: ${last.allowed?'allowed':'blocked; peer data absent'}`:'Both peers start at epoch 0; receive buffers empty.';
 body+=text(25,320,label);
 return plot('Bidirectional epoch exchange with implicit receive credits',body)+`<p data-communication-result>State=${stage}; peer epochs=${s.peers.map(p=>p.epoch).join(',')}; unread buffers=${JSON.stringify(s.buffers)}; last action=${last?`${last.rank}:${last.action}:${last.allowed}`:'none'}.</p><p>The faster rank sends epoch 1 while the slower rank still consumes epoch 0. The faster rank then waits. Arrival of the slower rank’s epoch 1 proves that the slower rank consumed epoch 0. Only then can the faster rank reuse buffer 0 for epoch 2. There is one send per peer per epoch, and each peer consumes before advancing. Those rules—not merely two allocations—prevent overwrite. This sequentially consistent illustration does not certify GPU fences or memory visibility.</p>`;
}
export function communicationVolumeBody(exponent=10,ranks=4,sync='sentinel'){
 const bytes=2**exponent,x=communicationVolume({ranks,messageBytes:bytes,iterationBytes:128,sync}),one=x.oneShot,two=x.twoShot;
 return `<p data-communication-result>Message=${bytes}B; ranks=${ranks}; sync=${sync}; one-shot wire=${one?num(one.wire):'not modeled'}B/rank; two-shot wire=${num(two.wire)}B/rank; one-shot scratch=${one?num(one.scratchPerEpoch):'not modeled'}B/epoch/rank; two-shot scratch=${num(two.scratchPerEpoch)}B/epoch/rank.</p><p>Logical payload per rank: one-shot ${(ranks-1)*bytes}B; two-shot ${num(2*(ranks-1)*bytes/ranks)}B. LL doubles the illustrative wire bytes. Atomic two-shot counts are approximate; this model omits displaced payload and transport headers. Scratch uses D=128B of input per iteration, not the complete M-byte message. Two epoch regions and implementation metadata require extra allocation. These byte counts do not predict elapsed time or guarantee an algorithm crossover.</p>`;
}
const range=(name,max,value=0)=>`<label>Stopped state<input type="range" min="0" max="${max}" step="1" value="${value}" aria-label="${name}"></label>`;
const buttons='<div class="dense-actions"><button data-play>Play</button><button data-reset>Replay</button></div>';
export function communicationScenes(){return {
 ring:`<div class="topic-scene" data-communication-lab="ring"><h3>Follow one ring, block by block</h3>${range('Communication ring state',6)}${buttons}<div data-body>${communicationRingBody()}</div></div>`,
 direct:`<div class="topic-scene" data-communication-lab="direct"><h3>Same sum, different owner and initiating GPU</h3><label>Algorithm<select aria-label="Communication shots"><option value="1">One-shot</option><option value="2">Two-shot</option></select></label><label>Peer operation<select aria-label="Communication mode"><option value="push">Push: sender stores</option><option value="pull">Pull: receiver loads</option></select></label>${range('Communication direct state',4)}${buttons}<div data-body>${communicationDirectBody()}</div></div>`,
 credit:`<div class="topic-scene" data-communication-lab="credit"><h3>A fast peer must earn permission to reuse a slot</h3>${range('Communication credit state',13)}${buttons}<div data-body>${communicationCreditBody()}</div></div>`,
 volume:`<div class="topic-scene" data-communication-lab="volume"><h3>Count traffic and scratch separately</h3><label>Message bytes as2ⁿ<input type="range" aria-label="Communication message exponent" min="7" max="25" step="1" value="10"></label><label>Participants<select aria-label="Communication participants">${[4,2,8,16,64].map(n=>`<option>${n}</option>`).join('')}</select></label><label>Readiness encoding<select aria-label="Communication sync"><option value="sentinel">Sentinel</option><option value="ll">LL</option><option value="atomic">Atomic two-shot</option></select></label><div data-body>${communicationVolumeBody()}</div></div>`
};}
export function mountCommunicationScenes(article){for(const lab of article.querySelectorAll('[data-communication-lab]')){
 const slider=lab.querySelector('input'),selects=[...lab.querySelectorAll('select')],body=lab.querySelector('[data-body]');
 const draw=()=>{const stage=Math.round(Number(slider.value)),v=selects.map(s=>s.value);body.innerHTML=lab.dataset.communicationLab==='ring'?communicationRingBody(stage):lab.dataset.communicationLab==='direct'?communicationDirectBody(stage,Number(v[0]),v[1]):lab.dataset.communicationLab==='credit'?communicationCreditBody(stage):communicationVolumeBody(stage,Number(v[0]),v[1]);};
 if(lab.dataset.communicationLab==='volume'){slider.addEventListener('input',draw);for(const s of selects)s.addEventListener('change',draw);draw();}
 else{const playback=rangePlayback(article,lab,draw,20000,slider);for(const s of selects)s.addEventListener('change',()=>{playback.stop();draw();});}
}}
