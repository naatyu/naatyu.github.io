// Inbound-only notices. These are not migrated-content aliases or search entries.
const exercises = {
  '1-two-sum':'arrays', '1046-last-stone-weight':'ordering',
  '121-best-time-to-buy-and-sell':'arrays', '122-best-time-to-buy-and-sell-stock-ii':'greedy',
  '13-roman-to-integer':'numbers', '14-longest-common-prefix':'arrays',
  '169-majority-element':'arrays', '189-rotate-array':'windows',
  '2-palindrome-number':'numbers', '20-valid-parentheses':'stacks',
  '21-merge-two-sorted-lists':'linked-lists', '215-kth-largest-element-in-an-array':'ordering',
  '26-remove-duplicates-from-sorted-array':'windows', '27-remove-element':'windows',
  '274-h-index':'ordering', '380-insert-delete-getrandom-o-1':'arrays',
  '45-jump-game-ii':'greedy', '55-jump-game':'greedy',
  '80-remove-duplicates-from-sorted-array-ii':'windows', '88-merge-sorted-array':'windows',
};
export const retiredNavigation = Object.freeze({
  ...Object.fromEntries(Object.entries(exercises).map(([name, topic]) =>
    ['interview-prep/leetcode/'+name, {kind:'exercise', related:'algorithms/'+topic}])),
  'security/writeups/elf-arm-stack-buffer-overflow-basic':{kind:'challenge'},
  'security/writeups/elf-x86-race-condition':{kind:'challenge'},
  'ai/modalities/nlp/how-might-llms-store-facts':{kind:'incomplete'},
  'tooling/debugging/gdb':{kind:'incomplete'},
  'tooling/network-analysis/wireshark':{kind:'incomplete'},
});
export const isRetiredNote = slug => Object.hasOwn(retiredNavigation, slug);
const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function retirementNotice(slug, link, title) {
  if (!isRetiredNote(slug)) return '';
  const entry = retiredNavigation[slug];
  const reason = entry.kind === 'incomplete'
    ? 'This unfinished reference is no longer published in the atlas.'
    : entry.kind === 'challenge'
      ? 'Individual challenge write-ups are no longer published in the atlas.'
      : 'Individual exercise solutions are no longer published in the atlas.';
  const related = entry.related ? `<p>The related pattern reference covers general techniques, not this exercise solution.</p><a href="${escape(link(entry.related))}">${escape(title(entry.related))}</a>` : '';
  return `<section class="retirement-notice" aria-label="Retired page"><h1>This page has been retired</h1><p>${reason}</p>${related}<p><a href="${escape(link(''))}">Browse the Atlas</a></p></section>`;
}
