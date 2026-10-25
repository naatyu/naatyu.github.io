import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {graphsReader} from '../site/readers/graphs.js';
import {findDecision} from '../site/readers/choosing-model.js';
import {assertGeneratedMarkup} from './check-generated-markup.mjs';
const html=assertGeneratedMarkup(graphsReader(s=>'/atlas/'+s));
const code=html.match(/aria-label="Zero-one BFS Python"><code>([\s\S]*?)<\/code>/)?.[1].replaceAll('&gt;','>').replaceAll('&lt;','<').replaceAll('&amp;','&');
assert(code);assert.equal(code.split('\n').length,15);
assert.equal(findDecision('zero-one').target,'algorithms/graphs#zero-one');
for(const marker of ['id="zero-one"','C:0, B:1','B:0, B:1','Strict improvement terminates zero-cost cycles','does not mutate adjacency','https://cp-algorithms.com/graph/01_bfs.html'])assert(html.includes(marker),marker);
const checks=String.raw`
import json,sys,itertools,copy
ns={};exec(sys.stdin.read(),ns);solve=ns['zero_one_bfs']
positions=[(a,b) for a in range(3) for b in range(3) if a!=b]
cases=0
for choices in itertools.product((None,0,1),repeat=6):
    graph={i:[] for i in range(3)}
    d=[[0 if i==j else float('inf') for j in range(3)] for i in range(3)]
    for (a,b),weight in zip(positions,choices):
        if weight is not None:graph[a].append((b,weight));d[a][b]=weight
    for k in range(3):
        for a in range(3):
            for b in range(3):d[a][b]=min(d[a][b],d[a][k]+d[k][b])
    before=copy.deepcopy(graph)
    for source in range(3):
        expected={i:v for i,v in enumerate(d[source]) if v!=float('inf')}
        assert solve(graph,source)==expected;assert graph==before;cases+=1
a,b,c=object(),object(),object()
graph={a:[(b,1),(c,0)],c:[(b,0)],b:[(a,0),(b,0)]}
assert solve(graph,a)=={a:0,b:0,c:0}
assert solve({0:[(1,1),(1,0)],1:[]},0)=={0:0,1:0}
assert solve({0:[]},0)=={0:0}
for weight in (-1,2,.5,float('inf'),float('nan')):
    try:solve({0:[(1,weight)],1:[]},0)
    except ValueError:pass
    else:raise AssertionError('invalid encountered weight accepted')
print(json.dumps({'cases':cases}))
`;
assert.deepEqual(JSON.parse(execFileSync('/usr/bin/python3',['-c',checks],{input:code,encoding:'utf8'})),{cases:2187});
console.log('0–1 BFS: actual15-line rendered Python passes2187 exhaustive directed source cases,zero cycles,parallel edges,nonorderable labels,mutation and invalid-weight guards;decision link targets its mechanism.');
