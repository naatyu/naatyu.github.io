import {assertGeneratedMarkup,assertGeneratedMarkupCount} from './check-generated-markup.mjs';
import assert from 'node:assert/strict';
import {visionMaskBody,visionAgreementBody,visionProjectionBody,visionScenes} from '../prototypes/readers/vision-scenes.js';
let states=0;
const check=html=>{assertGeneratedMarkup(html,"test-vision-scenes.mjs");assert.ok(!/NaN|undefined|Infinity/.test(html));assert.ok(html.includes('role="img"'));assert.ok(html.includes('tabindex="0"'));states++;};
for(const scope of ['masked','all'])for(let logit=0;logit<=30;logit++)for(let step=0;step<=4;step++){const html=visionMaskBody(scope,logit,step);check(html);assert.ok(html.includes('Selected='+(scope==='masked'?2:4)));if(scope==='masked')assert.ok(html.includes('first-logit gradient=0.'));}
for(let error=0;error<=100;error++)for(let separation=0;separation<=100;separation++){const html=visionAgreementBody(error,separation);check(html);const rounded=x=>Number(x.toFixed(4)).toString();assert.ok(html.includes('agreement='+rounded(2*(error/100)**2)));assert.ok(html.includes('variance='+rounded((error/100)**2)));assert.ok(html.includes('global-to-all='+rounded(3*(error/100)**2)));assert.ok(html.includes('center variance='+rounded(1.25*(separation/100)**2)));}
for(const family of ['cross','gaussian','square','collapsed'])for(let angle=0;angle<=180;angle++){const html=visionProjectionBody(family,angle);check(html);assert.ok(html.includes('Angle='+angle+'°'));if(family==='gaussian')assert.ok(html.includes('Population quadrature discrepancy=0.'));for(const[,path]of html.matchAll(/<path d="(M260 [^"]+)"/g))for(const[,x,y]of path.matchAll(/[ML]([\d.e+-]+) ([\d.e+-]+)/g)){assert.ok(Number(x)>=260&&Number(x)<=524);assert.ok(Number(y)>=45-1e-9&&Number(y)<=195+1e-9);}}
const scenes=visionScenes();assert.equal(Object.keys(scenes).length,3);for(const body of Object.values(scenes))assert.ok(body.includes('<figcaption>'));
for(const fn of [()=>visionMaskBody('bad'),()=>visionMaskBody('all',31),()=>visionMaskBody('all',0,5),()=>visionAgreementBody(-1),()=>visionProjectionBody('cross',.5)])assert.throws(fn,RangeError);
assertGeneratedMarkupCount("test-vision-scenes.mjs",states);
console.log('Vision scenes: '+states+' finite rendered states and three exact visual bodies. Native browser QA is recorded separately.');
