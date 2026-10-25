import assert from 'node:assert/strict';
import {coverTrace} from '../prototypes/readers/cover-window-model.js';
function sequences(alphabet, max) {
  const result = ['']; let level = [''];
  for (let n = 1; n <= max; n++) { level = level.flatMap(s => alphabet.map(c => s + c)); result.push(...level); }
  return result;
}
function counts(values) { const map = new Map(); for (const v of values) map.set(v, (map.get(v) || 0) + 1); return map; }
function brute(input, target) {
  const need = counts(target); let best = null;
  for (let l = 0; l < input.length; l++) for (let r = l; r < input.length; r++) {
    const have = counts(input.slice(l, r + 1));
    if ([...need].every(([c, n]) => (have.get(c) || 0) >= n) && (!best || r - l < best[1] - best[0])) best = [l, r];
  }
  return best;
}
let cases = 0, states = 0;
const inputs = sequences(['A', 'B', 'C'], 5), targets = sequences(['A', 'B'], 3).slice(1);
for (const text of inputs) for (const target of targets) {
  const input = [...text], need = counts([...target]), frames = coverTrace(text, target);
  assert.equal(frames.at(-1).finished, true);
  assert(frames.slice(0, -1).every(f => !f.finished));
  assert.deepEqual(frames.at(-1).best, brute(input, [...target]));
  for (let i = 0; i < frames.length; i++) {
    const f = frames[i], have = counts(input.slice(f.left, f.right + 1));
    assert.deepEqual([...f.counts].sort(), [...have].sort());
    assert.equal(f.formed, [...need].filter(([c, n]) => (have.get(c) || 0) >= n).length);
    assert.equal(f.required, need.size);
    if (f.event.startsWith('Coverage holds')) assert.equal(f.formed, f.required);
    if (f.event.startsWith('Remove')) {
      assert(frames[i - 1].event.startsWith('Coverage holds'));
      assert.equal(f.left, frames[i - 1].left + 1);
      assert.deepEqual(f.best, frames[i - 1].best);
    }
    if (f.best) {
      const bestCounts = counts(input.slice(f.best[0], f.best[1] + 1));
      assert([...need].every(([c, n]) => (bestCounts.get(c) || 0) >= n));
      assert(f.best[1] <= f.right);
    }
    states++;
  }
  assert.equal(frames.filter(f => f.event.startsWith('Add')).length, input.length);
  assert(frames.filter(f => f.event.startsWith('Remove')).length <= input.length);
  cases++;
}
const demonstration = coverTrace('CAAABA', 'AAB');
const record = demonstration.findIndex(f => f.event.startsWith('Coverage holds'));
assert.deepEqual(demonstration[record].best, [0, 4]);
assert.equal(demonstration[record].formed, 2);
assert.equal(demonstration[record + 1].formed, 2);
const removals = demonstration.filter(f => f.event.startsWith('Remove'));
assert.deepEqual(removals.map(f => f.formed), [2,2,1,1]);
assert.deepEqual(demonstration.at(-1).best, [2, 4]);
assert.deepEqual(demonstration.at(-1).best, brute([...'CAAABA'], [...'AAB']));
assert(demonstration.at(-1).event.includes('No input remains'));
assert.deepEqual(coverTrace('😀A😀', '😀😀').at(-1).best, [0, 2]);
assert.throws(() => coverTrace('A', ''), TypeError);
assert.throws(() => coverTrace(null, 'A'), TypeError);
console.log(`Covering window: ${cases} exhaustive text/target cases and ${states} exact frames; multiplicities, threshold crossings, record-before-remove, earliest ties and Unicode code-point boundaries pass.`);
