import {findNode,name,immediateNotes} from './navigation.js';
import {rank} from './search.js';
import {mountDenseReaders,disposeDenseReaders} from './readers/index.js';
import {createReaderLoader} from './reader-loader.js';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const folderIcon='<svg viewBox="0 0 32 28" width="28" height="25" aria-hidden="true"><path d="M3 6h10l3 4h13v14H3Z" fill="#bad6ef70" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/><path d="M3 10h26" stroke="currentColor" stroke-width="1.4"/></svg>';
const noteIcon='<svg viewBox="0 0 26 30" width="23" height="27" aria-hidden="true"><path d="M4 2h12l6 6v20H4Z" fill="#bad6ef25" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/><path d="M16 2v7h6M8 14h10M8 18h10M8 22h6" fill="none" stroke="currentColor" stroke-width="1.3"/></svg>';
let explorerVisible=true;
export const readingBlocks='.dense-note-header,.dense-section>h2,.dense-section>p,.dense-section>figure,.dense-section>.topic-scene,.dense-section>.dense-table-wrap,.dense-section>details,.dense-section>header,.dense-section>label,.dense-section>pre,.dense-section>ul,.dense-section>ol,.decision-explorer>[data-decision-results],.decision-explorer>[data-decision-body]>*';

// Preserve the visible reading block when a layout change reflows earlier text.
// Keep the existing DOM and controls: this is not a section jump or reader remount.
export function readingBookmark(pane){
  if(!pane)return null;
  const bounds=pane.getBoundingClientRect();
  const anchor=[...pane.querySelectorAll(readingBlocks)].find(el=>{
    const r=el.getBoundingClientRect();
    return r.bottom>r.top&&r.bottom>bounds.top&&r.top<bounds.bottom;
  });
  return anchor?{anchor,offset:anchor.getBoundingClientRect().top-bounds.top}:null;
}
export function restoreReadingBookmark(pane,bookmark){
  if(pane&&bookmark&&bookmark.anchor.isConnected!==false)pane.scrollTop+=bookmark.anchor.getBoundingClientRect().top-pane.getBoundingClientRect().top-bookmark.offset;
}
export function preserveReadingPosition(pane,changeLayout){
  const bookmark=readingBookmark(pane);
  changeLayout();
  restoreReadingBookmark(pane,bookmark);
}

// Remember before reflow, not from the already-resized viewport. Scroll events
// generated during resizing must not overwrite the pre-resize reading block.
export function watchReadingReflow(pane,article,Observer=globalThis.ResizeObserver){
  if(!pane||!article||!Observer)return ()=>{};
  let bookmark=readingBookmark(pane),bounds=pane.getBoundingClientRect(),stopped=false;
  const sameSize=next=>next.width===bounds.width&&next.height===bounds.height;
  const remember=()=>{if(!stopped&&sameSize(pane.getBoundingClientRect()))bookmark=readingBookmark(pane);};
  const observer=new Observer(()=>{
    if(stopped)return;
    if(!pane.isConnected){stop();return;}
    const next=pane.getBoundingClientRect();
    if(!sameSize(next))restoreReadingBookmark(pane,bookmark);
    bounds=next;bookmark=readingBookmark(pane);
  });
  function stop(){if(stopped)return;stopped=true;observer.disconnect();pane.removeEventListener('scroll',remember);pane.removeEventListener('focusin',remember);article.removeEventListener('atlas-reader-dispose',stop);}
  pane.addEventListener('scroll',remember,{passive:true});
  // Keyboard selection can redraw a scene without changing scrollTop.
  pane.addEventListener('focusin',remember);
  article.addEventListener('atlas-reader-dispose',stop,{once:true});
  observer.observe(pane);
  return stop;
}

// Directory contents are immediate children; search deliberately spans the atlas.
export function folderEntries(root,path){
  const node=findNode(root,path)||root;
  return {folders:[...node.children.values()].sort((a,b)=>name(a.id).localeCompare(name(b.id))),notes:immediateNotes(root,path).sort((a,b)=>a.title.localeCompare(b.title))};
}
export function mountFileExplorer({state,notes,root,url,readerContent,palette,locationForState,onReaderReady,onNoteLeave,initialExplorerVisible,navigateNote,initialQuery=''}){
  const main=document.querySelector('.atlas-page');
  let path=findNode(root,state.path)?[...state.path]:[],selected=state.slug,query=initialQuery,layout='list';
  let trail=[{path:[...path],query}],cursor=0;
  main.innerHTML=`<div class="terminal-workbench file-workbench"><section class="file-manager explorer-pane" id="file-manager" aria-label="Atlas file explorer">
    <div class="file-brand"><span class="file-brand-icon" aria-hidden="true">▱</span><div><strong>Atlas</strong><small>My personal notebook</small></div></div>
    <div class="file-navigation"><button data-nav="back" aria-label="Back" title="Back">←</button><button data-nav="forward" aria-label="Forward" title="Forward">→</button><button data-nav="up" aria-label="Parent folder" title="Parent folder">↑</button><nav class="file-breadcrumbs" aria-label="Folder path"></nav></div>
    <div class="file-tools"><label class="file-search"><span aria-hidden="true">⌕</span><input type="search" aria-label="Search atlas" placeholder="Search all notes…" autocomplete="off"></label><button class="file-view" aria-label="Switch to grid view" title="Switch to grid view">▦</button></div>
    <div class="file-body"><nav class="file-sidebar" aria-label="Atlas folders"></nav><div class="file-directory"><div class="file-heading"></div><div class="file-entries"></div></div></div>
    <div class="file-status" role="status"></div></section><section class="explorer-preview" aria-label="Note"><div class="explorer-preview-content"></div></section></div>
    <div class="atlas-utility"><a aria-label="Home" title="Home" href="${esc(url('home')+(locationForState?'':'&palette='+palette))}"><span aria-hidden="true">⌂</span><span>Home</span></a><button class="terminal-switch file-switch" aria-controls="file-manager"><span aria-hidden="true">▱</span><span>Explorer</span><i aria-hidden="true"></i></button></div>`;
  const work=main.querySelector('.file-workbench'),entries=main.querySelector('.file-entries'),search=main.querySelector('.file-search input'),toggle=main.querySelector('.file-switch');
  search.value=query;
  function sync(){const u=new URL(locationForState?locationForState({selected,path}):location.href,location.href);if(!locationForState){u.searchParams.set('explorer','files');if(selected)u.searchParams.set('slug',selected);else u.searchParams.delete('slug');}if(path.length)u.searchParams.set('path',path.join('/'));else u.searchParams.delete('path');if(locationForState){if(query)u.searchParams.set('q',query);else u.searchParams.delete('q');}window.history.replaceState(window.history.state,'',u);window.dispatchEvent(new Event('atlas-query-sync'));}
  function move(next,nextQuery=''){
    if(!findNode(root,next))return;
    path=[...next];query=nextQuery;search.value=query;
    trail=trail.slice(0,cursor+1);trail.push({path:[...path],query});cursor++;draw();sync();entries.querySelector('button')?.focus({preventScroll:true});
  }
  function open(slug){onNoteLeave?.(main.querySelector('.explorer-preview-content'),selected);if(navigateNote){navigateNote({slug,path:[...path],query});return;}selected=slug;window.history.replaceState(window.history.state,'',location.pathname+location.search);sync();preview();draw();[...entries.querySelectorAll('[data-note]')].find(b=>b.dataset.note===slug)?.focus({preventScroll:true});}
  let restoredInitialPosition=false;
  const pane=main.querySelector('.explorer-preview-content');
  const loadPreview=createReaderLoader({
    isConnected:()=>pane.isConnected,
    onLoading:()=>{pane.innerHTML='<p role="status">Loading note…</p>';pane.scrollTop=0;},
    onReady:populate,
    onError:()=>{disposeDenseReaders(main);pane.innerHTML='<p role="alert">The note could not be loaded. Open it again to retry.</p>';}
  });
  function preview(){
    disposeDenseReaders(main);
    loadPreview(()=>selected?readerContent(selected):'<div class="file-empty-preview"><span aria-hidden="true">▤</span><h1>Your atlas, one folder at a time.</h1><p>Choose a note to open it here.</p></div>');
  }
  function populate(html){
    pane.innerHTML=html;
    mountDenseReaders(main);pane.scrollTop=0;
    for(const summary of pane.querySelectorAll('.dense-jump summary')){summary.setAttribute('aria-label','On this page');summary.title='On this page';const icon=summary.querySelector('span');if(icon){icon.classList.add('section-jump-icon');icon.textContent='≡';}summary.parentElement.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();e.stopPropagation();summary.parentElement.open=false;summary.focus({preventScroll:true});}});}
    for(const a of pane.querySelectorAll('a')){if(a.getAttribute('href')?.startsWith('#'))continue;const u=new URL(a.href,location.href);if(u.origin===location.origin&&u.pathname.endsWith('/directions.html')){u.searchParams.set('design','gallery');u.searchParams.set('view','atlas');u.searchParams.set('palette',palette);u.searchParams.set('explorer','files');a.href=u;}}
    restoredInitialPosition=Boolean(onReaderReady?.(pane,selected));
    watchReadingReflow(pane,pane.querySelector('article'));
  }
  function draw(){
    const {folders,notes:files}=folderEntries(root,path),results=query.trim()?rank(notes,query).map(r=>r.note):files;
    const crumbs=main.querySelector('.file-breadcrumbs');crumbs.innerHTML='<button data-depth="0">Atlas</button>'+path.map((id,i)=>`<span aria-hidden="true">›</span><button data-depth="${i+1}">${esc(name(id))}</button>`).join('');
    crumbs.querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>move(path.slice(0,Number(b.dataset.depth)))));
    main.querySelector('[data-nav=back]').disabled=cursor===0;main.querySelector('[data-nav=forward]').disabled=cursor===trail.length-1;main.querySelector('[data-nav=up]').disabled=!path.length;
    const sidebar=main.querySelector('.file-sidebar');
    sidebar.innerHTML='<small>LOCATIONS</small><button data-location="" '+(!path.length?'aria-current="location"':'')+'><span aria-hidden="true">⌂</span> Atlas</button>'+[...root.children.values()].map(n=>`<button data-location="${esc(n.id)}" ${path[0]===n.id?'aria-current="location"':''}><span aria-hidden="true">▱</span>${esc(name(n.id))}</button>`).join('');
    sidebar.querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>move(b.dataset.location?b.dataset.location.split('/'):[])));
    main.querySelector('.file-heading').textContent=query.trim()?`Search results for “${query}”`:path.length?name(path.at(-1)):'Atlas';
    entries.dataset.layout=layout;
    entries.innerHTML=(!query.trim()?folders.map(n=>`<button class="file-entry folder-entry" data-folder="${esc(n.id)}"><span class="file-icon" aria-hidden="true">▱</span><span><strong>${esc(name(n.id))}</strong><small>${n.notes.length} notes · folder</small></span><span class="file-entry-end" aria-hidden="true">›</span></button>`).join(''):'')+results.map(n=>`<button class="file-entry note-entry" data-note="${esc(n.slug)}" ${selected===n.slug?'aria-current="true"':''}><span class="file-icon" aria-hidden="true">▤</span><span><strong>${esc(n.title)}</strong><small>${esc(query.trim()?n.browsePath.map(name).join(' / '):n.description||'Note')}</small></span><span class="file-entry-end" aria-hidden="true">↗</span></button>`).join('');
    if(!entries.children.length)entries.innerHTML='<p class="file-no-results">'+(query.trim()?'No matching notes. Try a different word.':'This folder is empty.')+'</p>';
    entries.querySelectorAll('.folder-entry .file-icon').forEach(el=>el.innerHTML=folderIcon);
    entries.querySelectorAll('.note-entry .file-icon').forEach(el=>el.innerHTML=noteIcon);
    entries.querySelectorAll('[data-folder]').forEach(b=>b.addEventListener('click',()=>move([...path,b.dataset.folder])));
    entries.querySelectorAll('[data-note]').forEach(b=>b.addEventListener('click',()=>open(b.dataset.note)));
    main.querySelector('.file-status').textContent=query.trim()?`${results.length} matching notes · entire atlas`:`${folders.length} folders · ${files.length} notes in this folder`;
  }
  main.querySelectorAll('[data-nav]').forEach(b=>b.addEventListener('click',()=>{const direction=b.dataset.nav;if(direction==='up')return move(path.slice(0,-1));cursor+=direction==='back'?-1:1;const item=trail[cursor];path=[...item.path];query=item.query;search.value=query;draw();sync();}));
  search.addEventListener('input',()=>{query=search.value;trail[cursor]={path:[...path],query};draw();if(locationForState)sync();});
  search.addEventListener('keydown',e=>{if(e.key==='Escape'){search.value='';query='';trail[cursor]={path:[...path],query};draw();if(locationForState)sync();}});
  const view=main.querySelector('.file-view');view.addEventListener('click',()=>{layout=layout==='list'?'grid':'list';view.setAttribute('aria-label',`Switch to ${layout==='list'?'grid':'list'} view`);view.title=view.getAttribute('aria-label');view.textContent=layout==='list'?'▦':'☷';draw();});
  function visibility(visible){preserveReadingPosition(main.querySelector('.explorer-preview-content'),()=>{explorerVisible=visible;work.classList.toggle('preview-expanded',!visible);toggle.setAttribute('aria-pressed',String(visible));toggle.setAttribute('aria-label',visible?'Hide explorer':'Show explorer');toggle.title=visible?'Hide explorer':'Show explorer';});}
  toggle.addEventListener('click',()=>visibility(!explorerVisible));
  visibility(initialExplorerVisible??explorerVisible);draw();preview();sync();
  if(!restoredInitialPosition&&location.hash){const target=document.getElementById(decodeURIComponent(location.hash.slice(1)));target?.scrollIntoView({block:'start'});}
}
