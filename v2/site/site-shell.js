import {latestAtlasPublished} from './publication.js';
import {makeTree,findNode,name} from './navigation.js';
import {rank} from './search.js';
import {mountFileExplorer} from './file-explorer.js';
import {mountDenseReaders,disposeDenseReaders} from './readers/index.js';
import {captureReaderState,restoreReaderState,readerRevisionMatches} from './reader-history.js';
import {updatePageMetadata,noteMetadata} from './page-metadata.js';

const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const noteURL=slug=>slug?'/atlas/'+slug+'/':'/atlas/';
export function explorerNoteURL({slug,path=[],query=''}){
  const params=new URLSearchParams();
  if(path.length)params.set('path',path.join('/'));
  if(query)params.set('q',query);
  return noteURL(slug)+(params.size?'?'+params:'');
}
const date=value=>new Date(value+'T12:00:00Z').toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'});
export function renderHome(notes){
  const latest=latestAtlasPublished(notes);
  const cards=latest.map((n,i)=>`<a class="floating-page" href="${noteURL(n.slug)}" data-position="${i===0?'center':i===1?'right':'left'}" aria-roledescription="slide" aria-label="${escape(n.title)}, ${i+1} of ${latest.length}"><span>${escape(name(n.topicPath[0]))} · <time datetime="${n.date}">${date(n.date)}</time></span><h3>${escape(n.title)}</h3><p class="carousel-description">${escape(n.description)}</p><strong class="carousel-cta">Open note →</strong></a>`).join('');
  const projects=[['MagNav','Neural calibration of airborne magnetic signals.','MagNav'],['Looped Transformer','Architectures that reuse their depth.','Looped-Transformer'],['SigReg Kernel','GPU kernels for Gaussian regularization.','SigReg-Kernel']];
  const magnet=`<svg class="magnet-art" viewBox="0 0 600 290" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="1">${Array.from({length:15},(_,i)=>`<path d="M-30 ${i*22} C150 ${290-i*10},300 ${-70+i*12},630 ${i*22}" opacity="${.15+i*.035}"/>`).join('')}</g><circle cx="300" cy="144" r="24" fill="currentColor"/><path d="M290 144h20m-10-10v20" stroke="var(--project-bg)" stroke-width="2"/></svg>`;
  const work=projects.map(([title,description,repo],i)=>`<a class="work-item work-${i}" href="https://github.com/naatyu/${repo}"><span class="work-index">0${i+1}</span>${i===0?magnet:`<div class="work-symbol" aria-hidden="true">${i===1?'↻':'Σ'}</div>`}<div class="work-copy"><h3>${title}</h3><p>${description}</p><span>View project ↗</span></div></a>`).join('');
  return `<header class="topbar"><nav aria-label="Main navigation"><a href="/" aria-current="page">Home</a><a href="/atlas/">Atlas</a><a href="#projects">Work</a><button data-open-search>Search <kbd>⌘ K</kbd></button></nav></header>
  <main id="main" class="gallery-home"><section class="gallery-hero"><h1>Nathan Laoué.</h1><p class="hero-mantra"><span>Learn</span><span class="mantra-arrow" aria-hidden="true">→</span><span>Build</span><span class="mantra-arrow" aria-hidden="true">→</span><span>Repeat</span><span class="mantra-loop" aria-hidden="true">↺</span></p><div class="hero-actions"><a class="primary-button" href="/atlas/">Explore the Atlas</a><a href="#projects">Discover my work ↗</a></div>
  <div class="carousel-intro"><span class="kicker">From my atlas</span><h2>Last published notes</h2><p>The latest additions to my personal notebook.</p></div><div class="gallery-object live-carousel note-carousel" role="region" aria-roledescription="carousel" aria-label="Last published notes">${cards}<div class="carousel-controls"><button aria-label="Previous preview">←</button><span aria-live="polite">Note 1 / ${latest.length}</span><button aria-label="Next preview">→</button></div></div></section>
  <section id="projects" class="work-section"><div class="section-heading"><div><span class="kicker">Selected work</span><h2>From idea to implementation.</h2></div><a href="https://github.com/naatyu">GitHub ↗</a></div><div class="work-items">${work}</div></section><section class="publication"><span class="kicker">Published research · IEEE / 2023</span><a href="https://ieeexplore.ieee.org/document/10189964">Neural Network Calibration of Airborne Magnetometers ↗</a></section></main>
  <footer><span>Nathan Laoué</span><a href="https://github.com/naatyu">GitHub ↗</a></footer><dialog id="search-dialog" aria-labelledby="search-title"><div class="dialog-top"><h2 id="search-title">Find an idea</h2><button aria-label="Close search">✕</button></div><label for="global-search">Search the Atlas</label><input id="global-search" type="search" placeholder="Try ‘mixture of exparts’…"><div id="global-results"></div></dialog>`;
}

function mountHome(notes){
  const carousel=document.querySelector('.note-carousel');
  const cards=[...carousel.querySelectorAll('.floating-page')];let active=0;
  const draw=()=>{cards.forEach((card,i)=>{card.dataset.position=i===active?'center':i===(active+1)%cards.length?'right':'left';card.inert=i!==active;});carousel.querySelector('[aria-live]').textContent=`Note ${active+1} / ${cards.length}`;};
  const move=delta=>{active=(active+delta+cards.length)%cards.length;draw();};
  carousel.querySelector('[aria-label="Previous preview"]').addEventListener('click',()=>move(-1));
  carousel.querySelector('[aria-label="Next preview"]').addEventListener('click',()=>move(1));
  carousel.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();move(e.key==='ArrowRight'?1:-1);}});draw();
  const dialog=document.querySelector('#search-dialog'),input=dialog.querySelector('input'),results=dialog.querySelector('#global-results');
  let opener;
  const search=()=>{results.innerHTML=rank(notes,input.value).slice(0,12).map(({note})=>`<a class="search-result" href="${noteURL(note.slug)}"><h3>${escape(note.title)}</h3><p>${escape(note.description)}</p></a>`).join('')||'<p>No matching notes.</p>';};
  const open=()=>{opener=document.activeElement;search();dialog.showModal();input.focus();};
  document.querySelector('[data-open-search]').addEventListener('click',open);
  document.addEventListener('keydown',e=>{if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'){e.preventDefault();open();}});
  dialog.querySelector('button').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('close',()=>opener?.focus({preventScroll:true}));input.addEventListener('input',search);
}

export async function mountSite(){
  if(!['home','atlas'].includes(document.body.dataset.sitePage)){mountDenseReaders(document);return;}
  const response=await fetch('/search.json');
  if(!response.ok)throw new Error('Atlas index unavailable');
  const notes=await response.json();
  if(document.body.dataset.sitePage==='home'){mountHome(notes);return;}
  const root=makeTree(notes),initial=document.querySelector('.atlas-page article');
  const initialSlug=document.body.dataset.noteSlug||'';
  const returning=performance.getEntriesByType('navigation')[0]?.type==='back_forward';
  document.body.dataset.atlasRestoration='fresh';
  let saved=returning?history.state?.atlasReading:null;
  if(!readerRevisionMatches(initial,initialSlug,saved))saved=null;
  const remember=(pane,slug)=>{const reading=captureReaderState(pane,slug);if(reading)history.replaceState({...history.state,atlasReading:reading},'');};
  const cache=new Map(initial?[[initialSlug,initial.outerHTML]]:[]);
  const params=new URL(location.href).searchParams;
  const requested=(params.get('path')||'').split('/').filter(Boolean);
  const path=params.has('path')&&findNode(root,requested)?requested:notes.find(n=>n.slug===initialSlug)?.topicPath||[];
  const readerContent=slug=>{
    const meta=notes.find(n=>n.slug===slug);
    if(meta)updatePageMetadata(document,noteMetadata(meta));
    if(cache.has(slug))return cache.get(slug);
    if(!notes.some(n=>n.slug===slug))return '<p>Note not found.</p>';
    return fetch(noteURL(slug)).then(async result=>{
      if(!result.ok)throw new Error('Note unavailable');
      const page=new DOMParser().parseFromString(await result.text(),'text/html');
      const article=page.querySelector('article');
      if(!article)throw new Error('Note content unavailable');
      cache.set(slug,article.outerHTML);return article.outerHTML;
    });
  };
  document.body.dataset.atlasFull='true';
  mountFileExplorer({state:{path,slug:initialSlug},notes,root,readerContent,palette:'skywine',
    initialQuery:params.get('q')||'',
    // Use the same native history boundary as ordinary canonical note links.
    // Replacing a path in-place leaves hash-history entries with stale readers.
    navigateNote:state=>location.assign(explorerNoteURL(state)),
    url:(view,extra={})=>view==='home'?'/':noteURL(extra.slug),
    locationForState:({selected})=>noteURL(selected)+location.hash,
    initialExplorerVisible:saved?.slug===initialSlug?saved.explorerVisible:undefined,
    onNoteLeave:remember,
    onReaderReady:(pane,slug)=>{if(saved?.slug===slug){const restored=restoreReaderState(pane,slug,saved);saved=null;if(restored)document.body.dataset.atlasRestoration='history';return restored;}return false;}});
  // BFCache preserves the live DOM and listeners. Pause playback, but do not
  // permanently dispose controls that the browser will later restore.
  addEventListener('pagehide',e=>{
    document.body.dataset.atlasLifecycle=e.persisted?'suspended':'disposed';
    const slug=location.pathname.replace(/^\/atlas\//,'').replace(/\/$/,'');
    remember(document.querySelector('.explorer-preview-content'),slug);
    if(e.persisted){for(const article of document.querySelectorAll('article'))article.dispatchEvent(new Event('atlas-reader-suspend'));}
    else disposeDenseReaders(document);
  });
  addEventListener('pageshow',e=>{if(e.persisted){document.body.dataset.atlasRestoration='bfcache';document.body.dataset.atlasLifecycle='active';}});
}
