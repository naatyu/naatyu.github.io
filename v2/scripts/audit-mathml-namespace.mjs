import {parseFragment} from 'parse5';

// HTML parsing can put nested children of MathML token elements in the HTML
// namespace. TeX acceptance and visual KaTeX output do not detect that defect.
export function foreignMathNodes(html){
  const failures=[],queue=[parseFragment(html)];
  while(queue.length){
    const node=queue.pop();
    if(node.tagName==='math'){
      const children=[node];
      while(children.length){
        const child=children.pop();
        if(child.tagName&&child.namespaceURI!=='http://www.w3.org/1998/Math/MathML')failures.push({tag:child.tagName,namespace:child.namespaceURI});
        children.push(...child.childNodes||[]);
      }
    }else queue.push(...node.childNodes||[]);
  }
  return failures;
}
