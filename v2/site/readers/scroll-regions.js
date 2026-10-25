// Shared naming policy for exported HTML and live, regenerated reader blocks.
const clean=value=>String(value||'').replace(/\s+/g,' ').trim();
export function scrollRegionAttributes({kind,caption,context,label,labelledBy}){
  const existing=clean(label);
  const name=kind==='table'?clean(caption)||existing:existing||`${clean(context)||'Note'} — code example`;
  return {tabindex:'0',role:'region',...(!labelledBy?{'aria-label':name||'Comparison table'}:{})};
}

const mounted=new WeakSet();
export function mountScrollRegions(article,Observer=globalThis.MutationObserver){
  if(mounted.has(article))return;
  mounted.add(article);
  let disposed=false;
  function prepare(root){
    const regions=[...(root.matches?.('.dense-table-wrap, pre')?[root]:[]),...root.querySelectorAll('.dense-table-wrap, pre')];
    for(const region of regions){
      // Some scroll wrappers contain diagrams instead of tables. Keep their names.
      const caption=region.querySelector('table > caption');
      const kind=region.tagName==='PRE'?'code':'table';
      const context=region.closest('details')?.querySelector('summary')?.textContent||region.closest('section')?.querySelector('h2, h3')?.textContent;
      const attrs=scrollRegionAttributes({kind,caption:caption?.textContent,context,label:region.getAttribute('aria-label'),labelledBy:region.getAttribute('aria-labelledby')});
      for(const [name,value]of Object.entries(attrs))if(region.getAttribute(name)!==value)region.setAttribute(name,value);
    }
  }
  prepare(article);
  // Ignore text-only animation updates; prepare only newly inserted block trees.
  const observer=new Observer(records=>{
    if(disposed)return;
    for(const record of records)for(const node of record.addedNodes)if(node.nodeType===1)prepare(node);
  });
  observer.observe(article,{childList:true,subtree:true});
  article.addEventListener('atlas-reader-dispose',()=>{disposed=true;observer.disconnect();},{once:true});
}
