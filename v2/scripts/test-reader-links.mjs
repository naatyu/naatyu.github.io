import assert from 'node:assert/strict';
import {directionURL,readerDestination} from '../site/reader-links.js';
import {readerMetas} from '../site/readers/index.js';
import {reviewedNavigation,reviewedFragments,resolveReviewedNote} from '../site/reviewed-navigation.js';
const state={path:['algorithms'],collection:'neetcode',q:'stack'};
function check(requested,expected){
  for(const design of ['gallery','canvas','desk']){
    const url=new URL(directionURL('reader',{slug:requested},design,state,readerMetas),'http://localhost/');
    assert.equal(url.searchParams.get('slug'),expected.slug);
    assert.equal(decodeURIComponent(url.hash.slice(1)),expected.anchor);
    assert.equal(url.searchParams.get('view'),design==='desk'?'atlas':'reader');
    assert(!url.searchParams.get('slug').includes('#'));
  }
}
check('algorithms/ordering#priority',{slug:'algorithms/ordering',anchor:'priority'});
check('algorithms/arrays',{slug:'algorithms/arrays',anchor:''});
for(const source of Object.keys(reviewedNavigation)){
  check(source,resolveReviewedNote(source));
  for(const fragment of Object.keys(reviewedFragments[source]||{}))check(source+'#'+fragment,resolveReviewedNote(source+'#'+fragment));
}
assert.deepEqual(readerDestination('algorithms/arrays#future section'),{slug:'algorithms/arrays',anchor:'future section'});
console.log('Reader links: canonical and all reviewed section links keep the fragment outside the note identifier in all three layouts.');
