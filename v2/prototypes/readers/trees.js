import {section,table,cite,topic,mountTopic,rangePlayback} from './topic-tools.js';
import {texEq as eq,inlineMath} from './math.js';
import {treeTrace,trieWalk} from './tree-dp-model.js';
import {traceLab,mountTrace} from './array-patterns-tools.js';
import {orderedTreeTrace} from './ordered-tree-model.js';
import {graphSvg} from './graph-visual.js';
export const treesMeta={slug:'algorithms/trees',title:'Trees and Prefix Structures',description:'Subtree returns and ancestor state, DFS/BFS orders, BST bounds, ancestors, tries, terminals and shared-prefix pruning.',date:'2026-04-08',updated:'2026-10-07',topicPath:['algorithms'],tags:['tree','DFS','BFS','BST','LCA','trie','prefix','postorder','height','diameter'],prototype:true,visibility:'public',kind:'dense-topic',learningGoals:['Separate ancestor state from returned subtree summaries.','Implement level grouping without consuming the next level.','Distinguish stored words, prefixes and wildcard branches.'],related:['algorithms/graphs','algorithms/dp','algorithms/backtracking']};
export const treesAliases=[];
export const treesSections=[['structure','A child is the root of another tree'],['contract','What should a subtree return?'],['diameter-code','Compute diameter while returning heights'],['orders','When to record versus when to return'],['tree-lab','The call stack and returned heights'],['paths','Ancestor state flows downward'],['ancestor-code','Count nodes that meet every ancestor value'],['levels','A queue groups one depth at a time'],['level-code','Return values grouped by tree level'],['bst','BST order constrains entire subtrees'],['ancestors','An ancestor joins target evidence'],['serialization','Structure needs nulls or another contract'],['trie','Strings share prefix work'],['trie-code','Insert and query a prefix structure'],['trie-lab','A prefix is not necessarily a stored word'],['wildcards','Wildcards and boards branch through prefixes'],['wildcard-code','Search a dot-wildcard pattern'],['practice','Choose the meaning of every piece of state'],['sources','Sources and related patterns']];
treesSections.splice(treesSections.findIndex(([id])=>id==='paths'),0,['dfs-walk','Finish a branch before its siblings']);
treesSections.splice(treesSections.findIndex(([id])=>id==='bst'),0,['bfs-walk','Finish a level before the next']);
const children=[[1,2],[3,4],[null,null],[null,null],[null,null]],names=['A','B','C','D','E'],nodes=[{name:'A',x:250,y:45},{name:'B',x:130,y:140},{name:'C',x:370,y:140},{name:'D',x:60,y:250},{name:'E',x:200,y:250}],edges=[[0,1],[0,2],[1,3],[1,4]],initial=treeTrace(children,0,'post');
const treeBody=f=>`${graphSvg(nodes,edges,{active:f.active,done:f.heights.flatMap((h,i)=>h===null?[]:[i])})}<p>${f.message.replace(/node (\d)/g,(_,i)=>`node ${names[Number(i)]}`)}</p><p>Active calls, bottom → top: ${f.stack.map(i=>names[i]).join(' → ')||'empty'}. Recorded order: ${f.recorded.map(i=>names[i]).join(' → ')||'none'}.</p>${table('Returned subtree heights, counted in nodes',['A','B','C','D','E'],[f.heights.map(h=>h===null?'not returned':h)])}<p>Blue-filled nodes have returned heights. The blue outline marks the current event; returned nodes need not remain on the active stack.</p>`;
const treeLab=traceLab('tree-lab','The call stack and returned heights','Fixed tree A(B(D,E),C). Choose when visits are recorded. Height still needs child results and is computed on return.',initial,initial.length-1,treeBody).replace('<label>Step','<label>Recording order<select data-tree-order aria-label="Tree recording order"><option value="post">Postorder</option><option value="pre">Preorder</option><option value="in">Inorder</option></select></label><label>Step');
const words=['car','cart','cat','dog'];
const walkChildren=[[1,4,8],[2],[3],[],[5,7],[6],[],[],[9],[]];
const walkNodes=[['A',250,35],['B',90,110],['C',60,190],['D',60,270],['E',250,110],['F',200,190],['G',200,270],['H',300,190],['I',410,110],['J',430,190]].map(([name,x,y])=>({name,x,y}));
const walkEdges=walkChildren.flatMap((row,from)=>row.map(to=>[from,to])),walkFrames=orderedTreeTrace(walkChildren,'dfs');
const levelChildren=[[1,2],[3,4],[5,6],[],[],[],[]],levelFrames=orderedTreeTrace(levelChildren,'bfs');
const levelNodes=[['1',250,45],['2',130,140],['3',370,140],['4',60,250],['5',200,250],['6',310,250],['7',440,250]].map(([name,x,y])=>({name,x,y}));
const levelEdges=levelChildren.flatMap((row,from)=>row.map(to=>[from,to]));
function walkBody(f,nodes,edges,mode){return `<div class="ordered-tree-plot" tabindex="0" role="region" aria-label="${mode.toUpperCase()} tree diagram; scroll horizontally on narrow screens">${graphSvg(nodes,edges,{active:f.current,done:f.visited})}</div><p>Visited: ${f.visited.map(i=>nodes[i].name).join(' → ')||'none'}. Next-first ${mode==='dfs'?'pending stack':'queue'}: ${f.frontier.map(i=>nodes[i].name).join(' → ')||'empty'}.</p><p>${f.current===null?'Start with the root only.':`Visit ${nodes[f.current].name}, then ${mode==='dfs'?'push children right-to-left so the leftmost child is popped next':'append children left-to-right behind nodes already waiting'}.`} Blue fill means visited; the outline marks the current visit.</p>`;}
const dfsWalk=traceLab('dfs-walk','Finish a branch before its siblings','Ordered general tree, not a binary tree. Letters identify nodes; visit numbers are traversal positions, not stored values.',walkFrames,walkFrames.length-1,f=>walkBody(f,walkNodes,walkEdges,'dfs'),'The pending stack is displayed next-first, not in its storage order.');
const bfsWalk=traceLab('bfs-walk','Finish a level before the next','Fixed complete binary tree with node values 1…7. The queue is displayed front-first.',levelFrames,levelFrames.length-1,f=>walkBody(f,levelNodes,levelEdges,'bfs'),'Both visited order and remaining queue are available as text.');
function trieBody(query){const f=trieWalk(words,query);return `<pre class="trie-sketch">root
├─ c ─ a ─ r* ─ t*
│       └─ t*
└─ d ─ o ─ g*</pre><p>* marks a complete stored word; a prefix node can have children and still be terminal.</p><p>Query “${query}”: path ${f.path.map(i=>f.nodes[i].prefix||'root').join(' → ')}. ${f.exists?'All characters have an edge.':'The next character has no edge; stop.'}</p>${table('Different questions',['Prefix exists?','Exact stored word?'],[[f.exists?'yes':'no',f.exact?'yes':'no']])}<p>Stored words: car, cart, cat, dog. Looking up a query never adds a new node.</p>`;}
const trieLab=`<div id="trie-lab" class="topic-scene" data-trie-lab><h3>A prefix is not necessarily a stored word</h3><label>Query<select aria-label="Trie query"><option>ca</option><option>car</option><option>cart</option><option>cab</option><option>dog</option></select></label><div data-trie-body>${trieBody('ca')}</div></div>`;
export function treesReader(link){return topic(treesMeta,treesSections,'Use hierarchy to separate what flows down from what returns up.',`
<p>A rooted tree gives every nonroot node one parent. Recursing into a child solves a smaller tree; returning a summary lets the parent combine those results. A trie uses the same hierarchy to share work across strings with common prefixes.</p><p>Choose the state direction before the traversal: ancestor constraints travel downward, subtree facts return upward, and level grouping uses a queue. Those are different responsibilities even when the code visits the same nodes.</p>
${section('structure','A child is the root of another tree',`<p>A binary tree has at most two children per node. It is not automatically a binary search tree. General graphs can contain cycles or shared nodes, so their traversal needs separate visited-state rules.</p><pre tabindex="0" role="region" aria-label="Binary tree node Python"><code>class TreeNode:
    def __init__(self, value=0, left=None, right=None):
        self.value = value
        self.left = left
        self.right = right</code></pre><p>A tree can represent a document hierarchy or directory view. A real file system with symbolic links can introduce graph-like relationships; the model should state which edges are being traversed.</p><p>Balanced search-tree families constrain height so lookup remains logarithmic. AVL constrains local height differences; red-black trees enforce color/black-height rules instead. Red-black trees do not promise that every pair of child heights differs by at most one.</p>`)}
${section('contract','What should a subtree return?',`${eq("\\begin{aligned}h(\\varnothing)&=0\\\\h(v)&=1+\\max\\!\\bigl(h(v_{\\mathrm{left}}),h(v_{\\mathrm{right}})\\bigr)\\end{aligned}","A finite binary tree without cycles or shared-child ambiguity. Height counts nodes on a longest downward path, so a leaf has height1. Height in edges requires a different base convention; the returned height is not the global diameter.")}<pre tabindex="0" role="region" aria-label="Subtree height Python"><code>def height(node):
    if node is None:
        return 0
    left = height(node.left)
    right = height(node.right)
    return 1 + max(left, right)</code></pre><p>A diameter is not the returned height. At a node with child heights L,R, a path joining the two sides has ${inlineMath("L+R")} edges. Track the largest such candidate anywhere; return ${inlineMath("1+\\max(L,R)")} to the parent. Returning the global diameter instead would corrupt the parent's height calculation.</p><details id="diameter-code"><summary>Compute diameter while returning heights</summary><pre tabindex="0" role="region" aria-label="Tree diameter Python"><code>def diameter_of_binary_tree(root):
    diameter = 0
    def height(node):
        nonlocal diameter
        if node is None: return 0
        left = height(node.left)
        right = height(node.right)
        diameter = max(diameter, left + right)
        return 1 + max(left, right)
    height(root)
    return diameter</code></pre><p>The final diameter counts edges. An empty or single-node tree has diameter zero. The accumulator is local to each call, so repeated calls do not retain an earlier answer.</p></details><p>For AVL-style balance checking, combine both child heights and their balance flags. A sentinel can encode failure, but its meaning must not be confused with a valid height. For maximum path sum, return the best single downward branch; a path joining both sides cannot continue upward without branching again.</p>`)}
${section('orders','When to record versus when to return',`${table('Same DFS structure, different recording point',['Order','Position of work','Useful interpretation'],[['Preorder','Before left and right','Root-first output, cloning or prefix notation'],['Inorder','After left, before right','Sorted output only if BST ordering holds'],['Postorder','After both children','Heights, bottom-up aggregation or safe child-first release']])}<p>An iterative stack can express these orders too. To reproduce recursive return work, store a frame phase or push a separate exit event. A stack of nodes with only entry work does not automatically compute postorder child summaries.</p>${treeLab}`)}
${dfsWalk}
${table('DFS preorder on the ordered general tree',['Branch','Visit positions and nodes','Why the next branch waits'],[['Root, then left chain','1:A → 2:B → 3:C → 4:D','Return from D, C and B before E'],['Middle branch','5:E → 6:F → 7:G → 8:H','Finish F/G before E’s other child H'],['Right branch','9:I → 10:J','I waits until both earlier root branches finish']])}
<p>This root has three children, so binary-tree inorder does not define this traversal. Preorder visits a node before its children in the specified left-to-right order. The pending stack stores unexplored siblings; recursive execution also has active ancestor calls. Those are different views of the same visit order.</p><p>Maze exploration uses the same depth-first discipline. Cyclic passages require visited-state or path-local rules from <a href="${link('algorithms/graphs#reachability')}">Graph Algorithms</a>; a tree-only walk does not need them.</p>
${section('paths','Ancestor state flows downward',`<p>For path sums, pass the accumulated sum to each child. For nodes at least as large as every ancestor, pass the maximum seen on that root-to-node path; update it before entering the children. Root value or −∞ can initialize the maximum depending on the contract.</p><details id="ancestor-code"><summary>Count nodes that meet every ancestor value</summary><pre tabindex="0" role="region" aria-label="Ancestor maximum Python"><code>def count_good_nodes(root):
    def visit(node, path_max):
        if node is None: return 0
        good = int(node.value &gt;= path_max)
        next_max = max(path_max, node.value)
        return good + visit(node.left, next_max) + visit(node.right, next_max)
    return visit(root, root.value) if root is not None else 0</code></pre><p>Equality qualifies. Each child receives its own path maximum; sibling values cannot change the other branch. This function uses the TreeNode.value field defined above.</p></details><p>Branch-local immutable arguments avoid one branch overwriting another's state. If a shared list stores the path, append before descent and pop after return. Copy only when recording an output that must survive later mutation.</p><p>Node depth counts edges from the root; subtree height counts remaining depth below the node. Name the convention, especially when the diameter or longest path uses edge counts.</p>`)}
${section('levels','A queue groups one depth at a time',`<p>Breadth-first search processes nodes by root distance. Capture the queue length before each level, then pop exactly that many nodes while appending their children. Otherwise the same loop can accidentally consume the next level too.</p><details id="level-code"><summary>Return values grouped by tree level</summary><pre tabindex="0" role="region" aria-label="Level order Python"><code>def level_order(root):
    from collections import deque
    if root is None: return []
    queue, result = deque([root]), []
    while queue:
        level = []
        for _ in range(len(queue)):
            node = queue.popleft()
            level.append(node.value)
            if node.left is not None: queue.append(node.left)
            if node.right is not None: queue.append(node.right)
        result.append(level)
    return result</code></pre></details><p>The function returns complete level lists and imports deque itself. A binary-tree traversal visits n nodes in O(n) time. Recursive pending calls use O(h) space; BFS uses O(w) frontier space, where w is maximum level width. A skewed tree can make h=n.</p>`)}
${bfsWalk}
${table('Level grouping is fixed before children are appended',['Root distance in edges','Nodes processed','Queue after the whole level'],[['0','1','2,3'],['1','2,3','4,5,6,7'],['2','4,5,6,7','empty']])}
<p>Node 3 stays ahead of nodes 4 and 5 even after visiting node 2. That queue order explains why BFS finishes the current level first. The displayed tree numbers happen to match visit order; numeric sorting is not the algorithm.</p><p>A game-state graph can use BFS to enumerate reachable positions by move count. Chess decision-making is not simply shortest-path search: opponent responses require a different objective, such as minimax. For equal-cost edges, BFS finds minimum edge count; unequal edge costs require another algorithm.</p>
<p>Worked tree shapes and visit sequences: ${cite('https://www.youtube.com/watch?v=kp3fCihUXEg','Top 7 Algorithms for Coding Interviews Explained Simply')}. The diagrams add explicit node identities and pending frontiers. Playback timing is illustrative.</p>
${section('bst','BST order constrains entire subtrees',`<p>Under a distinct-key policy, every left-subtree value is below the node and every right-subtree value is above it. Checking only direct children misses a descendant that violates an ancestor's bound.</p><p>For example, root 10 with right child 15 and that child's left child 6 passes local child comparisons at 15 but violates root 10's right-subtree bound. Pass an open lower/upper interval down; every node must satisfy all inherited bounds.</p><p>A duplicate policy can instead permit equality on a specified side or store multiplicities at one node. Inorder is then nondecreasing, but the strict-bound validator must change. State the policy rather than mixing strict insertion with nonstrict validation.</p><p>Search, insertion and deletion cost O(h), not unconditionally O(log n). Balanced height makes that logarithmic. Random-input assumptions can produce an average-case statement; an arbitrary plain BST can become a chain.</p><p>The minimum is leftmost and maximum rightmost. A node with a right subtree has the right subtree's minimum as successor. Otherwise its successor is the first ancestor reached from a left branch; the maximum has none. Inorder selection finds the k-th key by traversal count, or subtree sizes can support rank/select.</p>`)}
${section('ancestors','An ancestor joins target evidence',`<p>In a general binary tree, a returned target or subtree candidate tells the parent which side contains evidence. One target from each child makes the current node the lowest common ancestor. If the current node is one target and the other is below it, the current node itself can be the answer.</p><p>The usual compact recursion assumes both targets exist. If existence is not guaranteed, also return presence counts/flags; otherwise one existing target may be incorrectly reported as a complete answer. Compare identity when distinct nodes can have equal values.</p><p>In a BST with known present distinct keys, both targets below or above the current value choose one branch. When they split—or one matches—the current node is their LCA. The ordering rule is an optimization of the same ancestor question.</p>`)}
${section('serialization','Structure needs nulls or another contract',`<p>A preorder list of values alone does not determine an arbitrary binary tree. Include explicit null-child markers, or use another representation with enough structural information. Deserialization consumes tokens in the same order and validates premature endings and leftover data.</p><p>Distinct-valued preorder plus inorder can reconstruct a binary tree under their shared-node contract. Duplicates need more information. Do not infer uniqueness from a traversal that intentionally discarded structure.</p>`)}
${section('trie','Strings share prefix work',`<p>Each edge consumes one character and each node represents the consumed prefix. Exact lookup requires both reaching the node and seeing its terminal marker. Prefix lookup needs only a successful path.</p><details id="trie-code"><summary>Insert and query a complete prefix structure</summary><pre tabindex="0" role="region" aria-label="Trie implementation Python"><code>class TrieNode:
    def __init__(self):
        self.children = {}
        self.is_word = False

class Trie:
    def __init__(self):
        self.root = TrieNode()
    def insert(self, word):
        node = self.root
        for char in word:
            if char not in node.children:
                node.children[char] = TrieNode()
            node = node.children[char]
        node.is_word = True
    def _find_node(self, text):
        node = self.root
        for char in text:
            if char not in node.children: return None
            node = node.children[char]
        return node
    def search(self, word):
        node = self._find_node(word)
        return node is not None and node.is_word
    def starts_with(self, prefix):
        return self._find_node(prefix) is not None</code></pre><p>The class is shown together so the read and write operations share one node contract. It stores Unicode code points without case folding or normalization. Repeated insertion does not add multiplicity; it records membership. Empty-prefix lookup succeeds even before inserting any word.</p></details><p>The read-only _find_node method never creates nodes. Insertion creates missing edges and marks the final node terminal. A stored empty string marks the root. A word can be a prefix of another word, so a terminal node may still have children.</p><p>Insert/exact/prefix lookup takes O(L) character-edge operations under bounded child lookup cost. Memory follows stored prefix nodes, not simply the number of words. Sparse child maps save unused alphabet slots; fixed arrays trade that memory for direct access. Alphabet/normalization policies remain explicit.</p>${trieLab}`)}
${section('wildcards','Wildcards and boards branch through prefixes',`<p>For an ordinary query character, follow its matching child. For a wildcard, explore every permitted child and succeed if one full query path ends at a terminal node. Search cost can grow with branching; it is not the exact lookup's O(L) guarantee.</p><details id="wildcard-code"><summary>Search a dot-wildcard pattern</summary><pre tabindex="0" role="region" aria-label="Wildcard trie search Python"><code>def wildcard_search(root, word):
    def visit(index, node):
        if index == len(word): return node.is_word
        char = word[index]
        if char == '.':
            return any(visit(index + 1, child)
                       for child in node.children.values())
        if char not in node.children: return False
        return visit(index + 1, node.children[char])
    return visit(0, root)</code></pre><p>A dot matches exactly one code point, not an arbitrary-length suffix. Query end checks is_word, so a matching nonterminal prefix is not enough. The function reads the trie without changing terminal markers or children.</p></details><p>Autocomplete walks the prefix once, then enumerates terminal descendants. Its cost includes output size. Terminal metadata can hold a word identifier, frequency or ranked candidate; storing complete strings at every internal node is often unnecessary.</p><p>For a board searched against many words, advance the trie alongside the board path. Reject a missing trie edge before further exploration. Mark a board cell used on the current path, then restore it on return. A global board visited set would incorrectly forbid reuse by a different starting path.</p><p>Emitting one terminal once can prevent duplicate output, but clearing its marker mutates the dictionary state. Restore or rebuild it if repeated queries must have the same behavior. Finding a shorter dictionary root can stop at the first terminal encountered during a word walk.</p>`)}
${section('practice','Choose the meaning of every piece of state',`<p>Before recursion, name the empty return value, the summary returned to a parent, the ancestor arguments and any global answer. Reset globals between independent calls. A traversal count, path state and subtree summary are not interchangeable.</p><p>Test empty and one-node trees, deep chains, broad levels, negative values, duplicate keys, an ancestor-bound violation and a missing LCA target. For tries, test a stored word that prefixes another, a prefix not inserted as a word, a missing edge and a wildcard that branches but never reaches a terminal.</p><p><a href="${link('algorithms/graphs')}">Graph visited/frontier state →</a> extends traversal to arbitrary connectivity. <a href="${link('algorithms/dp')}">Dynamic Programming →</a> shares the return-contract discipline but merges repeated logical states rather than assuming each subtree is unique.</p>`)}
${section('sources','Sources and related patterns',`<p>${cite('https://algs4.cs.princeton.edu/32bst/','BST subtree order and rank operations')} · ${cite('https://algs4.cs.princeton.edu/52trie/','Prefix structures and wildcard branching')}</p><p><a href="${link('algorithms/backtracking')}">Backtracking</a> explains board-path ownership and restoring visited cells.</p>`)}
`);}
treesMeta.searchText=treesReader(()=> '').replace(/<[^>]*>/g,' ');
export function mountTrees(scope=document){mountTopic(scope,treesMeta.slug,article=>{const lab=article.querySelector('[data-algorithm-lab="tree-lab"]'),order=lab.querySelector('[data-tree-order]');let frames=initial;const playback=rangePlayback(article,lab,i=>{lab.querySelector('[data-step]').textContent=i;lab.querySelector('[data-trace-body]').innerHTML=treeBody(frames[i]);},16000);order.addEventListener('change',()=>{playback.stop();frames=treeTrace(children,0,order.value);playback.render();});mountTrace(article,'dfs-walk',walkFrames,f=>walkBody(f,walkNodes,walkEdges,'dfs'));mountTrace(article,'bfs-walk',levelFrames,f=>walkBody(f,levelNodes,levelEdges,'bfs'));const trie=article.querySelector('[data-trie-lab]');trie.querySelector('select').addEventListener('change',e=>{trie.querySelector('[data-trie-body]').innerHTML=trieBody(e.target.value);});});}
