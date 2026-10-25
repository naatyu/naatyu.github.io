import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {backtrackingReader} from '../site/readers/backtracking.js';
import {reviewedFragments,resolveReviewedNote} from '../site/reviewed-navigation.js';
const html=backtrackingReader(s=>'/atlas/'+s);
const decode=s=>s.replaceAll('&lt;','<').replaceAll('&gt;','>').replaceAll('&amp;','&');
const snippets=[...html.matchAll(/<pre(?: [^>]*)?><code>([\s\S]*?)<\/code><\/pre>/g)].map(m=>decode(m[1])).filter(s=>s.startsWith('def subsets(')||s.startsWith('def combinations('));
assert.equal(snippets.length,2);
const check=String.raw`
import itertools, collections, json, sys
namespace = {}
for code in json.loads(sys.stdin.read()):
    exec(code, namespace)
subsets, combinations = namespace["subsets"], namespace["combinations"]
cases = 0
for n in range(6):
    for source in itertools.product([-1, 0, 1], repeat=n):
        values = list(source)
        before = values.copy()
        actual = subsets(values)
        expected = [tuple(values[i] for i in range(n) if mask & (1 << i)) for mask in range(1 << n)]
        assert collections.Counter(map(tuple, actual)) == collections.Counter(expected)
        assert values == before
        for k in range(n + 1):
            actual = combinations(values, k)
            expected = [tuple(values[i] for i in indices) for indices in itertools.combinations(range(n), k)]
            assert collections.Counter(map(tuple, actual)) == collections.Counter(expected)
            assert values == before
            assert len({id(answer) for answer in actual}) == len(actual)
            cases += 1
for k in [-1, 2]:
    try:
        combinations([1], k)
        raise AssertionError("invalid k accepted")
    except ValueError:
        pass
answers = subsets([1, 2])
assert len({id(answer) for answer in answers}) == len(answers)
answers[0].append(99)
assert sum(99 in answer for answer in answers) == 1
print(cases)
`;
const cases=Number(execFileSync('/usr/bin/python3',['-c',check],{input:JSON.stringify(snippets),encoding:'utf8'}).trim());
assert.equal(cases,2005);
const old='interview-prep/neetcode-roadmap/backtracking';
assert.equal(Object.keys(reviewedFragments[old]).length,12);
for(const [fragment,anchor]of Object.entries(reviewedFragments[old])){
  assert.equal(resolveReviewedNote(old+'#'+fragment).slug,'algorithms/backtracking');
  assert.equal(resolveReviewedNote(old+'#'+fragment).anchor,anchor);
  assert(html.includes('id="'+anchor+'"'));
}
assert(!html.includes(old));assert(!html.includes('</details>p>'));
console.log(`Backtracking preservation: actual rendered Python snippets pass ${cases} combination cases plus subset, input ownership and copied-answer checks; all 12 reviewed headings resolve.`);
