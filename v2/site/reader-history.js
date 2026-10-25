import {readingBlocks,readingBookmark,restoreReadingBookmark} from './file-explorer.js';
import {captureReaderModels,validReaderModels,restoreReaderModels} from './readers/reader-state.js';

const signature=control=>[control.tagName,control.type||'',control.id||'',control.getAttribute('aria-label')||'',control.name||''].join('|');
const controlsIn=pane=>[...pane.querySelectorAll('article input,article select,article textarea')].filter(control=>!['password','file','hidden'].includes(control.type));
export function captureReaderState(pane,slug){
  const article=pane?.querySelector('article'),revision=article?.getAttribute('data-reader-revision');
  if(!article||!revision)return null;
  const blocks=[...pane.querySelectorAll(readingBlocks)],bookmark=readingBookmark(pane);
  // Version 3 uses the expanded reading-block index; v2 indices are not portable.
  return {version:3,slug,revision,models:captureReaderModels(article),scroll:pane.scrollTop,
    bookmark:bookmark?{index:blocks.indexOf(bookmark.anchor),offset:bookmark.offset}:null,
    controls:controlsIn(pane).map(control=>({signature:signature(control),value:control.value,checked:control.checked})),
    details:[...pane.querySelectorAll('article details')].map(detail=>detail.open),
    explorerVisible:!pane.closest('.file-workbench').classList.contains('preview-expanded')};
}
export function readerRevisionMatches(article,slug,saved){
  return Boolean(article&&saved&&saved.version===3&&saved.slug===slug&&saved.revision&&saved.revision===article.getAttribute('data-reader-revision'));
}
export function restoreReaderState(pane,slug,saved,dispatch=control=>{
  control.dispatchEvent(new Event('input',{bubbles:true}));control.dispatchEvent(new Event('change',{bubbles:true}));
}){
  const article=pane?.querySelector('article');
  if(!readerRevisionMatches(article,slug,saved)||!validReaderModels(article,saved.models))return false;
  const controls=controlsIn(pane);
  if(!Array.isArray(saved.controls)||saved.controls.length!==controls.length||controls.some((control,i)=>signature(control)!==saved.controls[i].signature))return false;
  // Change model controls first, then restore layout/scroll after their redraws.
  controls.forEach((control,i)=>{const state=saved.controls[i];control.value=state.value;if(typeof state.checked==='boolean')control.checked=state.checked;dispatch(control);});
  restoreReaderModels(article,saved.models);
  [...pane.querySelectorAll('article details')].forEach((detail,i)=>{if(typeof saved.details?.[i]==='boolean')detail.open=saved.details[i];});
  pane.scrollTop=Number.isFinite(saved.scroll)?Math.max(0,saved.scroll):0;
  const anchor=[...pane.querySelectorAll(readingBlocks)][saved.bookmark?.index];
  if(anchor&&Number.isFinite(saved.bookmark.offset))restoreReadingBookmark(pane,{anchor,offset:saved.bookmark.offset});
  return true;
}
