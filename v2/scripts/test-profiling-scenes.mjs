import {assertGeneratedMarkup,assertGeneratedMarkupCount} from './check-generated-markup.mjs';
import assert from 'node:assert/strict';
import {profilingScheduleBody,profilingOverlapBody,profilingLaunchBody} from '../site/readers/profiling-scenes.js';
let cases=0;
for(let w=0;w<=3;w++)for(let u=0;u<=3;u++)for(let a=1;a<=4;a++)for(let r=1;r<=2;r++){
 const html=profilingScheduleBody(w,u,a,r);assertGeneratedMarkup(html,"test-profiling-scenes.mjs");assert.ok(!/NaN|undefined|Infinity/.test(html));assert.equal((html.match(/Step[0-9]+/g)||[]).length,21);cases++;
}
for(let offset=0;offset<=8;offset++){const html=profilingOverlapBody(offset);assertGeneratedMarkup(html,"test-profiling-scenes.mjs");assert.ok(html.includes('summed durations=8ms'));assert.ok(html.includes(`union busy=${4+Math.min(offset,4)}ms`));assert.ok(!/NaN|undefined|Infinity/.test(html));cases++;}
for(let h=0;h<=40;h++)for(const mode of['async','sync'])for(let step=0;step<=5;step++){
 const html=profilingLaunchBody(h,mode,step);assertGeneratedMarkup(html,"test-profiling-scenes.mjs");assert.ok(!/NaN|undefined|Infinity/.test(html));assert.equal((html.match(/<rect /g)||[]).length,2*step);assert.ok(html.includes(`reveal=${step}/5`));cases++;
}
assertGeneratedMarkupCount("test-profiling-scenes.mjs",cases);
console.log(`Profiling scene bodies:${cases} bounded states render; native QA recorded separately.`);
