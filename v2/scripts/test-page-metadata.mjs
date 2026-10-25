import assert from 'node:assert/strict';
import {parse} from 'parse5';
import {pageMetadata,renderPageMetadata,updatePageMetadata,noteMetadata,siteOrigin} from '../site/page-metadata.js';
import {readerMetas} from '../site/readers/index.js';
const walk=node=>[node,...(node.childNodes||[]).flatMap(walk)];
const attr=(node,name)=>node.attrs?.find(a=>a.name===name)?.value;
const page={title:'Atlas',description:'Personal notes.',path:'/atlas/'};
for(const path of ['https://evil.test/','//evil.test/','/atlas/?token=private','/atlas/#part','/../internal/','/atlas/%2e%2e/','/.internal/','/atlas/no-trailing-slash'])assert.throws(()=>pageMetadata({...page,path}));
for(const date of ['2026-02-30','2026-13-01','tomorrow',undefined])assert.throws(()=>pageMetadata({...page,kind:'dense-topic',date,updated:'2026-10-09'}));
assert.throws(()=>pageMetadata({...page,kind:'dense-topic',date:'2026-10-09',updated:'2026-10-08'}));
assert.throws(()=>noteMetadata({...readerMetas[0],slug:'../private'}));
assert.throws(()=>noteMetadata({...readerMetas[0],visibility:'internal'}));
const dangerous=walk(parse('<head>'+renderPageMetadata({...page,title:'"<script>bad</script>',description:'"/><script>bad</script>'})+'</head>'));
assert(!dangerous.some(node=>node.tagName==='script'));
assert(dangerous.some(node=>node.tagName==='meta'&&attr(node,'name')==='description'&&attr(node,'content')==='"/><script>bad</script>'));
const document={title:'',head:{children:[],querySelectorAll(){return this.children.filter(node=>'data-atlas-metadata'in node.attributes);},append(node){this.children.push(node);}}};
document.createElement=tagName=>({tagName,attributes:{},setAttribute(name,value){this.attributes[name]=value;},remove(){document.head.children=document.head.children.filter(node=>node!==this);}});
const robots=document.createElement('meta');robots.setAttribute('name','robots');robots.setAttribute('content','noindex,nofollow');document.head.append(robots);
for(const meta of readerMetas){
  const model=noteMetadata(meta),expected=pageMetadata(model);
  const nodes=walk(parse('<head>'+renderPageMetadata(model)+'</head>'));
  assert.equal(nodes.filter(node=>node.tagName==='link'&&attr(node,'rel')==='canonical').length,1);
  assert(nodes.some(node=>attr(node,'href')===siteOrigin+'/atlas/'+meta.slug+'/'));
  for(const [attribute,key,value]of expected.tags)assert(nodes.some(node=>node.tagName==='meta'&&attr(node,attribute)===key&&attr(node,'content')===value),meta.slug+' '+key);
  updatePageMetadata(document,model);
  assert.equal(document.title,expected.title);
  assert.equal(document.head.children.length,expected.tags.length+2);
  assert(document.head.children.includes(robots));
  assert.equal(robots.attributes.content,'noindex,nofollow');
  assert.equal(document.head.children.filter(node=>node.attributes.property==='article:published_time')[0].attributes.content,meta.date);
  assert.equal(document.head.children.filter(node=>node.attributes.rel==='canonical')[0].attributes.href,expected.canonical);
}
for(const model of [page,{title:'Page not found',description:'Unknown address.'}]){
  updatePageMetadata(document,model);
  assert(!document.head.children.some(node=>node.attributes.property?.startsWith('article:')));
  assert.equal(document.head.children.filter(node=>node.attributes.rel==='canonical').length,model.path?1:0);
  assert(document.head.children.includes(robots));
}
const before=[...document.head.children];assert.throws(()=>updatePageMetadata(document,{...page,path:'//evil.test/'}));assert.deepEqual(document.head.children,before);
console.log(`Metadata: ${readerMetas.length} static/client note transitions,date lineage,clean canonical URLs,escaped text,stale-field removal and preserved noindex pass.`);
