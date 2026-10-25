// Shared search: normalized aliases, token-level edit distance, and ranked matches.
export const normalize = value => String(value).normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
export function distance(a, b) {
  const matrix=Array.from({length:a.length+1},(_,i)=>Array.from({length:b.length+1},(_,j)=>i===0?j:j===0?i:0));
  for(let i=1;i<=a.length;i++)for(let j=1;j<=b.length;j++){
    matrix[i][j]=Math.min(matrix[i-1][j]+1,matrix[i][j-1]+1,matrix[i-1][j-1]+(a[i-1]===b[j-1]?0:1));
    if(i>1&&j>1&&a[i-1]===b[j-2]&&a[i-2]===b[j-1])matrix[i][j]=Math.min(matrix[i][j],matrix[i-2][j-2]+1);
  }
  return matrix[a.length][b.length];
}
const aliases=[['moe','mixture of experts'],['dfs','depth first search'],['bfs','breadth first search'],['rl','reinforcement learning'],['dp','dynamic programming'],['llm','large language model'],['kv','key value']];
export function searchText(note) {
  let text=normalize([note.title,note.description,note.searchText||'',...(note.tags||[]),...(note.browsePath||[])].join(' '));
  for(const [short,long] of aliases) if(new RegExp(`\\b${short}\\b`).test(text)||text.includes(long)) text+=` ${short} ${long}`;
  return text;
}
export function rank(notes,query) {
  const q=normalize(query);
  const canonical=aliases.find(([short])=>short===q)?.[1]||q;
  if(!q)return notes.map(note=>({note,score:note.prototype?1:0})).sort((a,b)=>b.score-a.score);
  const tokens=q.split(' ').filter(w=>!['of','the','and','a','in'].includes(w));
  if(!tokens.length)return notes.map(note=>({note,score:0}));
  return notes.map(note=>{
    const text=searchText(note),title=normalize(note.title),words=text.split(' ');
    let score=title===canonical?80:title.includes(q)?40:text.includes(q)?20:0;
    for(const token of tokens){
      let best=-1;
      for(const word of words){
        let value=word===token?10:word.startsWith(token)?7:-1;
        const max=token.length>=8?2:token.length>=4?1:0;
        if(value<0&&max&&Math.abs(word.length-token.length)<=max){const d=distance(token,word);if(d<=max)value=4-d;}
        best=Math.max(best,value);
      }
      if(best<0)return null;
      score+=best+(title.includes(token)?8:0);
    }
    return {note,score};
  }).filter(Boolean).sort((a,b)=>b.score-a.score||a.note.title.localeCompare(b.note.title));
}
