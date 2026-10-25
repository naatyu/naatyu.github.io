import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {treesReader} from '../site/readers/trees.js';
import {reviewedFragments,resolveReviewedNote} from '../site/reviewed-navigation.js';
const html=treesReader(s=>'/atlas/'+s);
const snippets=[...html.matchAll(/<pre[^>]*><code>([\s\S]*?)<\/code><\/pre>/g)].map(m=>m[1].replaceAll('&lt;','<').replaceAll('&gt;','>').replaceAll('&amp;','&'));
assert.equal(snippets.length,7);
assert.equal((html.match(/class="inline-math"/g)||[]).length,2);
const check=String.raw`
import json,sys,itertools,functools,collections
ns={}
for code in json.loads(sys.stdin.read()): exec(code,ns)
Node=ns['TreeNode']
@functools.lru_cache(None)
def shapes(n):
    if n==0: return (None,)
    return tuple((l,r) for k in range(n) for l in shapes(k) for r in shapes(n-1-k))
def build(shape,seed):
    nodes=[]
    def make(s):
        if s is None: return None
        node=Node((len(nodes)+seed)%5-2);nodes.append(node)
        node.left=make(s[0]);node.right=make(s[1]);return node
    return make(shape),nodes
trees=0
for n in range(7):
    for shape in shapes(n):
        for seed in range(5):
            root,nodes=build(shape,seed);before=[(x.left,x.right,x.value) for x in nodes]
            queue=[(root,0,[])] if root else [];levels=[];good=0;adj={x:[] for x in nodes}
            for node,depth,path in queue:
                if len(levels)<=depth: levels.append([])
                levels[depth].append(node.value)
                good+=int(all(node.value>=v for v in path))
                for child in (node.left,node.right):
                    if child is not None:
                        adj[node].append(child);adj[child].append(node)
                        queue.append((child,depth+1,path+[node.value]))
            diameter=0
            for start in nodes:
                distances={start:0};todo=[start]
                for v in todo:
                    for w in adj[v]:
                        if w not in distances: distances[w]=distances[v]+1;todo.append(w)
                diameter=max(diameter,max(distances.values()))
            assert ns['height'](root)==len(levels)
            assert ns['level_order'](root)==levels
            assert ns['count_good_nodes'](root)==good
            assert ns['diameter_of_binary_tree'](root)==diameter
            assert ns['diameter_of_binary_tree'](None)==0
            assert before==[(x.left,x.right,x.value) for x in nodes];trees+=1
words=['','a','ab','aba','b','ba','😀']
queries=[''.join(q) for n in range(4) for q in itertools.product('ab😀',repeat=n)]+['z']
patterns=[''.join(q) for n in range(4) for q in itertools.product('ab😀.',repeat=n)]
def snapshot(root):
    queue=[('',root)];out=[]
    for prefix,node in queue:
        out.append((prefix,id(node),node.is_word,tuple(sorted(node.children))))
        queue.extend((prefix+c,child) for c,child in node.children.items())
    return tuple(out)
tries=wildcards=0
for mask in range(1<<len(words)):
    selected={w for i,w in enumerate(words) if mask&(1<<i)}
    trie=ns['Trie']()
    for w in sorted(selected): trie.insert(w);trie.insert(w)
    before=snapshot(trie.root)
    for q in queries:
        assert trie.search(q)==(q in selected)
        assert trie.starts_with(q)==(q=='' or any(w.startswith(q) for w in selected))
    for pattern in patterns:
        expected=any(len(w)==len(pattern) and all(p=='.' or p==c for p,c in zip(pattern,w)) for w in selected)
        assert ns['wildcard_search'](trie.root,pattern)==expected;wildcards+=1
    assert snapshot(trie.root)==before;tries+=1
print(json.dumps({'trees':trees,'tries':tries,'wildcards':wildcards}))
`;
const result=JSON.parse(execFileSync('/usr/bin/python3',['-c',check],{input:JSON.stringify(snippets),encoding:'utf8'}));
assert.deepEqual(result,{trees:985,tries:128,wildcards:10880});
for(const [old,count]of [['algorithms/data-structures/trees',15],['interview-prep/neetcode-roadmap/trees',13],['interview-prep/neetcode-roadmap/tries',11]]){
  assert(!html.includes(old));assert.equal(Object.keys(reviewedFragments[old]).length,count);
  for(const [fragment,anchor]of Object.entries(reviewedFragments[old])){
    assert.deepEqual(resolveReviewedNote(old+'#'+fragment),{slug:'algorithms/trees',anchor});
    assert(html.includes('id="'+anchor+'"'));
  }
}
console.log('Tree preservation: seven actual Python blocks pass985 tree/value configurations,128 word sets and10880 wildcard patterns; read-only queries and repeated-call reset checked.');
