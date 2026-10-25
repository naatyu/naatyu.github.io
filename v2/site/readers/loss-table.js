import {table as baseTable} from './topic-tools.js';
const attribute=text=>String(text).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
// Three-column comparisons need readable columns on narrow reading panes.
export const table=(caption,heads,rows)=>baseTable(caption,heads,rows)
  .replace('class="dense-table-wrap"',`class="dense-table-wrap" tabindex="0" role="region" aria-label="${attribute(caption)}"`)
  .replace('<table>','<table style="min-width:640px">');
