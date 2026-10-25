import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {parseFragment} from 'parse5';
import {diffusionReader,diffusionMeta,diffusionSections} from '../site/readers/diffusion.js';
import {assertGeneratedMarkup} from './check-generated-markup.mjs';

const html=assertGeneratedMarkup(diffusionReader(s=>'/atlas/'+s+'/'),'consistency reference');
const nodes=[];
function walk(n){nodes.push(n);for(const c of n.childNodes||[])walk(c);}
walk(parseFragment(html));
const attr=(n,k)=>n.attrs?.find(a=>a.name===k)?.value;
const text=n=>n.nodeName==='#text'?n.value:(n.childNodes||[]).map(text).join('');
const descendants=(n,tag)=>{const out=[];function visit(x){if(x.tagName===tag)out.push(x);for(const c of x.childNodes||[])visit(c);}visit(n);return out;};
const section=id=>{const n=nodes.find(n=>attr(n,'id')===id);assert(n,id);assert(diffusionSections.some(([key])=>key===id));return n;};
const boundary=section('consistency-boundary');
const formulas=descendants(boundary,'annotation').map(text);
assert(formulas.includes(String.raw`\begin{aligned}c_{\mathrm{skip}}(t)&=\frac{\sigma_{\mathrm{data}}^2}{(t-\varepsilon)^2+\sigma_{\mathrm{data}}^2}\\c_{\mathrm{out}}(t)&=\frac{\sigma_{\mathrm{data}}(t-\varepsilon)}{\sqrt{\sigma_{\mathrm{data}}^2+t^2}}\end{aligned}`));
for(const phrase of ['denominator still contains t, not t−ε','regardless of network weights','not measured model outputs'])assert(text(boundary).includes(phrase),phrase);
const rows=descendants(boundary,'tr').slice(1).map(r=>descendants(r,'td').map(text));
// Decimal arithmetic checks the actual displayed values independently of JS's
// binary operations, using the paper's exact decimal settings.
const expected=JSON.parse(execFileSync('python3',['-c',`from decimal import Decimal, localcontext
import json
with localcontext() as ctx:
    ctx.prec = 70
    eps, sigma = Decimal('0.002'), Decimal('0.5')
    rows = []
    for value in ['0.002', '0.1', '1', '80']:
        t = Decimal(value)
        skip = sigma**2 / ((t-eps)**2+sigma**2)
        output = sigma*(t-eps)/(sigma**2+t**2).sqrt()
        rows.append([value, format(skip, '.6f'), format(output, '.6f')])
    print(json.dumps(rows))`],{encoding:'utf8'}));
assert.deepEqual(rows,expected);
const evidence=section('consistency-evidence');
assert.deepEqual(descendants(evidence,'tr').slice(1).map(r=>descendants(r,'td').map(text)),[['CD','1','3.55'],['CD','2','2.93'],['CT','1','8.70'],['CT','2','5.83']]);
for(const phrase of ['consistency training (CT) randomly','Rectified Adam','without warmup, learning-rate decay or weight decay','not LSUN','not absence of mode collapse','not task-specific training','not latency'])assert(text(evidence).includes(phrase),phrase);
const continuous=text(section('consistency-continuous'));
for(const phrase of ['pseudo-objectives','values do not measure convergence','initializes both variants from EDM','not the random-initialized main experiment'])assert(continuous.includes(phrase),phrase);
assert.equal(diffusionMeta.date,'2026-06-11');assert.equal(diffusionMeta.updated,'2026-10-24');
console.log('Consistency reference: exact positive-cutoff coefficients, four Decimal-verified rendered rows, four source-transcribed FID rows, initialization/metric/pseudo-objective conditions and searchable destinations pass. Not neural benchmark replication.');
