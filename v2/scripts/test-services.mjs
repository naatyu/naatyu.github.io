import {assertGeneratedMarkup,assertGeneratedMarkupCount} from './check-generated-markup.mjs';
import './test-services-model.mjs';
import './test-services-preservation.mjs';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {servicesMeta,servicesAliases,servicesSections,servicesReader} from '../site/readers/services.js';
import {servicesPartitionBody,servicesQuorumBody,servicesWorkersBody} from '../site/readers/services-scenes.js';
import {readerMetas,renderDenseReader} from '../site/readers/index.js';
import {rank} from '../site/search.js';
let states=0;
for(const policy of ['cp','ap'])for(let stage=0;stage<=5;stage++){
 const h=servicesPartitionBody(policy,stage);assertGeneratedMarkup(h,"test-services.mjs");assert.ok(!/NaN|undefined|Infinity/.test(h));
 assert.ok(h.includes('stage='+stage));if(stage===3)assert.ok(h.includes('read='+(policy==='cp'?'none':'0')));states++;
}
for(let r=1;r<=3;r++)for(let w=1;w<=3;w++)for(let mask=0;mask<8;mask++){
 const h=servicesQuorumBody(r,w,mask),alive=mask.toString(2).replaceAll('0','').length;assertGeneratedMarkup(h,"test-services.mjs");
 assert.ok(h.includes('minimum overlap='+Math.max(0,r+w-3)));assert.ok(h.includes('read possible='+(alive>=r)));assert.ok(h.includes('write possible='+(alive>=w)));assert.ok(!/NaN|undefined|Infinity/.test(h));states++;
}
for(const daily of [1,10,25,50,100])for(const seconds of [1,30,60,120])for(const percent of [50,70,90]){
 const num=BigInt(daily)*1000000n*BigInt(seconds)*100n,den=86400n*BigInt(percent),workers=Number((num+den-1n)/den);
 const h=servicesWorkersBody(daily,seconds,percent);assertGeneratedMarkup(h,"test-services.mjs");assert.ok(h.includes('ideal workers='+workers));assert.ok(!/NaN|undefined|Infinity/.test(h));states++;
}
const html=servicesReader(s=>'directions.html?slug='+s),ids=[...html.matchAll(/ id="([^"]+)"/g)].map(x=>x[1]);
assert.equal(ids.length,new Set(ids).size);assert.equal(servicesSections.length,28);for(const[id]of servicesSections)assert.ok(ids.includes(id));
assert.equal(servicesMeta.date,'2026-04-08');assert.equal(servicesMeta.prototype,false);assert.equal(servicesMeta.visibility,'public');assert.equal(servicesAliases.length,10);
assert.equal(renderDenseReader(servicesMeta.slug,s=>s),servicesReader(s=>s));assert.equal((html.match(/data-services-lab=/g)||[]).length,3);
for(const text of ['PACELC','34,723','49,604','578.704','98.9901%','25.92','fencing','Sloppy quorum','read-your-writes','Merkle','TTL','DNSSEC','QUIC','write-through','LSM','composite','virtual nodes','durability','idempotency','outbox','LRU','5%','100:1'])assert.ok(html.toLowerCase().includes(text.toLowerCase()),text);
for(const[,slug]of html.matchAll(/href="directions\.html\?slug=([^"#]+)"/g))assert.ok(readerMetas.some(n=>n.slug===slug),slug);
const catalog=JSON.parse(readFileSync(new URL('../site/catalog.json',import.meta.url),'utf8')),notes=[...readerMetas,...catalog.notes];
for(const q of ['system design','CAP','quorum','DNS','sharding'])assert.ok(rank(notes,q).some(r=>r.note===servicesMeta),q);
const fingerprints=[
['interview-prep/system-design/8-most-important-system-design-concepts-you-should-know','3f5aaf149611fce5a9e94a69a42bfac033e487fbc9f6a93095683296ef0bbe06'],
['interview-prep/system-design/design-youtube-system-design-interview','71fcdf2c725640ce1590843bcd5439bed025febda8560302ec6e85c36007a73a'],
['systems/distributed-systems/availability-patterns','480cc785fd25d0b5e6f47418afbbe31d9100246ff472442b4f9d650ea063ebc9'],
['systems/distributed-systems/availability-vs-consistency-cap','20dbf90f4ef88c5c2b73f1ed344942e41cce6a43f9aa2adc70bbacc85a705a1e'],
['systems/distributed-systems/consistency-patterns','08ce7e15340ac4a4f711d08fd1a36f9b47b75d25231892f588f6478ee99f6dd4'],
['systems/distributed-systems/content-delivery-network','a8a5bbae2b721bc8f81d44cbde5a3af48638f0b444faf5688d263e39df58af33'],
['systems/distributed-systems/database-sharding','bc009b3f347752dae76ed692ef698882ae856ddfbc72f266a72b90ed4f9eaed5'],
['systems/distributed-systems/load-balancer','9bc10b1ffe5f4a2d40f727590b8594c38658f2ea6482e8b011ce711cbbb5ac5d'],
['systems/distributed-systems/scalability','d504439c785f82391b62d55367e711c4c5e36a0f90d32986699647feba8a7944'],
['systems/networking/domain-name-system-dns','d9a8998640dc9e89d4ea9abd4d927b09abfad301976057abb03421f6b38a5a15']
];
for(const[path,hash]of fingerprints)assert.equal(createHash('sha256').update(readFileSync(new URL('../../docs/'+path+'.md',import.meta.url))).digest('hex'),hash);
assertGeneratedMarkupCount("test-services.mjs",states);
console.log('Services: 28 sections, three scenes, '+states+' bounded states, originals/registry/search/links pass; '+html.replace(/<[^>]*>/g,' ').split(/\s+/).length+' words.');
