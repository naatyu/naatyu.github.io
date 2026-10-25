import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {linkedListsReader} from '../prototypes/readers/linked-lists.js';
import {reviewedFragments,resolveReviewedNote} from '../prototypes/reviewed-navigation.js';
const html=linkedListsReader(slug=>'/atlas/'+slug);
const decode=value=>value.replaceAll('&lt;','<').replaceAll('&gt;','>').replaceAll('&amp;','&');
const snippets=[...html.matchAll(/<pre(?: [^>]*)?><code>([\s\S]*?)<\/code><\/pre>/g)].map(match=>decode(match[1])).filter(code=>code.startsWith('class ListNode:')||code.startsWith('def '));
assert.equal(snippets.length,4);
const check=String.raw`
import json,sys,itertools
ns={}
for code in json.loads(sys.stdin.read()): exec(code,ns)
Node=ns['ListNode']; reverse=ns['reverse_list']; cycle=ns['has_cycle']; merge=ns['merge_two_lists']
def build(values):
    nodes=[Node(value) for value in values]
    for a,b in zip(nodes,nodes[1:]): a.next=b
    return (nodes[0] if nodes else None),nodes
def identities(head):
    seen=set(); result=[]
    while head is not None:
        assert id(head) not in seen,'unexpected cycle'
        seen.add(id(head));result.append(head);head=head.next
    return result
for length in range(41):
    head,nodes=build([i%2 for i in range(length)])
    assert not cycle(head)
    result=reverse(head)
    assert identities(result)==list(reversed(nodes))
    assert not cycle(result)
    assert reverse(result)==head
    assert identities(head)==nodes
cycle_cases=0
for prefix in range(16):
    for period in range(1,13):
        head,nodes=build([0]*(prefix+period))
        nodes[-1].next=nodes[prefix]
        before=[node.next for node in nodes]
        assert cycle(head)
        assert [node.next for node in nodes]==before
        cycle_cases+=1
sources=[tuple(values) for n in range(5) for values in itertools.combinations_with_replacement(range(3),n)]
merges=0
for a_values in sources:
    for b_values in sources:
        a,an=build(a_values);b,bn=build(b_values)
        expected=[node for _,_,_,node in sorted([(node.value,0,i,node) for i,node in enumerate(an)]+[(node.value,1,i,node) for i,node in enumerate(bn)])]
        actual=identities(merge(a,b))
        assert actual==expected
        assert set(map(id,actual))==set(map(id,an+bn))
        assert [node.value for node in actual]==sorted(a_values+b_values)
        merges+=1
print(json.dumps({'reverseLengths':41,'cycles':cycle_cases,'merges':merges}))
`;
const result=JSON.parse(execFileSync('/usr/bin/python3',['-c',check],{input:JSON.stringify(snippets),encoding:'utf8'}));
assert.deepEqual(result,{reverseLengths:41,cycles:192,merges:1225});
const old='interview-prep/neetcode-roadmap/linked-list';
assert(!html.includes(old));
assert.equal(Object.keys(reviewedFragments[old]).length,13);
for(const [fragment,anchor]of Object.entries(reviewedFragments[old])){
  assert.deepEqual(resolveReviewedNote(old+'#'+fragment),{slug:'algorithms/linked-lists',anchor});
  assert(html.includes('id="'+anchor+'"'));
}
console.log(`Linked-list preservation: actual node class and3 functions pass41 reversal lengths,192 cycle configurations,1225 identity/stable-tie merges and13 reviewed headings.`);
