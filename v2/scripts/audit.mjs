import {readFile, readdir, mkdir, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import matter from 'gray-matter';
import {execFileSync} from 'node:child_process';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const trackedFiles = new Set(execFileSync('git', ['ls-files', 'docs'], {cwd: root, encoding: 'utf8'}).trim().split('\n'));
async function walk(dir) {
  const entries = await readdir(dir, {withFileTypes: true});
  const nested = await Promise.all(entries.map(e => e.isDirectory() ? walk(path.join(dir, e.name)) : path.join(dir, e.name)));
  return nested.flat();
}
const files = (await walk(path.join(root, 'docs'))).filter(f => /\.mdx?$/.test(f));
const iso = value => value ? new Date(value).toISOString().slice(0, 10) : null;
const plain = text => text.replace(/!\[[^\]]*\]\([^)]*\)/g, '').replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/[*`#]/g, '').replace(/\s+/g, ' ').trim();
const notes = await Promise.all(files.map(async file => {
  const raw = await readFile(file, 'utf8');
  const {data, content} = matter(raw);
  const relative = path.relative(path.join(root, 'docs'), file);
  const slug = relative.replace(/\.mdx?$/, '');
  const summary = content.match(/## Summary\s*\n([\s\S]*?)(?=\n#|$)/)?.[1] || content;
  const headings = [...content.matchAll(/^#{1,4}\s+(.+)$/gm)].map(m => m[1]);
  const refs = [...content.matchAll(/\]\((\/atlas\/[^)#\s]+)(?:#[^)]*)?\)/g)].map(m => m[1]);
  const words = plain(content).split(' ').length;
  const flags = [];
  if (/\[One sentence summary\]|\[TODO\]|\bTBD\b/.test(content)) flags.push('placeholder content');
  if (words < 180) flags.push('short reference: consider grouping, preserve standalone utility');
  if (!data.title) flags.push('missing title');
  if (!data.date) flags.push('missing publication date');
  const sourcePath = path.relative(root, file);
  const route = data.slug?.startsWith('/') ? `/atlas${data.slug}` : `/atlas/${data.slug || slug}`;
  return {slug, route, tracked: trackedFiles.has(sourcePath), navigationPage: slug === 'index', file: sourcePath, title: data.title || headings[0] || slug, date: iso(data.date), updated: iso(data.lastmod), topic: slug.split('/')[0], tags: data.tags || [], draft: !!data.draft, unlisted: !!data.unlisted, description: plain(summary).slice(0, 260), headings, refs, words, format: file.endsWith('.mdx') ? 'mdx' : 'md', flags, review: 'pending editorial review', conversion: 'pending learning-format conversion'};
}));
notes.sort((a,b) => a.slug.localeCompare(b.slug));
const groups = Object.groupBy(notes, n => n.topic);
const duplicates = Object.values(Object.groupBy(notes, n => n.title.toLowerCase())).filter(g => g.length > 1);
const inventory = {generated: '2026-10-02', total: notes.length, topics: Object.fromEntries(Object.entries(groups).map(([k,v]) => [k,v.length])), notes};
await mkdir(path.join(root, 'v2/prototypes'), {recursive: true});
await mkdir(path.join(root, '.internal/v2'), {recursive: true});
// Do not publish local/private metadata and rely on client-side filtering.
await writeFile(path.join(root, '.internal/v2/source-inventory.json'), JSON.stringify(inventory, null, 2) + '\n');
const publicNotes=notes.filter(n=>n.tracked&&!n.navigationPage&&!n.draft&&!n.unlisted);
const publicInventory={generated:inventory.generated,total:publicNotes.length,notes:publicNotes};
await writeFile(path.join(root, 'v2/prototypes/catalog.json'), JSON.stringify(publicInventory, null, 2) + '\n');
const rows = notes.map(n => `| ${n.file} | ${n.words} | ${n.format} | ${n.flags.join('; ') || '-'} | Pending |`).join('\n');
const report = `# V2 content inventory\n\nGenerated 2026-10-02. ${notes.length} source notes, including unpublished local content. This is a complete structural inventory, not a claim that every technical assertion or merge has been reviewed. All notes remain pending editorial review and learning-format conversion.\n\n## Topics\n\n${Object.entries(groups).map(([k,v]) => `- ${k}: ${v.length}`).join('\n')}\n\n## Duplicate titles\n\n${duplicates.length ? duplicates.map(g => '- ' + g.map(n => n.file).join(' / ')).join('\n') : 'No exact duplicate titles.'}\n\n## Candidate consolidations to review\n\nThese are hypotheses; do not delete or merge until source content, unique examples, backlinks, and destination anchors are reviewed.\n\n- Entropy / cross-entropy loss / KL divergence: unified interactive foundation with distinct anchored sections; preserve specialized loss and application material.\n- Heap / priority queues / NeetCode heap / top-k patterns: separate data-structure foundation from task patterns; remove duplicate introductions after review.\n- Trees / NeetCode trees: compare fundamentals with interview patterns before merging.\n- Parallelism fundamentals / training-parallelism rooflines: build a learning path; overlapping subject matter alone does not justify merging.\n- RL fundamentals / GRPO / RLVR / interview guides: map foundational concepts and applications; retain implementation and interview-specific material when it serves a separate reader need.\n\n## Internal sources\n\n- .agents/skills/research-learning-notes/SKILL.md: preserve evidence, teaching, provenance, and accessibility rules; framework-specific rules need migration after design approval.\n- README.md: replace starter documentation at platform implementation.\n- .internal/v2/authoring-contract.md: v2 conventions and conversion definition of done.\n- docusaurus.config.ts / sidebars.ts / plugins/latest-atlas-notes: capture routing, visibility, search, and original-publication-date behavior before replacement.\n\n## Per-note tracking\n\n| Source | Words (approx.) | Format | Structural flags | Editorial review |\n| --- | ---: | --- | --- | --- |\n${rows}\n`;
await writeFile(path.join(root, '.internal/v2/content-inventory.md'), report);
console.log(`Inventoried ${notes.length} notes; ${notes.filter(n => n.flags.length).length} flagged for structural review. No source notes changed.`);
