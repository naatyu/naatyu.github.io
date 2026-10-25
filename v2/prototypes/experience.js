import {name,makeTree,findNode} from './navigation.js';
import {rank} from './search.js';

// Only category changes stay in-place. Opening a note remains normal navigation.
export function mountFinderNavigation(options){
  const main=document.querySelector('#main');
  const snapshot=()=>({y:window.scrollY,x:document.querySelector('.finder-columns')?.scrollLeft||0,q:document.querySelector('#atlas-search')?.value||'',sort:document.querySelector('#sort')?.value||'relevance'});
  const remember=()=>{const state=snapshot();history.replaceState({...history.state,finder:state},'');return state;};
  const render=(state,focusHref)=>{
    const next=finder(options);main.innerHTML=next.html;
    document.querySelector('#atlas-search').value=state.q;
    document.querySelector('#sort').value=state.sort;
    next.mount();
    const columns=document.querySelector('.finder-columns');columns.scrollLeft=state.x;
    const selected=[...main.querySelectorAll('a')].find(a=>a.getAttribute('href')===focusHref);
    selected?.focus({preventScroll:true});
    window.scrollTo({top:state.y,behavior:'instant'});
  };
  remember();
  main.addEventListener('click',event=>{
    if(event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
    const link=event.target.closest('a');if(!link||link.target||link.hasAttribute('download'))return;
    const url=new URL(link.href,location.href);
    if(url.origin!==location.origin||url.pathname!==location.pathname||url.searchParams.get('design')!==new URLSearchParams(location.search).get('design')||url.searchParams.get('view')!=='atlas'||url.hash)return;
    event.preventDefault();
    const state=remember();
    if(url.href!==location.href)history.pushState({finder:state},'',url);
    render(state,link.getAttribute('href'));
  });
  window.addEventListener('popstate',event=>{
    if(new URLSearchParams(location.search).get('view')==='atlas')render(event.state?.finder||snapshot());
  });
}

export function finder({notes,esc,href,noteHref}){
  const query=new URLSearchParams(location.search),collection=query.get('collection')||'';
  const root=makeTree(collection==='neetcode'?notes.filter(n=>n.tags.includes('neetcode')):notes);
  let path=(query.get('path')||'').split('/').filter(Boolean);
  if(!findNode(root,path))path=[];
  const node=findNode(root,path);
  const browseLink=(p,c=collection)=>`${href('atlas')}&path=${p.join('/')}${c?`&collection=${c}`:''}`;
  const columns=[];let parent=root;
  for(let depth=0;depth<=path.length;depth++){
    if(!parent.children.size)break;
    columns.push(`<nav class="finder-column" aria-label="${depth===0?'Domains':`${name(parent.id)} subcategories`}"><span class="finder-column-title">${depth===0?'Domains':name(parent.id)}</span>${[...parent.children.values()].map(child=>`<a href="${browseLink(child.path)}" ${path[depth]===child.id?'aria-current="true"':''}><span>${esc(name(child.id))}</span><small>${child.notes.length}</small><span aria-hidden="true">›</span></a>`).join('')}</nav>`);
    if(depth<path.length)parent=parent.children.get(path[depth]);
  }
  const rows=n=>`<a class="finder-note" href="${noteHref(n)}"><span class="note-kind">${n.prototype?'MAIN EXPLAINER · PROTOTYPE':n.slug.includes('model-reports')?'MODEL REPORT':'NOTE'}</span><h3>${esc(n.title)}</h3><p>${esc(n.description.slice(0,170))}</p><span>${n.prototype?'Start here →':'Read note →'}</span></a>`;
  const html=`<section class="finder-intro"><span class="eyebrow">The Atlas · Browse ideas, not folders</span><h1>A place for every question.</h1><p>Explore a subject. Find its foundations. Follow the details.</p></section><div class="finder-toolbar"><label class="search-field"><span aria-hidden="true">⌕</span><span class="sr-only">Search notes</span><input type="search" id="atlas-search" placeholder="Try MoE, or ‘mixture of exparts’…"></label><label class="sort-label">Sort <select id="sort"><option value="relevance">Relevance</option><option value="published">Latest published</option><option value="title">Title A–Z</option></select></label></div><div class="collection-tabs" aria-label="Browse subjects or a learning collection"><a href="${browseLink(path,'')}" ${!collection?'aria-current="true"':''}>All subjects</a><a href="${browseLink([],'neetcode')}" ${collection==='neetcode'?'aria-current="true"':''}>NeetCode learning path</a><span>Collections cross subjects; they aren’t separate content silos.</span></div><nav class="finder-breadcrumb" aria-label="Category breadcrumbs"><a href="${browseLink([])}">Atlas</a>${path.map((id,i)=>`<span aria-hidden="true">/</span><a href="${browseLink(path.slice(0,i+1))}">${name(id)}</a>`).join('')}</nav><div class="finder-frame"><div class="finder-columns">${columns.join('')}</div><div class="finder-context"><span class="eyebrow">${path.length?'Selected subject':'Start anywhere'}</span><h2>${path.length?name(node.id):'Follow your curiosity.'}</h2><p>${path.at(-1)==='moe'?'Start with the architecture, then explore routing, stability, and recurrent sparse layers.':collection?'A learning path through algorithm concepts and patterns—not a separate copy of those notes.':'Choose a category to reveal its subcategories. Your location stays in the address bar, so Back and shared links work.'}</p>${path.at(-1)==='moe'?`<a class="button" href="${href('moe')}">Open the main MoE explainer →</a>`:`<a class="context-feature" href="${href('atlas')}&path=ai/architectures/moe">Explore Mixture of Experts →</a><a class="context-feature" href="${href('dfs')}">Watch depth-first search →</a>`}</div></div><div class="finder-result-heading"><h2 id="results-title">${collection?'NeetCode collection':path.length?name(node.id):'All notes'}</h2><span id="result-count" role="status"></span></div><div id="finder-results" class="finder-results"></div><p class="prototype-caveat">Proposed browsing structure, not a completed editorial audit. Most notes still open the current site; MoE, routing, DFS, and entropy demonstrate the new reading experience.</p>`;
  const mount=()=>{
    const eligible=collection==='neetcode'?node.notes.filter(n=>n.tags.includes('neetcode')):node.notes;
    const update=()=>{
      const q=document.querySelector('#atlas-search').value.trim(),sort=document.querySelector('#sort').value;
      const searchPool=collection==='neetcode'?notes.filter(n=>n.tags.includes('neetcode')):notes;
      let results=rank(q?searchPool:eligible,q);
      document.querySelector('#results-title').textContent=q?'Search results':collection?'NeetCode collection':path.length?name(node.id):'All notes';
      if(sort==='title')results.sort((a,b)=>a.note.title.localeCompare(b.note.title));
      if(sort==='published')results.sort((a,b)=>(b.note.date||'').localeCompare(a.note.date||''));
      document.querySelector('#result-count').textContent=`${results.length} ${results.length===1?'entry':'entries'}${q?collection?' · across this collection':' · across the Atlas':''}`;
      document.querySelector('#finder-results').innerHTML=results.length?results.map(({note})=>rows(note)).join(''):`<div class="empty"><h3>No matching notes</h3><p>Try fewer words or leave the collection filter.</p><a class="button" href="${browseLink([],'')}">Browse all subjects →</a></div>`;
    };
    document.querySelector('#atlas-search').addEventListener('input',update);document.querySelector('#sort').addEventListener('change',update);update();
  };
  return {html,mount};
}

export function moePage(href){
  return `<div class="topic-reader"><nav class="finder-breadcrumb" aria-label="Breadcrumb"><a href="${href('atlas')}&path=ai">AI & Models</a><span>/</span><a href="${href('atlas')}&path=ai/architectures">Architectures</a><span>/</span><span>Mixture of Experts</span></nav><header class="topic-title"><span class="eyebrow">Main explainer · Navigation prototype</span><h1>More capacity.<br><em>Selective computation.</em></h1><p>Mixture of Experts replaces one dense transformation with a collection of expert networks and a router that selects which ones execute for each token.</p></header><section class="moe-diagram" aria-label="Conceptual top-2 routed MoE layer"><div class="diagram-token">Token representation x</div><span class="diagram-arrow">↓</span><div class="diagram-router">Router · choose top 2</div><div class="diagram-experts"><div class="selected-expert">Expert 1<br><small>selected</small></div><div>Expert 2<br><small>not selected</small></div><div class="selected-expert">Expert 3<br><small>selected</small></div><div>Expert 4<br><small>not selected</small></div></div><span class="diagram-arrow">↓</span><div class="diagram-token">Weighted combination of selected outputs</div><p>Conceptual example: four routed experts, two active. Experts 1 and 3 are illustrative choices, not measured assignments. No shared expert is shown.</p></section><section class="topic-explanation"><h2>One idea. Several questions.</h2><p>Stored capacity and per-token computation are different. Sparse routing activates a subset of experts, but the model still stores every expert’s parameters. Dispatch, communication, and expert batching also affect actual speed.</p><p>The main page builds the mental model. Deep dives answer the questions that follow without repeating the whole introduction.</p></section><section class="deep-dive-section"><span class="eyebrow">Go one level deeper</span><div class="deep-dive-grid"><a href="${href('routing')}"><span>01 / Mechanism</span><h2>Who gets each token?</h2><p>Separate expert selection from mixture weights, then understand why balancing is needed.</p><strong>Routing & load balancing →</strong></a><a href="https://naatyu.github.io/atlas/ai/training/optimization/moe-training-stability"><span>02 / Training</span><h2>Why do experts collapse?</h2><p>Explore optimizer scaling, padding hot spots, sensitive reductions, and the signals to monitor.</p><strong>Training stability ↗ · current note</strong></a><a href="https://naatyu.github.io/atlas/ai/architectures/transformers/moe-looped-language-models"><span>03 / Architecture</span><h2>What if layers repeat?</h2><p>A reused layer can choose different experts on different recurrent passes.</p><strong>Sparse looped models ↗ · current note</strong></a></div></section><p class="prototype-caveat">Based on the existing MoE routing, stability, and sparse-looped-model notes. This proposed main page does not merge or replace them. Full source evidence and specialized material remain in the original notes.</p></div>`;
}
export function routingPage(href){
  return `<div class="topic-reader narrow-topic"><nav class="finder-breadcrumb" aria-label="Breadcrumb"><a href="${href('atlas')}&path=ai/architectures/moe">Mixture of Experts</a><span>/</span><span>Routing</span></nav><a class="parent-note" href="${href('moe')}">← Main explainer: Mixture of Experts</a><header class="topic-title"><span class="eyebrow">Deep dive · Reading prototype</span><h1>Select.<br>Dispatch.<br><em>Combine.</em></h1><p>A router has two different jobs: choose which experts execute, and weight the selected outputs.</p></header><div class="routing-steps"><section><span>01 / Select</span><h2>Choose the active experts.</h2><p>Top-k index selection is discrete. It does not provide an ordinary task gradient to every unselected expert.</p></section><section><span>02 / Dispatch</span><h2>Group tokens by expert.</h2><p>Experts process buckets of tokens. If many tokens choose the same expert, workload and communication become imbalanced.</p></section><section><span>03 / Combine</span><h2>Weight the executed outputs.</h2><p>Continuous mixture weights carry task gradients through the selected paths. Balancing controls are additional mechanisms, not substitutes for this signal.</p></section></div><section class="topic-explanation"><h2>Selection scores are not always mixture weights.</h2><p>In the loss-free bias scheme described by your source note, dispatch uses corrected scores <code>sᵢ(x) + bᵢ</code>. The selected output weights come from the original affinity scores, not the corrected scores.</p><p>Underused experts get higher selection biases; overloaded experts get lower ones. This changes allocation without inserting those corrections into the output mixture weights. Perfectly equal dispatch counts alone do not establish better model quality.</p></section><div class="reader-next"><a href="${href('moe')}">↑ Back to the main idea</a><a href="https://naatyu.github.io/atlas/ai/training/optimization/moe-training-stability">Next: training stability ↗</a></div><p class="prototype-caveat">A short reading prototype, not a complete conversion. <a href="https://naatyu.github.io/atlas/ai/training/optimization/moe-routing-and-load-balancing">Read the full original note and its references ↗</a> for formulas, implementation variants, model-specific evidence, and limitations.</p></div>`;
}
const treeNodes=[['A',250,40],['B',130,135],['C',370,135],['D',65,240],['E',195,240],['F',370,240]];
const children={A:['B','C'],B:['D','E'],C:['F'],D:[],E:[],F:[]};
function dfsEvents(){const events=[],visited=[];function walk(id,stack){const next=[...stack,id];visited.push(id);events.push({id,stack:next,visited:[...visited],text:`Enter ${id}: record it before exploring its children.`});for(const child of children[id])walk(child,next);events.push({id,stack,visited:[...visited],text:`Return from ${id}: its children are finished; pop its call frame.`});}walk('A',[]);return events;}
export function dfsPage(href){
  return `<div class="topic-reader narrow-topic"><nav class="finder-breadcrumb" aria-label="Breadcrumb"><a href="${href('atlas')}&path=algorithms">Algorithms</a><span>/</span><a href="${href('atlas')}&path=algorithms/structures/trees">Trees</a><span>/</span><span>Depth-first search</span></nav><header class="topic-title"><span class="eyebrow">Pattern playground · NeetCode collection</span><h1>Follow a branch.<br><em>Then return.</em></h1><p>Depth-first search finishes a child’s subtree before moving to the next child. Step through the calls to see what “depth-first” actually means.</p></header><section class="dfs-playground"><span class="eyebrow">Conceptual tree · Preorder, left to right</span><svg viewBox="0 0 500 295" role="img" aria-label="Tree: A has children B and C; B has children D and E; C has child F"><g class="tree-lines"><path d="M250 40L130 135L65 240M130 135L195 240M250 40L370 135L370 240"/></g>${treeNodes.map(([id,x,y])=>`<g data-node="${id}" transform="translate(${x},${y})"><circle r="25"/><text text-anchor="middle" dy="6">${id}</text></g>`).join('')}</svg><div class="step-controls"><button id="dfs-prev">← Previous</button><span id="dfs-step"></span><button id="dfs-next">Next →</button><button id="dfs-reset">Reset</button></div><p id="dfs-message" role="status"></p><div class="dfs-state"><div><span>Active recursive calls · bottom → top</span><strong id="dfs-stack"></strong></div><div><span>Recorded order · preorder</span><strong id="dfs-visited"></strong></div></div></section><section class="topic-explanation"><h2>The call contract is the important part.</h2><p>In this example, processing happens on entry: preorder gives A → B → D → E → C → F. The active stack retains the ancestors needed to return after each child.</p><p>For a subtree-height calculation, process child results before returning to the parent instead. Changing when work happens gives preorder, inorder for binary trees, or postorder—not a different definition of depth-first traversal.</p><p>A tree does not require cycle handling along its parent-to-child edges. General graph DFS usually needs visited state to avoid repeatedly exploring cycles. For this traversal, time is O(n) and the recursive stack is O(h), where h is tree height.</p></section><div class="reader-next"><a href="${href('atlas')}&collection=neetcode">← NeetCode collection</a><a href="https://naatyu.github.io/atlas/interview-prep/neetcode-roadmap/trees">Full tree-pattern note ↗</a></div><p class="prototype-caveat">This sample visualizes one pattern from the current Trees note; it does not yet convert its other patterns or replace its source URL. Step controls are manual and keyboard-operable; there is no automatic animation.</p></div>`;
}
export function mountDfs(){
  const events=dfsEvents();let index=-1;
  const update=()=>{
    const event=events[index];document.querySelector('#dfs-step').textContent=`${index+1} / ${events.length}`;
    document.querySelector('#dfs-message').textContent=event?.text||'Start with an empty call stack. Next enters the root A.';
    document.querySelector('#dfs-stack').textContent=event?.stack.join(' → ')||'Empty';document.querySelector('#dfs-visited').textContent=event?.visited.join(' → ')||'Nothing recorded';
    document.querySelector('#dfs-prev').disabled=index<0;document.querySelector('#dfs-next').disabled=index===events.length-1;
    document.querySelectorAll('[data-node]').forEach(el=>{const id=el.dataset.node;el.classList.toggle('visited',event?.visited.includes(id)||false);el.classList.toggle('active',event?.stack.at(-1)===id);});
  };
  document.querySelector('#dfs-next').addEventListener('click',()=>{index=Math.min(events.length-1,index+1);update();});document.querySelector('#dfs-prev').addEventListener('click',()=>{index=Math.max(-1,index-1);update();});document.querySelector('#dfs-reset').addEventListener('click',()=>{index=-1;update();});update();
}
