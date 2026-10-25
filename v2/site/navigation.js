// Provisional browse mapping, not a completed semantic/editorial audit.
const labels={ai:'AI & Models',math:'Mathematics',algorithms:'Algorithms',systems:'Computing Systems',software:'Software & Tools',security:'Security',architectures:'Architectures',foundations:'Foundations',training:'Training',inference:'Inference & Serving',vision:'Computer Vision',nlp:'Language & Tokenization',diffusion:'Diffusion Models',models:'Models',attention:'Attention & Position',moe:'Mixture of Experts',recurrent:'Recurrent & Looped Models',optimization:'Optimization',rl:'Reinforcement Learning',scaling:'Scaling & Planning',precision:'Numerical Precision',losses:'Losses & Objectives',distributed:'Distributed Training',probability:'Probability & Information',statistics:'Statistics',calculus:'Calculus',linear:'Linear Algebra',structures:'Data Structures',patterns:'Problem-Solving Patterns',graphs:'Graphs & Traversal',trees:'Trees',dp:'Dynamic Programming',infrastructure:'Infrastructure',parallelism:'Parallel Computing',networking:'Networking',performance:'Performance',services:'Distributed Systems',python:'Python',profiling:'Profiling',debugging:'Debugging',writeups:'Security Writeups'};
export const name=id=>labels[id]||id.replaceAll('-',' ').replace(/\b\w/g,c=>c.toUpperCase());
export function organize(n){
  if(n.topicPath)return [...n.topicPath];
  const s=n.slug,t=n.tags.join(' ').toLowerCase();
  if(s.startsWith('ai/')){
    if(/moe/.test(s))return ['ai','architectures','moe'];
    if(/model-reports|model-families/.test(s))return ['ai','models'];
    if(/looped|recirculation|full-bandwidth/.test(s))return ['ai','architectures','recurrent'];
    if(/attention|rope|positional/.test(s))return ['ai','architectures','attention'];
    if(/training\/optimization\//.test(s)&&/reinforcement|grpo|rl-|agentic|harness|groupwise|entropy-control|distillation-in-rl|posterior-tempered/.test(s))return ['ai','training','rl'];
    if(s.includes('/training/')){const part=s.split('/')[2];return ['ai','training',{'distributed-optimization':'distributed',optimization:'optimization',scaling:'scaling',precision:'precision',losses:'losses'}[part]||'foundations'];}
    if(s.includes('/inference-serving/'))return ['ai','inference',s.split('/')[2]];
    if(s.includes('/modalities/'))return ['ai',{'computer-vision':'vision',nlp:'nlp','diffusion-models':'diffusion'}[s.split('/')[2]]||'foundations'];
    return ['ai',s.includes('/architectures/')?'architectures':'foundations'];
  }
  if(s.startsWith('math/'))return ['math',{'linear-algebra':'linear'}[s.split('/')[1]]||s.split('/')[1]];
  if(s.startsWith('systems/'))return ['systems',{'parallel-computing':'parallelism','distributed-systems':'services'}[s.split('/')[1]]||s.split('/')[1]];
  if(s.includes('brain-teaser'))return ['math','probability'];
  if(s.startsWith('interview-prep/system-design'))return ['systems','services'];
  if(s.startsWith('algorithms/')||s.startsWith('interview-prep/')){
    if(/trees|dfs/.test(t+' '+s))return ['algorithms','structures','trees'];
    if(/graph/.test(t+' '+s))return ['algorithms','patterns','graphs'];
    if(/dynamic-programming/.test(s))return ['algorithms','patterns','dp'];
    if(/heap|priority-queue|linked-list|tries|stack|arrays-and-hashing/.test(s))return ['algorithms','structures'];
    return ['algorithms','patterns'];
  }
  if(s.startsWith('security/'))return ['security','writeups'];
  return ['software',s.startsWith('programming/')?s.split('/')[1]:s.split('/')[1]||'foundations'];
}
export function makeTree(notes){
  const root={id:'',path:[],children:new Map(),notes:[]};
  for(const n of notes){n.browsePath=organize(n);let node=root;node.notes.push(n);for(const id of n.browsePath){if(!node.children.has(id))node.children.set(id,{id,path:[...node.path,id],children:new Map(),notes:[]});node=node.children.get(id);node.notes.push(n);}}
  return root;
}
export function findNode(root,path){let node=root;for(const id of path){node=node.children.get(id);if(!node)return null;}return node;}
export function immediateNotes(root,path){return (findNode(root,path)?.notes||[]).filter(n=>n.browsePath.length===path.length&&n.browsePath.every((id,i)=>id===path[i]));}
