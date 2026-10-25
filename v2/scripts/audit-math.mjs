// Structural math inventory, not a proof of mathematical or source correctness.
import {parseFragment} from 'parse5';
import {readerMetas,renderDenseReader} from '../prototypes/readers/index.js';
export function mathInventory(){return readerMetas.map(meta=>{
  const row={slug:meta.slug,typeset:0,legacy:0,errors:0};
  const walk=node=>{const cls=node.attrs?.find(a=>a.name==='class')?.value.split(/\s+/)||[];
    if(cls.includes('dense-equation'))row[cls.includes('typeset-equation')?'typeset':'legacy']++;
    if(cls.includes('katex-error'))row.errors++;
    for(const child of node.childNodes||[])walk(child);
  };walk(parseFragment(renderDenseReader(meta.slug,s=>'/atlas/'+s)));return row;
});}

// Heuristic review queue, not an automatic equation classifier. Plain metrics,
// units and code-like identifiers can match. Inspect every candidate in context.
export function rawMathCandidates(html){
  const candidates=[];
  const walk=(node,section='',context='prose')=>{
    const classes=node.attrs?.find(a=>a.name==='class')?.value.split(/\s+/)||[];
    if(['math','svg','pre','code','script','style'].includes(node.tagName)||classes.some(c=>['katex','inline-math'].includes(c)))return;
    section=node.attrs?.find(a=>a.name==='id')?.value||section;
    if(node.tagName==='figcaption')context='caption';
    if(['td','th','caption'].includes(node.tagName))context='table';
    if(classes.some(c=>['topic-scene','dense-lab','scene-stats'].includes(c)))context='scene';
    if(node.nodeName==='#text'){
      const text=node.value.trim();
      if(/[∑√∇]/.test(text)||(/[=≈∝‖]/.test(text)&&/[\/²³₀₁₂ᵀΣβηθΔ]/.test(text)))candidates.push({section,context,text});
    }
    for(const child of node.childNodes||[])walk(child,section,context);
  };
  walk(parseFragment(html));return candidates;
}
export function inlineMathInventory(){return readerMetas.map(meta=>({slug:meta.slug,candidates:rawMathCandidates(renderDenseReader(meta.slug,s=>'/atlas/'+s))}));}
if(process.argv[1]?.endsWith('audit-math.mjs')){
  if(process.argv.includes('--inline')){
    const rows=inlineMathInventory();console.log(JSON.stringify({scope:'Heuristic raw text candidates only; excludes typeset math, code and SVG. Dynamic states and SVG labels require separate inspection. A match is not an error or a correctness verdict.',readers:rows.length,candidates:rows.reduce((s,r)=>s+r.candidates.length,0),rows},null,2));
  }else{
  const rows=mathInventory();console.log(JSON.stringify({scope:'Display blocks only; inline prose, scene labels and mathematical correctness need separate review',readers:rows.length,typeset:rows.reduce((s,r)=>s+r.typeset,0),legacy:rows.reduce((s,r)=>s+r.legacy,0),errors:rows.reduce((s,r)=>s+r.errors,0),rows},null,2));
  }
}
