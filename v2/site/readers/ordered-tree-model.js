// A rooted ordered tree, not a general graph with cycles or shared children.
export function orderedTreeTrace(children, mode = 'dfs') {
  if (!Array.isArray(children) || !['dfs','bfs'].includes(mode)) throw new TypeError('Ordered tree and dfs/bfs required');
  const parents = Array(children.length).fill(0);
  for (const row of children) {
    if (!Array.isArray(row)) throw new TypeError('Child lists required');
    for (const child of row) {
      if (!Number.isInteger(child) || child <= 0 || child >= children.length || ++parents[child] !== 1) throw new TypeError('Unique nonroot children required');
    }
  }
  if (parents.slice(1).some(count => count !== 1)) throw new TypeError('Every nonroot node needs one parent');
  const frontier = children.length ? [0] : [], visited = [], seen = new Set();
  const frames = [{current:null, visited:[], frontier:[...frontier]}];
  while (frontier.length) {
    const current = mode === 'dfs' ? frontier.pop() : frontier.shift();
    if (seen.has(current)) throw new TypeError('Cycle detected');
    seen.add(current); visited.push(current);
    frontier.push(...(mode === 'dfs' ? [...children[current]].reverse() : children[current]));
    frames.push({current, visited:[...visited], frontier:mode === 'dfs' ? [...frontier].reverse() : [...frontier]});
  }
  if (seen.size !== children.length) throw new TypeError('All nodes must be reachable from root');
  return frames;
}
