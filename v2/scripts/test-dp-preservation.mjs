import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {dpReader} from '../site/readers/dp.js';
import {reviewedFragments,resolveReviewedNote} from '../site/reviewed-navigation.js';
const html=dpReader(s=>'/atlas/'+s);
const snippets=[...html.matchAll(/<pre[^>]*><code>([\s\S]*?)<\/code><\/pre>/g)].map(m=>m[1].replaceAll('&lt;','<').replaceAll('&gt;','>').replaceAll('&amp;','&'));
assert.equal(snippets.length,5);
assert(snippets[0].includes('Pseudocode:'));
const check=String.raw`
import json,sys,itertools,math
ns={}
for code in json.loads(sys.stdin.read()): exec(code,ns)
strings=[''.join(x) for n in range(5) for x in itertools.product('ab',repeat=n)]
def subsequences(s):
    return {''.join(s[i] for i in range(len(s)) if mask>>i&1) for mask in range(1<<len(s))}
lcs=0
for a in strings:
    for b in strings:
        expected=max(map(len,subsequences(a)&subsequences(b)))
        assert ns['lcs_prefix'](a,b)==expected
        assert ns['lcs_suffix'](a,b)==expected;lcs+=1
for a,b in [('', '😀'),('😀ab','a😀b'),('éé','é'),('é','e\u0301')]:
    expected=max(map(len,subsequences(a)&subsequences(b)))
    assert ns['lcs_prefix'](a,b)==ns['lcs_suffix'](a,b)==expected
words=['a','b','aa','ab','ba','bb']
texts=[''.join(x) for n in range(7) for x in itertools.product('ab',repeat=n)]
segments=0
for mask in range(1<<len(words)):
    dictionary=[w for i,w in enumerate(words) if mask>>i&1]
    for text in texts:
        # Enumerate cut subsets independently, not another prefix recurrence.
        expected=text==''
        for cuts in range(1<<max(0,len(text)-1)):
            boundaries=[0]+[i for i in range(1,len(text)) if cuts>>(i-1)&1]+[len(text)]
            if text and all(text[x:y] in dictionary for x,y in zip(boundaries,boundaries[1:])):
                expected=True;break
        before=dictionary[:]
        assert ns['word_break'](text,dictionary)==expected
        assert ns['word_break'](text,dictionary+['']+dictionary)==expected
        assert dictionary==before;segments+=1
assert ns['word_break']('😀é',['😀','é'])
assert not ns['word_break']('ab',['','a'])
grids=0
for rows in range(11):
    for columns in range(11):
        expected=math.comb(rows+columns-2,rows-1) if rows and columns else 0
        assert ns['unique_paths'](rows,columns)==expected;grids+=1
assert ns['unique_paths'](100,100)==math.comb(198,99)
for rows,columns in [(-1,2),(2,-1),(True,2),(2,False),(2.5,3),('2',3)]:
    try: ns['unique_paths'](rows,columns)
    except ValueError: pass
    else: raise AssertionError('invalid dimensions accepted')
print(json.dumps({'lcs':lcs,'segments':segments,'grids':grids}))
`;
const result=JSON.parse(execFileSync('/usr/bin/python3',['-c',check],{input:JSON.stringify(snippets.slice(1)),encoding:'utf8'}));
assert.deepEqual(result,{lcs:961,segments:8128,grids:121});
for(const [old,count]of [['one-dimensional-dynamic-programming',14],['two-dimensional-dynamic-programming',13]]){
  const slug='interview-prep/neetcode-roadmap/'+old;
  assert(!html.includes(slug));assert.equal(Object.keys(reviewedFragments[slug]).length,count);
  for(const [fragment,anchor]of Object.entries(reviewedFragments[slug])){
    assert.deepEqual(resolveReviewedNote(slug+'#'+fragment),{slug:'algorithms/dp',anchor});
    assert(html.includes('id="'+anchor+'"'));
  }
}
console.log('DP preservation: four actual Python implementations pass961 LCS pairs,8128 segmentation/cut cases,121 grids,Unicode and exact large-count/invalid-dimension boundaries.');
