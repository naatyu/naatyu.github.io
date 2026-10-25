import {assertGeneratedMarkup,assertGeneratedMarkupCount} from './check-generated-markup.mjs';
import assert from 'node:assert/strict';
import {communicationRingBody,communicationDirectBody,communicationCreditBody,communicationVolumeBody,communicationScenes}from '../prototypes/readers/communication-scenes.js';
let cases=0;
function check(html){assertGeneratedMarkup(html,"test-communication-scenes.mjs");assert.ok(!/NaN|undefined|Infinity/.test(html));assert.ok(html.includes('data-communication-result'));cases++;}
for(let s=0;s<=6;s++)check(communicationRingBody(s));
for(let s=0;s<=4;s++)for(const shots of [1,2])for(const mode of ['push','pull'])check(communicationDirectBody(s,shots,mode));
for(let s=0;s<=13;s++)check(communicationCreditBody(s));
for(let e=7;e<=25;e++)for(const n of [2,4,8,16,64])for(const sync of ['ll','sentinel','atomic'])check(communicationVolumeBody(e,n,sync));
assert.equal(cases,326);assert.equal(Object.keys(communicationScenes()).length,4);
assert.ok(communicationRingBody(6).includes('Every rank now has [64,68,72,76]'));
assert.ok(communicationCreditBody(5).includes('0:consume:false'));
assert.ok(communicationCreditBody(13).includes('peer epochs=3,3'));
assertGeneratedMarkupCount("test-communication-scenes.mjs",cases);
console.log(`Communication scenes: ${cases} bounded bodies render; native controls and visual QA checked separately.`);
