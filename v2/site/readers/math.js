import katex from '../vendor/katex/katex-module.js';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
// Render at reader construction, in both Node and the browser. Invalid TeX is an error,
// not a red formula silently shipped to readers. MathML provides semantic math.
export function math(tex,display=false){return katex.renderToString(tex,{displayMode:display,throwOnError:true,strict:'error',trust:false,output:'htmlAndMathml'});}
export function texEq(tex,caption){return `<figure class="dense-equation typeset-equation" data-tex="${esc(tex)}"><div class="math-scroll" tabindex="0" role="region" aria-label="Equation">${math(tex,true)}</div><figcaption>${caption}</figcaption></figure>`;}
export const inlineMath=tex=>`<span class="inline-math">${math(tex)}</span>`;
