import {findNode,name,immediateNotes} from './navigation.js';
import {rank} from './search.js';
import {mountDfs} from './experience.js';
import {latestAtlasPublished} from './publication.js';
import {mountDenseReaders,disposeDenseReaders} from './readers/index.js';
import {mountFileExplorer} from './file-explorer.js';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const palettes={jade:['Jade','#216b58'],blue:['Blue','#3478f6'],burgundy:['Burgundy','#702b40'],skywine:['Burgundy / Baby Blue','#702b40'],butter:['Butter','#796322']};
let terminalIsVisible=true;
export function mountGalleryLab({state,notes,root,url,readerContent}){
  document.body.dataset.atlasFull='false';
  if(state.design!=='gallery')return;
  const params=new URLSearchParams(location.search);
  const requested=params.get('palette');
  const palette=Object.hasOwn(palettes,requested)?requested:['wine','oxblood','plum'].includes(requested)?'burgundy':'skywine';
  const mode=params.get('explorer')==='terminal'?'console':'files';
  document.body.dataset.atlasFull=String(state.view==='atlas');
  document.body.dataset.palette=palette;
  document.body.dataset.tonal='false';
  // Keep presentation choices when moving between pages, without changing corpus URLs.
  for(const a of document.querySelectorAll('#app a')){
    if(a.getAttribute('href')?.startsWith('#'))continue;
    const u=new URL(a.href,location.href);if(u.origin!==location.origin||!u.pathname.endsWith('/directions.html')||u.searchParams.get('design')!=='gallery')continue;
    u.searchParams.set('palette',palette);u.searchParams.set('explorer',mode);a.href=u;
  }
  const controls=document.createElement('section');controls.className='gallery-lab-controls';controls.setAttribute('aria-label','Gallery design options');
  const choice=(key,value)=>{const u=new URL(location.href);u.searchParams.set(key,value);return u.pathname+u.search;};
  controls.innerHTML='<div><span>Palette</span>'+Object.entries(palettes).map(([k,[label,color]])=>'<a href="'+choice('palette',k)+'" '+(k===palette?'aria-current="true"':'')+'><i style="background:'+color+'"></i>'+label+'</a>').join('')+'</div>';
  document.querySelector('.topbar').after(controls);
  controls.addEventListener('click',e=>{const a=e.target.closest('a');if(!a)return;const target=new URL(a.href,location.href);const key=a.closest('div')===controls.firstElementChild?'palette':'explorer';a.href=choice(key,target.searchParams.get(key));},true);
  const object=document.querySelector('.gallery-object');
  if(object){
    const intro=document.createElement('div');intro.className='carousel-intro';intro.innerHTML='<span class="kicker">From my atlas</span><h2>Last published notes</h2><p>The latest additions to my personal notebook.</p>';object.before(intro);
    object.classList.add('live-carousel','note-carousel');object.setAttribute('role','region');object.setAttribute('aria-roledescription','carousel');object.setAttribute('aria-label','Last published notes');
    const latest=latestAtlasPublished(notes);
    const cards=[...object.querySelectorAll('.floating-page')].flatMap((card,i)=>{const n=latest[i];if(!n){card.remove();return [];}const a=card.tagName==='A'?card:document.createElement('a');if(a!==card)card.replaceWith(a);a.href=url('atlas',{path:n.browsePath,slug:n.slug})+'&palette='+palette+'&explorer='+mode;const date=new Date(n.date+'T12:00:00Z').toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'});a.innerHTML='<span>'+esc(name(n.browsePath[0]))+' · <time datetime="'+esc(n.date)+'">'+esc(date)+'</time></span><h3>'+esc(n.title)+'</h3><p class="carousel-description">'+esc(n.description)+'</p><strong class="carousel-cta">Open note →</strong>';return [a];});let active=0;
    if(!cards.length){object.remove();intro.remove();return;}
    cards.forEach((card,i)=>{card.className='floating-page';card.setAttribute('aria-roledescription','slide');card.setAttribute('aria-label',latest[i].title+', '+(i+1)+' of '+cards.length);});
    const bar=document.createElement('div');bar.className='carousel-controls';bar.innerHTML='<button aria-label="Previous preview">←</button><span aria-live="polite"></span><button aria-label="Next preview">→</button>';object.append(bar);
    const draw=()=>{cards.forEach((card,i)=>{const position=i===active?'center':i===(active+1)%cards.length?'right':'left';card.dataset.position=position;card.inert=i!==active;});bar.querySelector('span').textContent='Note '+(active+1)+' / '+cards.length;bar.querySelectorAll('button').forEach(b=>b.disabled=cards.length<2);};
    bar.querySelectorAll('button').forEach((b,i)=>b.addEventListener('click',()=>{active=(active+(i?1:cards.length-1))%cards.length;draw();}));
    object.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();active=(active+(e.key==='ArrowRight'?1:cards.length-1))%cards.length;draw();}});
    draw();
  }
  if(state.view!=='atlas')return;
  if(mode==='files'){mountFileExplorer({state,notes,root,url,readerContent,palette});return;}
  const main=document.querySelector('.atlas-page');
  let path=[...state.path],selected=state.slug,history=[],historyIndex=0,displayed=[];
  const node=()=>findNode(root,path)||root;
  const cwd=()=>'/atlas'+(path.length?'/'+path.join('/'):'');
  const directNotes=()=>immediateNotes(root,path);
  main.innerHTML='<header class="atlas-title"><span class="kicker">The Atlas / '+(mode==='console'?'Console':'Navigator')+'</span><h1>'+(mode==='console'?'Follow your curiosity.':'Ideas within reach.')+'</h1><p>Browse by clicking, or use ls, cd, tree, search, and open. A knowledge explorer—not a real shell.</p></header><div class="terminal-workbench '+mode+'"><section class="explorer-pane"><div class="explorer-toolbar"><span>atlas / explorer</span><button id="go-parent">↑ Parent</button></div><div class="explorer-location"></div><div class="explorer-tree"></div><div class="command-log" role="log" aria-label="Command output"></div><form class="command-form"><label for="atlas-command"><span>atlas</span> <b>❯</b></label><input id="atlas-command" autocomplete="off" spellcheck="false" placeholder="Try: ls · cd ai · search moe" aria-describedby="command-hint"><button>Run ↵</button></form><p id="command-hint">Tab completes a folder · ↑ recalls commands · help lists commands</p></section><section class="explorer-preview" aria-label="Note preview"><header><span>Note preview</span><button id="full-preview">Expand ↗</button></header><div class="explorer-preview-content"></div></section></div><p class="prototype-label">Categorization is provisional. Existing notes have not been rewritten. Commands only browse this local catalog; they do not access your computer.</p>';
  const workbench=main.querySelector('.terminal-workbench'),tree=main.querySelector('.explorer-tree'),log=main.querySelector('.command-log'),input=main.querySelector('#atlas-command');
  const divider=document.createElement('div');divider.className='terminal-divider';divider.innerHTML='<span>Terminal</span><small>Command results appear below</small>';log.before(divider);
  main.querySelector('.explorer-toolbar>span').innerHTML='Current folder <strong id="terminal-path" aria-live="polite"></strong>';
  const finderToggle=document.createElement('button');finderToggle.id='toggle-finder';finderToggle.textContent='Show Finder';finderToggle.setAttribute('aria-expanded','false');finderToggle.setAttribute('aria-controls','atlas-filesystem');
  tree.id='atlas-filesystem';main.querySelector('.explorer-toolbar').append(finderToggle);
  finderToggle.type='button';
  finderToggle.addEventListener('click',()=>{const visible=workbench.classList.toggle('finder-visible');finderToggle.textContent=visible?'Terminal only':'Show Finder';finderToggle.setAttribute('aria-expanded',String(visible));if(!visible)input.focus({preventScroll:true});});
  main.querySelector('.atlas-title').remove();
  main.querySelector('.explorer-preview').id='note-pane';
  main.querySelector('.explorer-preview>header').remove();
  const promptUser=document.createElement('i');promptUser.className='prompt-user';promptUser.textContent='reader@atlas';main.querySelector('.command-form label').prepend(promptUser);
  main.querySelector('.command-form label>b').textContent='$';
  input.placeholder='';main.querySelector('.explorer-pane').id='terminal-pane';
  const terminalSwitch=document.createElement('button');terminalSwitch.className='terminal-switch';terminalSwitch.setAttribute('aria-controls','terminal-pane');
  const utility=document.createElement('div');utility.className='atlas-utility';
  const home=document.createElement('a');home.href=url('home')+'&palette='+palette;home.setAttribute('aria-label','Home');home.title='Home';home.innerHTML='<span aria-hidden="true">⌂</span><span>Home</span>';utility.append(home,terminalSwitch);main.append(utility);
  const locationBadge=document.createElement('div');locationBadge.className='terminal-location';locationBadge.append(main.querySelector('#terminal-path'));main.querySelector('.explorer-pane').prepend(locationBadge);
  main.querySelector('.command-form>button').remove();main.querySelector('.command-form').append(finderToggle);
  function setTerminalVisible(visible){
    terminalIsVisible=visible;
    workbench.classList.toggle('preview-expanded',!visible);workbench.classList.remove('note-hidden');
    terminalSwitch.innerHTML='<span aria-hidden="true">›_</span><span>Terminal</span><i aria-hidden="true"></i>';
    terminalSwitch.setAttribute('aria-pressed',String(visible));terminalSwitch.setAttribute('aria-label',visible?'Hide terminal':'Show terminal');
    if(visible)input.focus({preventScroll:true});else terminalSwitch.focus({preventScroll:true});
  }
  terminalSwitch.addEventListener('click',()=>setTerminalVisible(workbench.classList.contains('preview-expanded')));
  log.addEventListener('click',e=>{if(e.target===log&&!window.getSelection()?.toString())input.focus({preventScroll:true});});
  input.addEventListener('keydown',e=>{if(e.ctrlKey&&e.key.toLowerCase()==='l'){e.preventDefault();log.replaceChildren();}if(e.ctrlKey&&e.key.toLowerCase()==='c'&&!window.getSelection()?.toString()){e.preventDefault();if(input.value)output('^C');input.value='';}});
  const sync=()=>{const u=new URL(location.href);if(path.length)u.searchParams.set('path',path.join('/'));else u.searchParams.delete('path');u.searchParams.set('slug',selected);window.history.replaceState(window.history.state,'',u);window.dispatchEvent(new Event('atlas-query-sync'));};
  const output=text=>{const p=document.createElement('p');p.textContent=text;log.append(p);while(log.children.length>30)log.firstChild.remove();log.scrollTop=log.scrollHeight;};
  function resultOutput(list,folders=[]){displayed=list;const block=document.createElement('div');block.className='terminal-results';block.innerHTML=folders.map(n=>'<button data-result-folder="'+esc(n.path.join('/'))+'"><span>▸ '+esc(n.id)+'/</span><small>'+n.notes.length+' notes</small></button>').join('')+list.map((n,i)=>'<button data-result-note="'+esc(n.slug)+'"><small>'+String(i+1).padStart(2,'0')+'</small><span>'+esc(n.title)+'</span><b>↗</b></button>').join('');log.append(block);block.querySelectorAll('[data-result-note]').forEach(b=>b.addEventListener('click',()=>{selected=b.dataset.resultNote;const previous=displayed;preview();draw();displayed=previous;sync();}));block.querySelectorAll('[data-result-folder]').forEach(b=>b.addEventListener('click',()=>{path=b.dataset.resultFolder.split('/');draw();sync();output('/atlas/'+path.join('/'));}));log.scrollTop=log.scrollHeight;}
  const preview=()=>{disposeDenseReaders(main);main.querySelector('.explorer-preview-content').innerHTML=readerContent(selected);mountDenseReaders(main);for(const summary of main.querySelectorAll('.dense-jump summary')){summary.setAttribute('aria-label','On this page');summary.title='On this page';summary.parentElement.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();e.stopPropagation();summary.parentElement.open=false;summary.focus({preventScroll:true});}});const icon=summary.querySelector('span');if(icon){icon.classList.add('section-jump-icon');icon.textContent='≡';}}if(selected==='interview-prep/neetcode-roadmap/trees')mountDfs();for(const a of main.querySelectorAll('.explorer-preview-content a')){if(a.getAttribute('href')?.startsWith('#'))continue;const u=new URL(a.href,location.href);if(u.origin===location.origin&&u.pathname.endsWith('/directions.html')){u.searchParams.set('design','gallery');u.searchParams.set('view','atlas');u.searchParams.set('explorer',mode);u.searchParams.set('palette',palette);if(!u.searchParams.has('path'))u.searchParams.set('path',path.join('/'));a.href=u;}}};
  function draw(results){
    main.querySelector('#terminal-path').textContent=cwd();
    main.querySelector('.command-form label>span').textContent=cwd();
    const locationBar=main.querySelector('.explorer-location');locationBar.innerHTML='<button data-depth="0">atlas</button>'+path.map((id,i)=>'<span>/</span><button data-depth="'+(i+1)+'">'+esc(id)+'</button>').join('');locationBar.querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{path=path.slice(0,Number(b.dataset.depth));draw();sync();}));
    const list=results||node().notes;
    displayed=list;
    tree.innerHTML='<div class="filesystem-label">Folders</div><div class="tree-folders">'+[...node().children.values()].map(n=>'<button data-folder="'+esc(n.id)+'"><span>▸ '+esc(name(n.id))+' /</span><small>'+n.notes.length+'</small></button>').join('')+'</div><div class="tree-note-label">Files · '+list.length+' notes including subfolders</div>'+list.map((n,i)=>'<button data-note="'+esc(n.slug)+'" '+(selected===n.slug?'aria-current="true"':'')+'><small>◇</small><span>'+esc(n.title)+'</span><b>↗</b></button>').join('');
    tree.querySelectorAll('[data-folder]').forEach(b=>b.addEventListener('click',()=>{path.push(b.dataset.folder);draw();sync();output('$ cd '+b.dataset.folder);}));
    tree.querySelectorAll('[data-note]').forEach(b=>b.addEventListener('click',()=>{selected=b.dataset.note;preview();draw(results);sync();}));
  }
  function resolve(target){const parts=target.startsWith('/')?[]:[...path];for(const p of target.replace(/^\/atlas\/?/,'/').split('/')){if(!p||p==='.')continue;if(p==='..')parts.pop();else parts.push(p);}return findNode(root,parts)?parts:null;}
  function run(raw){
    const text=raw.trim();if(!text)return;history.push(text);historyIndex=history.length;output('reader@atlas:'+cwd()+' $ '+text);const [cmd,...args]=text.split(/\s+/),arg=args.join(' ').replace(/^["']|["']$/g,'');
    if(cmd==='help')output('ls — immediate folders and notes only\ncd <folder> | .. | / — move\npwd — current path\ntree — category hierarchy\nopen <number | title | slug> — preview note\nsearch <words> — fuzzy search the entire Atlas\nclear — clear output\nClick a result or use Show Finder to browse visually.');
    else if(cmd==='pwd')output(cwd());
    else if(cmd==='ls'){const files=directNotes();output(cwd()+'\n'+node().children.size+' folders · '+files.length+' notes in this folder');resultOutput(files,[...node().children.values()]);log.scrollTop=Math.max(0,log.lastElementChild.offsetTop-85);}
    else if(cmd==='cd'){const next=resolve(arg||'/');if(next){path=next;draw();sync();output(cwd());}else output('Folder not found. Use ls to see folder names.');}
    else if(cmd==='tree'){const lines=[];function walk(n,prefix='',depth=0){if(depth>5)return;for(const c of n.children.values()){lines.push(prefix+'└─ '+c.id+' ('+c.notes.length+')');walk(c,prefix+'   ',depth+1);}}walk(node());output(lines.join('\n')||'No subcategories. Use ls to see notes.');}
    else if(cmd==='search'){if(!arg){output('Usage: search <words>');return;}const matches=rank(notes,arg).map(r=>r.note);output(matches.length+' results · click to preview, or open <number>');resultOutput(matches);log.scrollTop=Math.max(0,log.lastElementChild.offsetTop-65);}
    else if(cmd==='open'||cmd==='cat'){const n=/^\d+$/.test(arg)?displayed[Number(arg)-1]:notes.find(n=>n.slug===arg||n.title.toLowerCase()===arg.toLowerCase())||rank(notes,arg)[0]?.note;if(n&&arg){selected=n.slug;const previous=displayed;preview();draw();displayed=previous;sync();output('Opened '+n.title);}else output('No note found. Use open <number>, title, or slug.');}
    else if(cmd==='clear')log.replaceChildren();
    else output('Unknown command. Type help. This is a catalog explorer, not a system terminal.');
  }
  main.querySelector('.command-form').addEventListener('submit',e=>{e.preventDefault();run(input.value);input.value='';});
  input.addEventListener('keydown',e=>{if(e.key==='ArrowUp'){e.preventDefault();historyIndex=Math.max(0,historyIndex-1);input.value=history[historyIndex]||'';}if(e.key==='ArrowDown'){e.preventDefault();historyIndex=Math.min(history.length,historyIndex+1);input.value=history[historyIndex]||'';}if(e.key==='Tab'){const m=input.value.match(/^cd ([^/]*)$/);if(m){const matches=[...node().children.keys()].filter(id=>id.startsWith(m[1]));if(matches.length===1){e.preventDefault();input.value='cd '+matches[0];}}}});
  main.querySelector('#go-parent').addEventListener('click',()=>{path.pop();draw();sync();});
  setTerminalVisible(terminalIsVisible);
  draw();preview();output('Atlas\nType help for commands.\nls lists this folder · search finds notes across the Atlas.');
}
