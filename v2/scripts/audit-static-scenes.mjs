import {parseFragment} from 'parse5';
import {pathToFileURL} from 'node:url';
import {readerMetas,renderDenseReader} from '../prototypes/readers/index.js';

// Review queue only. Empty search results or an initial uncommitted row can be
// intentional. Nonempty geometry does not prove a readable or correct diagram.
export function staticSceneCandidates(html){
  const found=[];
  const attr=(n,k)=>n.attrs?.find(a=>a.name===k)?.value;
  const flatten=n=>[n,...(n.childNodes||[]).flatMap(flatten)];
  const walk=(node,section='',scene=false)=>{
    if(['script','style','math'].includes(node.tagName))return;
    section=attr(node,'id')||section;
    const cls=(attr(node,'class')||'').split(/\s+/);
    scene=scene||cls.some(c=>['topic-scene','dense-lab','routing-film','attention-film'].includes(c));
    if(attr(node,'aria-hidden')==='true')return;
    const data=(node.attrs||[]).filter(a=>a.name.startsWith('data-')).map(a=>a.name);
    let kind='';
    if(node.tagName==='svg'&&attr(node,'role')==='img'&&!flatten(node).some(n=>['path','rect','circle','ellipse','line','polyline','polygon','image','use','text'].includes(n.tagName)))kind='empty-image';
    else if(scene&&['div','p','output'].includes(node.tagName)&&data.length&&!(node.childNodes||[]).some(n=>n.nodeName!=='#text'||n.value.trim()))kind='empty-scene-data';
    if(kind)found.push({section,kind,tag:node.tagName,data,label:attr(node,'aria-label')||''});
    for(const child of node.childNodes||[])walk(child,section,scene);
  };
  walk(parseFragment(html));return found;
}
export function staticSceneInventory(){return readerMetas.map(m=>({slug:m.slug,candidates:staticSceneCandidates(renderDenseReader(m.slug,s=>'/atlas/'+s))}));}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){const rows=staticSceneInventory();console.log(JSON.stringify({scope:'Unmounted teaching candidates only; intentional initial empty states require review. This does not certify no-JS usability, accessibility, geometry or factual correctness.',readers:rows.length,candidates:rows.reduce((s,r)=>s+r.candidates.length,0),rows:rows.filter(r=>r.candidates.length)},null,2));}
