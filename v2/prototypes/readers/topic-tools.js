export const section=(id,title,body)=>`<section id="${id}" class="dense-section"><h2>${title}</h2>${body}</section>`;
export const eq=(formula,caption)=>`<figure class="dense-equation"><div>${formula}</div><figcaption>${caption}</figcaption></figure>`;
export const table=(caption,heads,rows)=>`<div class="dense-table-wrap"><table><caption>${caption}</caption><thead><tr>${heads.map(h=>`<th scope="col">${h}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr>${r.map(c=>`<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
export const cite=(href,label)=>`<a href="${href}" target="_blank" rel="noopener">${label} ↗</a>`;
export function topic(meta,sections,deck,body){return `<article class="dense-note" data-dense-topic="${meta.slug}"><header class="dense-note-header"><span class="kicker">${meta.topicPath.join(' / ')}</span><h1>${meta.title}</h1><p class="dense-deck">${deck}</p><div class="dense-note-meta">Published ${meta.date} · Updated ${meta.updated} · Local reader draft</div></header><details class="dense-jump"><summary>On this page <span aria-hidden="true">⌄</span></summary><div class="dense-jump-panel"><label>Find a section<input type="search" data-section-filter placeholder="Find a concept…"></label><nav class="dense-toc" aria-label="Sections in ${meta.title}">${sections.map(([id,title])=>`<a href="#${id}">${title}</a>`).join('')}</nav></div></details>${body}</article>`;}
export function mountTopic(scope,slug,init){for(const article of scope.querySelectorAll(`[data-dense-topic="${slug}"]`)){if(article.dataset.mounted)continue;article.dataset.mounted='true';article.querySelector('[data-section-filter]').addEventListener('input',e=>{const q=e.target.value.toLowerCase();for(const a of article.querySelectorAll('.dense-toc a'))a.hidden=!a.textContent.toLowerCase().includes(q);});article.querySelector('.dense-toc').addEventListener('click',e=>{if(e.target.closest('a'))article.querySelector('.dense-jump').open=false;});init(article);}}
// Optional playback for a native range. Never autoplay; stop offscreen or on removal.
// Every state remains available through the keyboard-operable range in reduced motion.
export function rangePlayback(article,lab,draw,duration=16000,slider=lab.querySelector('input[type="range"]')){
  const play=lab.querySelector('[data-play]'),reset=lab.querySelector('[data-reset]');
  const motion=matchMedia('(prefers-reduced-motion: reduce)');let frame=0,start=0,origin=0,playing=false,disposed=false;
  const max=Number(slider.max),min=Number(slider.min);
  function stop(){playing=false;cancelAnimationFrame(frame);frame=0;if(play)play.textContent='Play';}
  article.addEventListener('atlas-reader-suspend',stop);
  function render(){draw(Number(slider.value));}
  function tick(now){if(!playing||disposed)return;const v=Math.min(max,origin+(now-start)*(max-min)/duration);slider.value=String(v);render();if(v>=max)stop();else frame=requestAnimationFrame(tick);}
  slider.addEventListener('input',()=>{stop();render();});
  if(play)play.addEventListener('click',()=>{if(motion.matches||disposed)return;if(playing){stop();return;}if(Number(slider.value)>=max)slider.value=String(min);origin=Number(slider.value);start=performance.now();playing=true;play.textContent='Pause';frame=requestAnimationFrame(tick);});
  if(reset)reset.addEventListener('click',()=>{stop();slider.value=String(min);render();});
  const changed=()=>{stop();if(play)play.hidden=motion.matches;};motion.addEventListener('change',changed);changed();
  const observer=new IntersectionObserver(entries=>{if(entries.some(e=>!e.isIntersecting))stop();});observer.observe(lab);
  article.addEventListener('atlas-reader-dispose',()=>{disposed=true;stop();observer.disconnect();motion.removeEventListener('change',changed);},{once:true});render();
  return {stop,render};
}
