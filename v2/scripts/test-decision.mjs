import {assertGeneratedMarkup,assertGeneratedMarkupCount} from './check-generated-markup.mjs';
import assert from "node:assert/strict";
import './test-decision-preservation.mjs';
import {readFile} from "node:fs/promises";
import {distributionStats,decisionDistributions,probabilityObjective,selectiveGate,policyDecision,sharedState} from "../site/readers/decision-model.js";
import {distributionBody,objectiveBody,cascadeBody,policyBody} from "../site/readers/decision-scenes.js";
import {decisionMeta,decisionSections,decisionReader,decisionAliases} from "../site/readers/decision.js";
import {readerMetas,renderDenseReader} from "../site/readers/index.js";
import {rank} from "../site/search.js";
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-9,[a,b]);let cases=0;
for(let n=2;n<=24;n++){
 const uniform=distributionStats(Array(n).fill(1/n));near(uniform.choice,0);near(uniform.score,0);near(uniform.mean,(n-1)/2);cases++;
 for(let at=0;at<n;at++){const ps=Array(n).fill(0);ps[at]=1;const m=distributionStats(ps);near(m.choice,1);near(m.score,1);near(m.mean,at);assert.equal(m.mode,at);cases++;}
}
for(let a=0;a<=20;a++)for(let b=0;b<=20-a;b++){
 const ps=[a/20,b/20,(20-a-b)/20],m=distributionStats(ps),mode=ps.indexOf(Math.max(...ps));near(m.mean,ps[1]+2*ps[2]);near(m.choice,(Math.max(...ps)-1/3)/(2/3));near(m.score,Math.max(0,1-(ps[0]*mode+ps[1]*Math.abs(1-mode)+ps[2]*Math.abs(2-mode))/(2/3)));cases++;
}
near(distributionStats([.6,.3,.1]).choice,distributionStats([.6,.2,.2]).choice);
near(distributionStats([0,1,0]).mean,distributionStats([.5,0,.5]).mean);
for(let qi=1;qi<100;qi++)for(let pi=1;pi<100;pi++){
 const q=qi/100,p=pi/100,m=probabilityObjective(p,q);near(m.reward,1-q+(2*q-1)*p);near(m.brier,q*(1-q)+(p-q)**2);near(m.logloss,-Math.log(p**q*(1-p)**(1-q)));
 const eps=1e-6,gradient=(probabilityObjective(p+eps,q).logloss-probabilityObjective(p-eps,q).logloss)/(2*eps);
 assert.ok(Math.abs(gradient-(p-q)/(p*(1-p)))<1e-5);cases++;
}
const fixedScores=[.99,.97,.91,.86,.81,.73,.65,.57,.48,.35,.18,.05],truth=[0,1,1,1,0,1,1,0,1,0,0,0];
for(let k=0;k<=100;k++){
 const m=selectiveGate(k/100);let selected=0,errors=0;
 fixedScores.forEach((p,i)=>{if(Math.max(p,1-p)>=k/100){selected++;errors+=Number(Number(p>=.5)!==truth[i]);}});
 assert.equal(m.automatic,selected);assert.equal(m.review,12-selected);assert.equal(m.errors,errors);near(m.coverage,selected/12);near(m.cost,1+(12-selected)/12*20);
 if(selected)near(m.risk,errors/selected);else assert.equal(m.risk,null);cases++;
}
for(let q=0;q<4;q++)for(let step=0;step<4;step++){const m=policyDecision(q,step);assert.equal(m.label,["yes","no","yes","no"][q]);assert.equal(m.step,step);cases++;}
for(let q=1;q<=100;q++){const m=sharedState(q);assert.equal(m.independent,105*q);assert.equal(m.shared,110+5*q);cases++;}
for(const fn of [()=>distributionStats([.2,.3]),()=>distributionStats([1]),()=>distributionStats([-1,2]),()=>probabilityObjective(NaN),()=>selectiveGate(1.1),()=>policyDecision(4),()=>policyDecision(0,.1),()=>sharedState(0)])assert.throws(fn,RangeError);
let states=0;const check=s=>{assertGeneratedMarkup(s,"test-decision.mjs");assert.ok(!/NaN|undefined/.test(s));states++;};
for(let i=0;i<6;i++)check(distributionBody(i));for(let i=1;i<100;i++)check(objectiveBody(i));for(let i=0;i<=100;i++)check(cascadeBody(i));for(let q=0;q<4;q++)for(let s=0;s<4;s++)check(policyBody(s,q));assert.equal(states,222);
const html=decisionReader(s=>"directions.html?slug="+s),ids=[...html.matchAll(/ id="([^"]+)"/g)].map(x=>x[1]);
assert.equal(decisionSections.length,34);assert.equal(ids.length,new Set(ids).size);for(const[id]of decisionSections)assert.ok(ids.includes(id));
assert.equal(decisionMeta.date,"2026-08-05");assert.equal(decisionMeta.prototype,false);assert.equal(decisionMeta.visibility,"public");assert.equal(decisionAliases.length,2);assert.equal(renderDenseReader(decisionMeta.slug,s=>s),decisionReader(s=>s));
for(const text of ["37,840","4,568","16,929,529","1,526","6,000","880/1,000","300/300","2,048","5e−5","54.1M","45.2M","4.4M","4.5M","73 leaf","90 fixed","30%","91.3","94.1","84.9","83.8","88.7","61.1","75.9","95.0","70–500","not a reproduction","must not be read as a plain weighted","no longer current","not the yes probability","full vocabulary","confident errors"])assert.ok(html.includes(text),text);
assert.equal((html.match(/data-decision-lab=/g)||[]).length,4);
const catalog=JSON.parse(await readFile(new URL("../site/catalog.json",import.meta.url),"utf8")),notes=[...readerMetas,...catalog.notes];for(const[,slug]of html.matchAll(/href='directions\.html\?slug=([^'#]+)'/g))assert.ok(notes.some(n=>n.slug===slug),slug);
for(const q of ["Jev","Tev","Shieldstral","RLCD","iso-content","typed decisions"])assert.ok(rank(notes,q).some(r=>r.note===decisionMeta),q);
const words=html.replace(/<[^>]*>/g," ").split(/\s+/).length;assert.ok(words>4500,words);
assertGeneratedMarkupCount("test-decision.mjs",states);
console.log("Decision models: "+cases+" independent numerical cases,222 rendered states,34 sections,scoped recipes/current confidence formulas,links and search pass; "+words+" words.");
