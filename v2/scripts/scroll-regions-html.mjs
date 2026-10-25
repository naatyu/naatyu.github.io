import {parseFragment,serialize} from 'parse5';
import {scrollRegionAttributes} from '../site/readers/scroll-regions.js';
const attr=(node,name)=>node.attrs?.find(a=>a.name===name)?.value;
const text=node=>node.nodeName==='#text'?node.value:(node.childNodes||[]).map(text).join('');
const walk=node=>[node,...(node.childNodes||[]).flatMap(walk)];
function context(node){
  for(let parent=node.parentNode;parent;parent=parent.parentNode){
    if(parent.tagName==='details')return text(parent.childNodes.find(n=>n.tagName==='summary')||{});
    if(parent.tagName==='section')return text(walk(parent).find(n=>['h2','h3'].includes(n.tagName))||{});
  }
  return '';
}
export function prepareStaticScrollRegions(html){
  const root=parseFragment(html);
  for(const node of walk(root)){
    if(node.tagName!=='pre'&&!(attr(node,'class')||'').split(' ').includes('dense-table-wrap'))continue;
    const caption=walk(node).find(n=>n.tagName==='caption');
    const attrs=scrollRegionAttributes({kind:node.tagName==='pre'?'code':'table',caption:caption&&text(caption),context:context(node),label:attr(node,'aria-label'),labelledBy:attr(node,'aria-labelledby')});
    for(const [name,value]of Object.entries(attrs)){
      const existing=node.attrs.find(a=>a.name===name);
      if(existing)existing.value=value;else node.attrs.push({name,value});
    }
  }
  return serialize(root);
}
