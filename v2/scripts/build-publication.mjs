// Prepare publication-format files locally. This does not approve or deploy them.
import {readFile,writeFile,readdir} from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {buildCandidate} from './build-candidate.mjs';
import {readerMetas} from '../prototypes/readers/index.js';
import {siteOrigin} from '../prototypes/page-metadata.js';

export async function buildPublication(){
  const result=await buildCandidate();
  if(Object.keys(result.legacyDependencies).length)throw Error('Unresolved legacy dependencies');
  const canonical=new Set(['index.html','atlas/index.html',...readerMetas.map(m=>`atlas/${m.slug}/index.html`)]);
  const files=[];
  async function walk(dir){for(const entry of await readdir(dir,{withFileTypes:true})){
    const file=path.join(dir,entry.name);if(entry.isDirectory())await walk(file);else files.push(file);
  }}
  await walk(result.output);
  let indexedPages=0;
  for(const file of files.filter(f=>f.endsWith('.html'))){
    const relative=path.relative(result.output,file).split(path.sep).join('/');
    let html=await readFile(file,'utf8');
    if(canonical.has(relative)){
      html=html.replace('<meta name="robots" content="noindex,nofollow">','');
      html=html.replaceAll(' · Local reader draft','').replaceAll(' · Consolidated reader pilot','');
      html=html.replace(/data-reader-revision="([a-f0-9]{64})"/g,(_,revision)=>
        `data-reader-revision="${createHash('sha256').update('publication\0'+revision).digest('hex')}"`);
      if(/Local reader draft|Consolidated reader pilot|name="robots" content="noindex/.test(html))throw Error('Review marker in canonical page: '+relative);
      indexedPages++;
    }
    await writeFile(file,html);
  }
  if(indexedPages!==canonical.size)throw Error('Missing canonical publication page');
  const entries=[{path:'/',updated:null},{path:'/atlas/',updated:null},...readerMetas.map(m=>({path:`/atlas/${m.slug}/`,updated:m.updated}))];
  const sitemap='<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+entries.map(e=>`<url><loc>${siteOrigin}${e.path}</loc>${e.updated?`<lastmod>${e.updated}</lastmod>`:''}</url>`).join('')+'</urlset>\n';
  await writeFile(path.join(result.output,'sitemap.xml'),sitemap);
  await writeFile(path.join(result.output,'robots.txt'),`User-agent: *\nAllow: /\nSitemap: ${siteOrigin}/sitemap.xml\n`);
  await writeFile(path.join(result.output,'.nojekyll'),'');
  return {...result,format:'publication',indexedPages,deployed:false,contentApproval:'separate migration review required'};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
  console.log(JSON.stringify(await buildPublication(),null,2));
}
