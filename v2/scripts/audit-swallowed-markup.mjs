import {parseFragment} from 'parse5';

// Detect a comparison that consumed a closing tag as part of its opening tag.
// Ignore quoted attribute values and foreign math/SVG subtrees. This is not
// a complete HTML validator, factual audit or dynamic-state certification.
export function swallowedMarkup(html){
  const failures=[],queue=[parseFragment(html,{sourceCodeLocationInfo:true})];
  while(queue.length){
    const node=queue.pop();
    if(['math','svg'].includes(node.tagName))continue;
    const location=node.sourceCodeLocation?.startTag;
    if(location){
      const opening=html.slice(location.startOffset,location.endOffset);
      let quote=null;
      for(let i=1;i<opening.length;i++){
        const c=opening[i];
        if(quote){if(c===quote)quote=null;continue;}
        if(c==='"'||c==="'"){quote=c;continue;}
        if(c==='<'&&opening[i+1]==='/'){
          failures.push({tag:node.tagName,opening,offset:location.startOffset});break;
        }
      }
    }
    queue.push(...node.childNodes||[]);
  }
  return failures;
}
