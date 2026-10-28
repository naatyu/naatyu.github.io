import {qsaToy} from './qwen-next-model.js';
import {rangePlayback} from './topic-tools.js';
const captions=[
 'Identify complete causal blocks. The unfinished current block remains directly accessible.',
 'Pool each complete block into a selection key. Score it against the query.',
 'Select the highest-scoring complete block. Equal scores use the earlier block in this illustration.',
 'Expand the selected block to original tokens. Add the unfinished tail for core attention.',
];
export function qsaToyBody(position=10,step=0){
 const f=qsaToy(position,step);
 return `<div class="frontier-layers" role="img" aria-label="Synthetic causal selection at token ${position}; step ${step+1}">${f.keys.map((_,i)=>{
 const future=i>position,tail=f.tail.includes(i),chosen=f.selected.some(b=>i>=b.start&&i<=b.end),active=!future&&(tail||step>=2&&chosen);
 return `<span class="${active?'frontier-selected':''}" aria-label="Token ${i}: ${future?'future, masked':tail?'tail, included':step>=2&&chosen?'selected block':'not selected yet'}">${i}${future?' ×':tail?' T':step>=2&&chosen?' ✓':''}</span>`;
 }).join('')}</div><p aria-live="polite"><b>Step ${step+1}/4.</b> ${captions[step]}</p><p>${step>=1?`Complete-block scores: ${f.blocks.map(b=>`[${b.start}–${b.end}]: ${b.score}`).join('; ')||'none'}.`:'Scores are not computed yet.'} ${step>=3?`Core-attention token indices: ${f.indices.join(', ')||'none'}.`:`Tail: ${f.tail.join(', ')||'empty'}.`}</p>`;
}
export function qsaToyScene(){return `<div class="topic-scene" data-qwen-qsa><h3>Follow block selection without losing causality</h3><p>Synthetic illustration: 12 keys, one query head, four-token blocks and one selected block. It omits projections, learned normalization gains and RoPE; it is not a quality or latency experiment. T marks tail tokens; × marks masked future tokens; ✓ marks selected complete-block tokens.</p><label>Query position<select aria-label="QSA query position">${[0,3,4,7,10,11].map(p=>`<option value="${p}" ${p===10?'selected':''}>Token ${p}</option>`).join('')}</select></label><label>Selection step<input type="range" min="0" max="3" step="1" value="0" aria-label="QSA selection step"></label><div class="dense-actions"><button type="button" data-play>Play</button><button type="button" data-reset>Replay</button></div><div data-body>${qsaToyBody()}</div><p>The production indexer has four query heads, selects up to 512 complete blocks, and uses partial RoPE. Its tail contains at most three tokens. The static procedure above defines the same causal boundary without requiring playback.</p></div>`;}
export function mountQwenQSA(article){for(const lab of article.querySelectorAll('[data-qwen-qsa]')){
 const position=lab.querySelector('select'),slider=lab.querySelector('input');
 const draw=()=>{lab.querySelector('[data-body]').innerHTML=qsaToyBody(Number(position.value),Number(slider.value));};
 const playback=rangePlayback(article,lab,draw,9000);
 position.addEventListener('change',()=>{playback.stop();draw();});
}}
