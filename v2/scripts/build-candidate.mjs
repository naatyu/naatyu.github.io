import path from 'node:path';
import os from 'node:os';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {mkdtemp, mkdir, readFile, writeFile, copyFile, realpath} from 'node:fs/promises';
import {parse} from 'acorn';
import {parseFragment} from 'parse5';
import {prepareStaticScrollRegions} from './scroll-regions-html.mjs';
import {createHash} from 'node:crypto';
import {readerMetas, renderDenseReader} from '../site/readers/index.js';
import {resolveReviewedNote, reviewedNavigation} from '../site/reviewed-navigation.js';
import {retiredNavigation, retirementNotice} from '../site/retired-navigation.js';
import {renderHome} from '../site/site-shell.js';
import {renderPageMetadata,noteMetadata} from '../site/page-metadata.js';

const repo = fileURLToPath(new URL('../../', import.meta.url));
const prototype = path.join(repo, 'v2/site');
const imageRoot = path.join(repo, 'static/img');
const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const styles = ['directions.css','gallery-lab.css','gallery-refinement.css','gallery-soft.css','atlas-workspace.css','atlas-terminal.css','file-explorer.css','dense-reader.css','readers/moe-visuals.css','readers/attention.css','readers/topic-labs.css','readers/collectives.css','readers/cuda.css','vendor/katex/katex.min.css','readers/math.css','reader-utilities.css'];
const route = slug => `/atlas/${slug}/`;
const faviconLinks = '<link rel="icon" href="/favicon.ico" sizes="16x16 32x32 48x48"><link rel="icon" type="image/svg+xml" href="/img/favicon.svg"><link rel="apple-touch-icon" href="/img/apple-touch-icon.png">';
function moduleReferences(text) {
  const ast = parse(text, {ecmaVersion:'latest',sourceType:'module'});
  const references = [];
  const queue = [ast];
  while (queue.length) {
    const node = queue.pop();
    if (['ImportDeclaration','ExportNamedDeclaration','ExportAllDeclaration'].includes(node.type) && node.source) references.push(node.source.value);
    if (node.type === 'ImportExpression') {
      if (node.source.type !== 'Literal') throw new Error('Dynamic import must have a static local destination');
      references.push(node.source.value);
    }
    for (const value of Object.values(node)) {
      if (Array.isArray(value)) queue.push(...value.filter(item => item && typeof item.type === 'string'));
      else if (value && typeof value.type === 'string') queue.push(value);
    }
  }
  return references;
}

// A separate, noindex review artifact. This never changes the live build/workflow.
// It intentionally reports legacy content dependencies instead of concealing them.
export async function buildCandidate() {
  const output = await mkdtemp(path.join(os.tmpdir(), 'atlas-v2-candidate-'));
  const metas = readerMetas.filter(meta => meta.visibility === 'public');
  if (metas.length !== readerMetas.length) throw new Error('Unexpected nonpublic reader in the implemented registry');
  const slugs = new Set(metas.map(meta => meta.slug));
  const legacyDependencies = new Map();
  const resources = new Map();
  const localAssets = new Set();
  const searchEntries = [];
  const canonicalPages = [];
  const inside = (root, target) => target.startsWith(root + path.sep);

  async function asset(source, destination) {
    if (resources.has(destination)) {
      if (resources.get(destination) !== source) throw new Error(`Asset collision: ${destination}`);
      return;
    }
    const resolved = await realpath(source);
    if (!inside(prototype, resolved) && !inside(imageRoot, resolved)) throw new Error(`Unsafe asset: ${source}`);
    if (!inside(output, path.resolve(output, destination))) throw new Error(`Unsafe destination: ${destination}`);
    resources.set(destination, source);
    await mkdir(path.dirname(path.join(output, destination)), {recursive:true});
    await copyFile(source, path.join(output, destination));
    if (source.endsWith('.js') || source.endsWith('.css')) {
      const text = await readFile(source, 'utf8');
      const references = source.endsWith('.js')
        ? moduleReferences(text)
        : [...text.matchAll(/url\(\s*['"]?([^'"\s)]+)['"]?\s*\)/g)].map(match => match[1]);
      for (const reference of references) {
        if (reference.startsWith('data:') || reference.startsWith('#')) continue;
        if (/^https?:/.test(reference)) throw new Error(`Remote runtime dependency: ${reference}`);
        if (!reference.startsWith('.') && source.endsWith('.js')) throw new Error(`Unbundled module: ${reference}`);
        const relative = reference.split(/[?#]/)[0];
        const dependency = path.resolve(path.dirname(source), relative);
        const target = path.posix.normalize(path.posix.join(path.posix.dirname(destination), relative));
        await asset(dependency, target);
      }
    }
  }

  const head = (title, description, mode='', slug='') => {
    const meta=slug?noteMetadata(metas.find(meta=>meta.slug===slug)):{title,description,path:mode==='home'?'/':mode==='atlas'?'/atlas/':null};
    return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex,nofollow">${faviconLinks}${renderPageMetadata(meta)}${styles.map(style => `<link rel="stylesheet" href="/assets/${style}">`).join('')}<link rel="stylesheet" href="/candidate.css"><script type="module" src="/runtime.js"></script></head><body data-design="gallery" data-palette="skywine" data-site-page="${mode}" data-note-slug="${escape(slug)}"><a class="skip-link" href="#main">Skip to content</a>`;
  };
  const tail = '</body></html>';
  async function page(relative, html) {
    await mkdir(path.dirname(path.join(output, relative)), {recursive:true});
    await writeFile(path.join(output, relative), html);
  }
  for (const meta of metas) {
    if (!/^[a-z0-9-]+\/[a-z0-9-]+$/.test(meta.slug)) throw new Error(`Unsafe reader slug: ${meta.slug}`);
    const dependencies = new Set();
    const link = requested => {
      const [slug, ...fragmentParts] = String(requested).split('#');
      const fragment = fragmentParts.join('#');
      const reviewed = resolveReviewedNote(slug, fragment ? '#' + fragment : '');
      const target = reviewed?.slug || slug;
      const anchor = reviewed?.anchor || fragment;
      if (slugs.has(target)) return route(target) + (anchor ? '#' + anchor : '');
      dependencies.add(slug);
      return `https://naatyu.github.io/atlas/${slug}${fragment ? '#' + fragment : ''}`;
    };
    const body = prepareStaticScrollRegions(renderDenseReader(meta.slug, link));
    if (!body || !body.includes('<h1>') || body.includes('katex-error')) throw new Error(`Invalid static reader: ${meta.slug}`);
    for (const match of body.matchAll(/\bsrc=['"]([^'"]+)['"]/g)) {
      const source = match[1];
      if (/^https?:/.test(source)) throw new Error(`Unpackaged remote media: ${meta.slug}: ${source}`);
      if (!source.startsWith('/img/')) throw new Error(`Unresolved media: ${meta.slug}: ${source}`);
      const relative = source.split(/[?#]/)[0].slice(5);
      await asset(path.resolve(imageRoot, relative), 'img/' + relative);
      localAssets.add(source);
    }
    legacyDependencies.set(meta.slug, [...dependencies].sort());
    const text=[];
    function semantic(node){
      if(['script','style','svg','math'].includes(node.tagName)||(node.attrs||[]).some(a=>a.name==='class'&&a.value.split(' ').includes('katex')))return;
      if(node.nodeName==='#text')text.push(node.value);
      for(const child of node.childNodes||[])semantic(child);
    }
    semantic(parseFragment(body));
    const {slug,title,description,date,updated,topicPath,tags,searchText,kind,visibility}=meta;
    searchEntries.push({slug,title,description,date,updated,topicPath,tags,kind,visibility,searchText:searchText+' '+text.join(' ').replace(/\s+/g,' ').trim()});
    canonicalPages.push({meta,body});
  }
  for (const style of styles) await asset(path.join(prototype, style), 'assets/' + style);
  await asset(path.join(prototype, 'readers/index.js'), 'assets/readers/index.js');
  await asset(path.join(prototype, 'site-shell.js'), 'assets/site-shell.js');
  await asset(path.join(prototype, 'reviewed-navigation.js'), 'assets/reviewed-navigation.js');
  await asset(path.join(imageRoot, 'favicon.svg'), 'img/favicon.svg');
  await asset(path.join(imageRoot, 'apple-touch-icon.png'), 'img/apple-touch-icon.png');
  // The root ICO is also requested automatically by older browsers.
  await copyFile(path.join(imageRoot, 'favicon.ico'), path.join(output, 'favicon.ico'));
  // Saved model state must not cross a change in content, code, styles or media.
  // Conservatively invalidate all readers when any packaged dependency changes.
  const runtimeHash=createHash('sha256');
  for(const [destination,source] of [...resources].sort(([a],[b])=>a.localeCompare(b))){runtimeHash.update(destination+'\0');runtimeHash.update(await readFile(source));runtimeHash.update('\0');}
  const runtimeRevision=runtimeHash.digest('hex');
  for(const {meta,body} of canonicalPages){
    const revision=createHash('sha256').update(runtimeRevision+'\0'+body).digest('hex');
    if(!body.includes('<article '))throw new Error('Missing revision-bearing article: '+meta.slug);
    const stamped=body.replace('<article ',`<article data-reader-revision="${revision}" `);
    const html=head(meta.title,meta.description,'atlas',meta.slug)+`<div id="app"><main id="main" class="atlas-page"><nav class="candidate-navigation" aria-label="Atlas navigation"><a href="/">Home</a><a href="/atlas/">Browse the Atlas</a></nav><div class="candidate-reader">${stamped}</div></main></div>`+tail;
    await page(`atlas/${meta.slug}/index.html`,html);
  }
  // Static hosting cannot issue HTTP redirects. These small landing pages
  // preserve reviewed deep links without publishing the historical articles.
  for (const [legacy, destination] of Object.entries(reviewedNavigation)) {
    if (!/^[a-z0-9-]+(?:\/[a-z0-9-]+)+$/.test(legacy) || slugs.has(legacy)) throw new Error(`Unsafe legacy route: ${legacy}`);
    if (!slugs.has(destination.slug)) throw new Error(`Missing reviewed destination: ${legacy}`);
    const href = route(destination.slug) + (destination.anchor ? '#' + destination.anchor : '');
    await page(`atlas/${legacy}/index.html`, `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex,nofollow">${faviconLinks}<title>Note moved · Nathan Laoué</title><script type="module" src="/legacy-route.js"></script></head><body data-legacy-slug="${escape(legacy)}"><main><h1>This note has moved</h1><p>Its content is now part of a consolidated topic.</p><a href="${escape(href)}">Read the updated note</a></main></body></html>`);
  }
  await page('legacy-route.js', `import {resolveReviewedNote} from '/assets/reviewed-navigation.js';\nconst target=resolveReviewedNote(document.body.dataset.legacySlug,location.hash);\nif(target)location.replace('/atlas/'+target.slug+'/'+(target.anchor?'#'+encodeURIComponent(target.anchor):''));\n`);
  // Intentional retirements must not pretend to be content-preserving redirects.
  for (const [slug, entry] of Object.entries(retiredNavigation)) {
    if (reviewedNavigation[slug] || slugs.has(slug)) throw new Error(`Retirement collision: ${slug}`);
    if (entry.related && !slugs.has(entry.related)) throw new Error(`Missing retirement reference: ${slug}`);
    const notice = retirementNotice(slug, target => target ? route(target) : '/atlas/', target => metas.find(meta => meta.slug === target).title);
    await page(`atlas/${slug}/index.html`, head('Page retired', 'This page is no longer published in the atlas.') + `<main id="main" class="candidate-index" data-retired-slug="${escape(slug)}">${notice}</main></body></html>`);
  }
  const groups = new Map();
  for (const meta of metas) {
    const group = meta.topicPath[0];
    if (!groups.has(group)) groups.set(group, []);
    groups.get(group).push(meta);
  }
  const index = [...groups].map(([group, entries]) => `<section><h2>${escape(group)}</h2><ul>${entries.map(meta => `<li><a href="${route(meta.slug)}">${escape(meta.title)}</a><p>${escape(meta.description)}</p></li>`).join('')}</ul></section>`).join('');
  await page('index.html', head('Research and engineering', 'Research, engineering, and a personal atlas of connected notes.', 'home') + `<div id="app">${renderHome(searchEntries)}</div>` + tail);
  await page('atlas/index.html', head('Atlas', 'Canonical atlas topics.', 'atlas') + `<div id="app"><main id="main" class="atlas-page"><div class="candidate-index"><h1>Atlas</h1>${index}</div></main></div>` + tail);
  // GitHub Pages can serve this document with a real 404 status. A generic
  // preview server may require explicit fallback configuration; do not fake
  // an unknown route by rendering a different note or redirecting to its top.
  await page('404.html', head('Page not found', 'This address does not match a page in the atlas.') + '<main id="main" class="candidate-index"><h1>Page not found</h1><p>This address does not match a page in the atlas.</p><nav aria-label="Find a page"><a href="/">Home</a> · <a href="/atlas/">Browse the Atlas</a></nav></main>' + tail);
  await page('runtime.js', `import {mountSite} from '/assets/site-shell.js';\nimport {mountDenseReaders} from '/assets/readers/index.js';\nmountSite().catch(()=>mountDenseReaders(document));\n`);
  await page('candidate.css', '.candidate-reader,.candidate-index{max-width:1160px;margin:auto;padding:24px clamp(16px,4vw,56px)}.candidate-navigation{display:flex;justify-content:space-between;gap:16px;padding:16px;color:var(--muted)}.candidate-navigation a{color:var(--accent)}.candidate-index ul{list-style:none;padding:0}.candidate-index li{padding:12px 0;border-bottom:1px solid var(--line)}.candidate-index a{color:var(--accent)}.candidate-index p{max-width:70ch}.candidate-reader .dense-jump{position:relative;top:auto;right:auto}.candidate-reader .dense-jump-panel{max-width:calc(100vw - 48px)}');
  // Never copy the historical catalog, internal audits, Markdown originals or
  // unpublished local notes. Search candidates contain only canonical metadata.
  await page('search.json', JSON.stringify(searchEntries, null, 2));
  return {output, readers:metas.length, legacyRoutes:Object.keys(reviewedNavigation).length, retiredRoutes:Object.keys(retiredNavigation).length, resources:resources.size, media:localAssets.size, legacyDependencies:Object.fromEntries([...legacyDependencies].filter(([, items]) => items.length))};
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  console.log(JSON.stringify(await buildCandidate(), null, 2));
}
