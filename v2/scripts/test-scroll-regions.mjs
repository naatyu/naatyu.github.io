import assert from 'node:assert/strict';
import {parseFragment} from 'parse5';
import {readerMetas,renderDenseReader} from '../prototypes/readers/index.js';
import {prepareStaticScrollRegions} from './scroll-regions-html.mjs';
import {mountScrollRegions,scrollRegionAttributes} from '../prototypes/readers/scroll-regions.js';
const attr=(node,name)=>node.attrs?.find(a=>a.name===name)?.value;
const walk=node=>[node,...(node.childNodes||[]).flatMap(walk)];
const text=node=>node.nodeName==='#text'?node.value:(node.childNodes||[]).map(text).join('');
let tables=0,code=0;
for(const meta of readerMetas){
  const source=renderDenseReader(meta.slug,s=>'/atlas/'+s),before=walk(parseFragment(source)),result=prepareStaticScrollRegions(source),after=walk(parseFragment(result));
  // Attribute preparation must not change code, equations, prose, IDs or links.
  assert.equal(text(parseFragment(result)),text(parseFragment(source)),meta.slug+' text changed');
  for(const tag of ['pre','math','a','caption'])assert.deepEqual(after.filter(n=>n.tagName===tag).map(n=>[text(n),attr(n,'href')]),before.filter(n=>n.tagName===tag).map(n=>[text(n),attr(n,'href')]),meta.slug+' '+tag);
  assert.deepEqual(after.map(n=>attr(n,'id')).filter(Boolean),before.map(n=>attr(n,'id')).filter(Boolean));
  assert.equal(prepareStaticScrollRegions(result),result,'Preparation must be idempotent');
  for(const node of after){
    if(node.tagName!=='pre'&&!(attr(node,'class')||'').split(' ').includes('dense-table-wrap'))continue;
    assert.equal(attr(node,'tabindex'),'0');assert.equal(attr(node,'role'),'region');
    assert((attr(node,'aria-label')||attr(node,'aria-labelledby')||'').trim());
    if(node.tagName==='pre')code++;else{
      tables++;
      const caption=walk(node).find(n=>n.tagName==='caption');
      if(caption&&!attr(node,'aria-labelledby'))assert.equal(attr(node,'aria-label'),text(caption).replace(/\s+/g,' ').trim());
    }
  }
}
const special=prepareStaticScrollRegions('<section><h2>Code &amp; conditions</h2><pre><code>x &lt; y</code></pre><div class="dense-table-wrap"><table><caption>A &quot;quoted&quot; &amp; named comparison</caption></table></div></section>');
assert.equal(attr(walk(parseFragment(special)).find(n=>n.tagName==='pre'),'aria-label'),'Code & conditions — code example');
assert.equal(attr(walk(parseFragment(special)).find(n=>n.tagName==='div'),'aria-label'),'A "quoted" & named comparison');
assert.equal(scrollRegionAttributes({kind:'code',labelledBy:'named-code'})['aria-label'],undefined);

// Minimal DOM facade tests observer lifecycle independently of a native browser.
function region(kind,caption='',label=''){
  const attrs=new Map(label?[['aria-label',label]]:[]);
  return {nodeType:1,tagName:kind==='code'?'PRE':'DIV',matches:()=>true,querySelectorAll:()=>[],querySelector:()=>caption?{textContent:caption}:null,closest:selector=>selector==='section'?{querySelector:()=>({textContent:'Mechanism'})}:null,getAttribute:n=>attrs.get(n)??null,setAttribute:(n,v)=>attrs.set(n,v),attrs};
}
const initial=region('table','Original table'),added=region('code'),listeners=new Map();
const article={querySelectorAll:()=>[initial],addEventListener:(n,fn)=>listeners.set(n,fn)};
let observer,constructed=0;
class Observer{constructor(fn){constructed++;this.callback=fn;observer=this;}observe(root,options){assert.equal(root,article);assert.deepEqual(options,{childList:true,subtree:true});}disconnect(){this.disconnected=true;}}
mountScrollRegions(article,Observer);mountScrollRegions(article,Observer);assert.equal(constructed,1);
assert.equal(initial.attrs.get('aria-label'),'Original table');assert.equal(initial.attrs.get('tabindex'),'0');
observer.callback([{addedNodes:[{nodeType:3},added]}]);assert.equal(added.attrs.get('aria-label'),'Mechanism — code example');
listeners.get('atlas-reader-dispose')();assert(observer.disconnected);
const late=region('code');observer.callback([{addedNodes:[late]}]);assert.equal(late.attrs.size,0);
console.log(`Scroll accessibility: ${readerMetas.length} readers, ${tables} comparison/diagram regions and ${code} code regions; exact content preservation, names, focus, idempotence, regenerated blocks and disposal pass. Native layout/keyboard checks remain separate.`);
