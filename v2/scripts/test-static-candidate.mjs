import assert from 'node:assert/strict';
import './test-static-scenes.mjs';
import './test-scroll-regions.mjs';
import './test-reviewed-destination-ledger.mjs';
import './test-swallowed-markup.mjs';
import './test-mathml-namespace.mjs';
import './test-generated-markup.mjs';
import './test-publication-build.mjs';
import path from 'node:path';
import {readFile, readdir} from 'node:fs/promises';
import {parse} from 'parse5';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {buildCandidate} from './build-candidate.mjs';
import {readerMetas} from '../site/readers/index.js';
import {reviewedNavigation, reviewedFragments, resolveReviewedNote} from '../site/reviewed-navigation.js';
import {retiredNavigation, isRetiredNote, retirementNotice} from '../site/retired-navigation.js';

const result = await buildCandidate();
assert.equal(result.readers,55);
const routes = new Map();
let equations=0, images=0;
function nodes(root) {
  const list=[], queue=[root];
  while(queue.length){const node=queue.pop();list.push(node);queue.push(...(node.childNodes||[]));}
  return list;
}
const attr=(node,name)=>node.attrs?.find(item=>item.name===name)?.value;
for(const meta of readerMetas){
  const source=await readFile(path.join(result.output,'atlas',meta.slug,'index.html'),'utf8');
  const document=nodes(parse(source));
  assert(document.some(node=>node.tagName==='h1'),meta.slug+' must contain a server-rendered heading');
  assert(document.some(node=>node.tagName==='article'),meta.slug+' must contain the complete reader');
  assert(document.some(node=>node.tagName==='meta'&&attr(node,'name')==='robots'&&attr(node,'content')==='noindex,nofollow'));
  assert.equal(document.filter(node=>node.tagName==='link'&&attr(node,'rel')==='canonical').length,1);
  assert(document.some(node=>node.tagName==='link'&&attr(node,'rel')==='canonical'&&attr(node,'href')==='https://naatyu.github.io/atlas/'+meta.slug+'/'));
  for(const [key,value]of [['og:title',meta.title+' · Nathan Laoué'],['og:description',meta.description],['og:type','article'],['article:published_time',meta.date],['article:modified_time',meta.updated]])assert(document.some(node=>node.tagName==='meta'&&attr(node,'property')===key&&attr(node,'content')===value),meta.slug+' '+key);
  assert.equal(document.filter(node=>node.tagName==='meta'&&attr(node,'name')==='description').length,1);
  assert(!source.includes('katex-error'));
  for(const node of document.filter(n=>n.tagName==='pre'||(attr(n,'class')||'').split(' ').includes('dense-table-wrap'))){
    assert.equal(attr(node,'tabindex'),'0',meta.slug+' unfocusable scroll region');
    assert.equal(attr(node,'role'),'region');
    assert((attr(node,'aria-label')||attr(node,'aria-labelledby')||'').trim(),meta.slug+' unnamed scroll region');
  }
  const ids=document.map(node=>attr(node,'id')).filter(Boolean);
  assert.equal(ids.length,new Set(ids).size,meta.slug+' duplicate HTML id');
  equations+=document.filter(node=>(attr(node,'class')||'').split(' ').includes('typeset-equation')).length;
  images+=document.filter(node=>node.tagName==='img').length;
  routes.set('/atlas/'+meta.slug+'/',{ids:new Set(ids),document});
}
assert.equal(equations,561);
let reviewedAnchors=0;
for(const [legacy, destination] of Object.entries(reviewedNavigation)){
  const source=await readFile(path.join(result.output,'atlas',legacy,'index.html'),'utf8');
  const document=nodes(parse(source));
  assert(document.some(node=>node.tagName==='body'&&attr(node,'data-legacy-slug')===legacy));
  assert(!document.some(node=>node.tagName==='article'),'Legacy route must not publish the old article');
  assert(document.some(node=>node.tagName==='a'&&attr(node,'href')==='/atlas/'+destination.slug+'/#'+destination.anchor));
  assert(routes.get('/atlas/'+destination.slug+'/').ids.has(destination.anchor),legacy+' default destination');
  for(const [oldAnchor, newAnchor] of Object.entries(reviewedFragments[legacy]||{})){
    const resolved=resolveReviewedNote(legacy,'#'+encodeURIComponent(oldAnchor));
    assert.equal(resolved.anchor,typeof newAnchor==='object'?newAnchor.anchor:newAnchor);
    assert(routes.get('/atlas/'+resolved.slug+'/').ids.has(resolved.anchor),legacy+'#'+oldAnchor);
    reviewedAnchors++;
  }
  assert.equal(resolveReviewedNote(legacy,'#unknown-future-section').anchor,'unknown-future-section');
}
assert.equal(result.legacyRoutes,206);
assert.equal(reviewedAnchors,3235);
const plan=JSON.parse(await readFile(new URL('../../.internal/v2/dense-preservation.json',import.meta.url),'utf8'));
const retired=plan.sourceLedger.filter(entry=>!entry.publicBody&&entry.action!=='replace-navigation');
assert.equal(retired.length,25);
assert.equal(result.retiredRoutes,25);
assert.deepEqual(Object.keys(retiredNavigation).sort(),retired.map(entry=>entry.originalSlug).sort());
const repo=new URL('../../',import.meta.url);
for(const entry of plan.sourceLedger.filter(entry=>!entry.publicBody)){
  const current=await readFile(new URL(entry.source,repo));
  const committed=execFileSync('git',['show','HEAD:'+entry.source],{cwd:repo,maxBuffer:8*1024*1024});
  assert.equal(createHash('sha256').update(current).digest('hex'),entry.sha256,entry.source);
  assert.deepEqual(current,committed,'Retirement requires byte-equal Git recovery: '+entry.source);
}
for(const entry of retired){
  const slug=entry.originalSlug;
  assert(isRetiredNote(slug));
  assert.equal(resolveReviewedNote(slug),null,'Retirement is not a content-preserving alias');
  const source=await readFile(path.join(result.output,'atlas',slug,'index.html'),'utf8');
  const document=nodes(parse(source));
  assert(document.some(node=>attr(node,'data-retired-slug')===slug));
  assert(document.some(node=>node.tagName==='meta'&&attr(node,'name')==='robots'&&attr(node,'content')==='noindex,nofollow'));
  assert(!document.some(node=>node.tagName==='article'));
  assert(!source.includes('legacy-route.js')&&!source.includes('location.replace'));
  assert(!source.includes('Its content is now part'));
  const related=retiredNavigation[slug].related;
  assert.deepEqual(related?[related]:[],entry.targets);
  if(related)assert(routes.has('/atlas/'+related+'/'));
  for(const node of document.filter(node=>node.tagName==='a')){
    const href=attr(node,'href');
    assert(href==='#main'||href==='/atlas/'||routes.has(href),'Retirement link must be a canonical reference');
  }
}
assert.equal(retirementNotice('unknown',()=>'',()=>''),'');
const atlasIndex=await readFile(path.join(result.output,'atlas/index.html'),'utf8');
const missingSource=await readFile(path.join(result.output,'404.html'),'utf8');
const missing=nodes(parse(missingSource));
assert(missing.some(node=>node.tagName==='h1'&&node.childNodes.some(child=>child.value==='Page not found')));
assert(missing.some(node=>attr(node,'id')==='main'));
assert(missing.some(node=>node.tagName==='meta'&&attr(node,'name')==='robots'&&attr(node,'content')==='noindex,nofollow'));
assert(!missing.some(node=>node.tagName==='article'));
assert(!missing.some(node=>node.tagName==='link'&&attr(node,'rel')==='canonical'));
assert.deepEqual(missing.filter(node=>node.tagName==='a').map(node=>attr(node,'href')).sort(),['#main','/','/atlas/']);
assert(!missingSource.includes('location.replace')&&!missingSource.includes('http-equiv="refresh"'));
assert(!atlasIndex.includes('data-retired-slug'));
assert.equal(nodes(parse(atlasIndex)).filter(node=>node.tagName==='a'&&(attr(node,'href')||'').startsWith('/atlas/')).length,55);
const ledger=JSON.parse(await readFile(new URL('../../.internal/v2/reviewed-route-destinations.json',import.meta.url),'utf8'));
for(const entry of ledger.entries){
  const old=entry.originalRoute.slice(7);
  const initial=resolveReviewedNote(old);
  assert(initial,'Missing reviewed source route '+old);
  assert.equal('/atlas/'+initial.slug+'#'+initial.anchor,entry.destination);
  for(const [fragment,destination] of Object.entries(entry.oldFragmentDestinations||{})){
    const resolved=resolveReviewedNote(old,'#'+fragment);
    assert.equal('/atlas/'+resolved.slug+'#'+resolved.anchor,destination,old+'#'+fragment);
  }
}
assert((await readFile(path.join(result.output,'legacy-route.js'),'utf8')).includes('location.replace('));
for(const [route,{document}] of routes){
  for(const node of document){
    for(const attribute of ['href','src']){
      const value=attr(node,attribute);
      if(!value||!value.startsWith('/')&&!value.startsWith('#'))continue;
      const url=new URL(value,'http://localhost'+route);
      if(url.pathname==='/atlas/'){
        assert(!url.hash||url.hash==='#main');
        await readFile(path.join(result.output,'atlas/index.html'));
      }else if(url.pathname.startsWith('/atlas/')){
        assert(routes.has(url.pathname),route+' missing route '+value);
        if(url.hash)assert(routes.get(url.pathname).ids.has(decodeURIComponent(url.hash.slice(1))),route+' missing anchor '+value);
      }else if(url.pathname!=='/'){
        await readFile(path.join(result.output,url.pathname));
      }
    }
  }
}
const catalog=JSON.parse(await readFile(path.join(result.output,'search.json'),'utf8'));
assert.equal(catalog.length,55);
assert(catalog.every(item=>item.visibility==='public'&&item.kind==='dense-topic'&&item.searchText.length>1000),'Canonical index must include semantic note bodies, not just titles');
const home=nodes(parse(await readFile(path.join(result.output,'index.html'),'utf8')));
assert(home.some(node=>node.tagName==='link'&&attr(node,'rel')==='canonical'&&attr(node,'href')==='https://naatyu.github.io/'));
assert(home.some(node=>node.tagName==='meta'&&attr(node,'property')==='og:type'&&attr(node,'content')==='website'));
const slides=home.filter(node=>attr(node,'aria-roledescription')==='slide');
assert.equal(slides.length,3);
assert(slides.every(node=>routes.has(attr(node,'href'))));
assert(home.some(node=>attr(node,'data-open-search')!==undefined));
assert(home.some(node=>attr(node,'data-site-page')==='home'));
const shell=await readFile(path.join(result.output,'assets/site-shell.js'),'utf8');
assert(!shell.includes('directions.html')&&!shell.includes('catalog.json'));
assert(shell.includes('mountFileExplorer(')&&shell.includes('e.persisted')&&shell.includes('atlas-reader-suspend'));
assert(catalog.every(item=>!isRetiredNote(item.slug)));
assert(catalog.every(item=>routes.has('/atlas/'+item.slug+'/')));
assert(catalog.every(item=>!item.slug.includes('interview-prep/')&&!item.slug.includes('model-reports/')));
async function files(directory){const out=[];for(const entry of await readdir(directory,{withFileTypes:true})){const target=path.join(directory,entry.name);if(entry.isDirectory())out.push(...await files(target));else out.push(target);}return out;}
const emitted=await files(result.output);
const runtimeHash=createHash('sha256');
const packaged=emitted.map(file=>[path.relative(result.output,file).split(path.sep).join('/'),file]).filter(([name])=>name.startsWith('assets/')||name.startsWith('img/')).sort(([a],[b])=>a.localeCompare(b));
for(const [name,file]of packaged){runtimeHash.update(name+'\0');runtimeHash.update(await readFile(file));runtimeHash.update('\0');}
const runtimeRevision=runtimeHash.digest('hex'),revisions=new Set();
for(const meta of readerMetas){
  const source=await readFile(path.join(result.output,'atlas',meta.slug,'index.html'),'utf8');
  const article=source.match(/<article data-reader-revision="([a-f0-9]{64})" [\s\S]*?<\/article>/);
  assert(article,'Missing stable content/dependency revision: '+meta.slug);
  const body=article[0].replace(/ data-reader-revision="[a-f0-9]{64}"/,'');
  assert.equal(article[1],createHash('sha256').update(runtimeRevision+'\0'+body).digest('hex'));
  assert.notEqual(article[1],createHash('sha256').update(runtimeRevision+'\0'+body+' changed').digest('hex'));
  revisions.add(article[1]);
}
assert.equal(revisions.size,55);
assert(emitted.every(file=>!file.includes('/.internal/')&&!file.includes('/.agents/')&&!file.includes('/docs/')&&!/\.(md|mdx)$/.test(file)));
assert(!emitted.some(file=>file.endsWith('/catalog.json')),'Historical source index must not leak into the review export');
assert.deepEqual(result.legacyDependencies,{},'Consolidated readers must not reintroduce old-note dependencies');
console.log(JSON.stringify({staticReaders:routes.size,legacyRoutes:result.legacyRoutes,retiredRoutes:result.retiredRoutes,gitRecoverableRetirements:26,reviewedAnchors,equations,images,files:emitted.length,legacyDependentReaders:Object.keys(result.legacyDependencies).length,output:result.output}));
import './test-retirement-preflight.mjs';
