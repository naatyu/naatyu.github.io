import assert from 'node:assert/strict';
import {assertGeneratedMarkup,assertGeneratedMarkupCount} from './check-generated-markup.mjs';
const valid=['<p>Dynamic total=0</p>','<p>x&lt;y, without clipping.</p>','<span title="Use </p> as text">Quoted</span>','<math><munder><mi>min</mi><mi>x</mi></munder></math>','<svg><text>x&lt;y</text></svg>'];
for(const html of valid)assert.equal(assertGeneratedMarkup(html),html);
for(const html of ['<p>Value=${value}</p>','<figcaption>Require x<y. Keep this condition.</figcaption>','<math><mi><munder><mo>min</mo><mi>x</mi></munder></mi></math>'])assert.throws(()=>assertGeneratedMarkup(html));
assert.throws(()=>assertGeneratedMarkup(undefined));
assertGeneratedMarkupCount('generated scene',5);
assert.throws(()=>assertGeneratedMarkupCount('generated scene',6));
console.log('Generated markup guards: unresolved templates, swallowed caption markup and malformed MathML fixtures fail; safe markup returns unchanged. Actual scene-state coverage is in the owning tests.');
