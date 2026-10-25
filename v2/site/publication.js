// Publication order is intentionally independent of updated/lastmod dates.
export function latestPublished(notes, limit=3) {
  return notes.filter(n=>n.tracked&&!n.prototype&&!n.navigationPage&&!n.draft&&!n.unlisted&&/^\d{4}-\d{2}-\d{2}$/.test(n.date||''))
    .sort((a,b)=>b.date.localeCompare(a.date)||a.title.localeCompare(b.title)||a.slug.localeCompare(b.slug))
    .slice(0,limit);
}

// Canonical topics use preserved publication dates, never reference-only edits.
export function latestAtlasPublished(notes, limit=3) {
  return latestPublished(notes.filter(n=>n.visibility==='public'&&n.kind==='dense-topic')
    .map(n=>({...n,tracked:true,prototype:false})),limit);
}
