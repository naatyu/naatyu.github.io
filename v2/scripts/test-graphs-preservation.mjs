import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {graphsReader} from '../prototypes/readers/graphs.js';
import {reviewedFragments,resolveReviewedNote} from '../prototypes/reviewed-navigation.js';
const html=graphsReader(s=>'/atlas/'+s);
const snippets=[...html.matchAll(/<pre[^>]*><code>([\s\S]*?)<\/code><\/pre>/g)].map(m=>m[1].replaceAll('&lt;','<').replaceAll('&gt;','>').replaceAll('&amp;','&'));
assert.equal(snippets.length,6);
const check=String.raw`
import json,sys,itertools,math
ns={}
for code in json.loads(sys.stdin.read()): exec(code,ns)
edges=[(i,j) for i in range(3) for j in range(3) if i!=j]
weighted=bfs=dfs=bounded=0
for choices in itertools.product((None,0,1,3),repeat=6):
    graph=[[] for _ in range(3)];reference=[[math.inf]*3 for _ in range(3)]
    for i in range(3): reference[i][i]=0
    for (i,j),w in zip(edges,choices):
        if w is not None: graph[i].append((j,w));reference[i][j]=w
    for k in range(3):
        for i in range(3):
            for j in range(3): reference[i][j]=min(reference[i][j],reference[i][k]+reference[k][j])
    for source in range(3):
        expected={j:d for j,d in enumerate(reference[source]) if d<math.inf}
        assert ns['dijkstra'](graph,source)==expected;weighted+=1
for mask in range(64):
    selected=[edge for i,edge in enumerate(edges) if mask&(1<<i)]
    graph=ns['adjacency_list'](3,selected)
    assert graph==[[j for i,j in selected if i==v] for v in range(3)]
    for source in range(3):
        distance={source:0};todo=[source]
        for node in todo:
            for neighbor in graph[node]:
                if neighbor not in distance: distance[neighbor]=distance[node]+1;todo.append(neighbor)
        assert ns['reachable'](graph,source)==set(distance);dfs+=1
        for target in range(3):
            assert ns['shortest_distance'](graph,source,lambda node:node==target)==distance.get(target,-1);bfs+=1
assert ns['adjacency_list'](3,[(0,1),(1,1)],False)==[[1],[0,1,1],[]]
class Vertex: pass
a,b,c=Vertex(),Vertex(),Vertex()
assert ns['dijkstra']({a:[(b,1),(c,1)],b:[],c:[]},a)=={a:0,b:1,c:1}
try: ns['dijkstra']([[(1,-1)],[]],0)
except ValueError: pass
else: raise AssertionError('negative reachable edge')
huge=10**300
assert ns['dijkstra']([[(1,huge)],[]],0)=={0:0,1:huge}
options=[(i,j) for i in range(4) for j in range(i,4)]
unions=0
for length in range(5):
    for sequence in itertools.product(options,repeat=length):
        uf=ns['UnionFind'](4);adj=[set() for _ in range(4)]
        def reached(start):
            seen={start};todo=[start]
            for v in todo:
                for w in adj[v]:
                    if w not in seen: seen.add(w);todo.append(w)
            return seen
        for a,b in sequence:
            expected=b not in reached(a)
            assert uf.union(a,b)==expected
            adj[a].add(b);adj[b].add(a)
            for i in range(4):
                for j in range(4): assert (uf.find(i)==uf.find(j))==(j in reached(i))
        unions+=1
for choices in itertools.product((None,-1,2),repeat=6):
    graph=[[] for _ in range(3)]
    for (i,j),w in zip(edges,choices):
        if w is not None: graph[i].append((j,w))
    for source in range(3):
        previous=[math.inf]*3;previous[source]=0;walks=[(source,0)];expected=previous[:]
        for budget in range(1,5):
            following=previous[:]
            for u in range(3):
                for v,w in graph[u]: following[v]=min(following[v],previous[u]+w)
            walks=[(v,cost+w) for u,cost in walks for v,w in graph[u]]
            for v,cost in walks: expected[v]=min(expected[v],cost)
            assert following==expected;previous=following;bounded+=1
print(json.dumps({'weighted':weighted,'bfs':bfs,'dfs':dfs,'unions':unions,'bounded':bounded}))
`;
const result=JSON.parse(execFileSync('/usr/bin/python3',['-c',check],{input:JSON.stringify(snippets),encoding:'utf8'}));
assert.deepEqual(result,{weighted:12288,bfs:576,dfs:192,unions:11111,bounded:8748});
for(const [name,count]of [['graphs',15],['advanced-graphs',12]]){
  const old='interview-prep/neetcode-roadmap/'+name;
  assert(!html.includes(old));assert.equal(Object.keys(reviewedFragments[old]).length,count);
  for(const [fragment,anchor]of Object.entries(reviewedFragments[old])){
    assert.deepEqual(resolveReviewedNote(old+'#'+fragment),{slug:'algorithms/graphs',anchor});
    assert(html.includes('id="'+anchor+'"'));
  }
}
assert.equal((html.match(/typeset-equation/g)||[]).length,3);
console.log('Graph preservation: five actual Python blocks pass12288 weighted cases,576 BFS targets,192 reachability cases and11111 DSU histories;8748 bounded-walk recurrence cases checked independently.');
