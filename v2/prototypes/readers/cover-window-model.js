// Code-point ranges, inclusive endpoints; an empty target is excluded here.
export function coverTrace(text, target) {
  if (typeof text !== 'string' || typeof target !== 'string' || !target.length) throw new TypeError('Text and nonempty target strings required');
  const input = [...text], need = new Map(), counts = new Map(), frames = [];
  for (const char of target) need.set(char, (need.get(char) || 0) + 1);
  let left = 0, right = -1, formed = 0, best = null;
  const emit = event => frames.push({left, right, formed, required: need.size, counts: [...counts], best: best && [...best], event});
  emit('Empty range. No required count is satisfied.');
  for (right = 0; right < input.length; right++) {
    const char = input[right];
    counts.set(char, (counts.get(char) || 0) + 1);
    if (need.has(char) && counts.get(char) === need.get(char)) formed++;
    emit(`Add ${char} at ${right}. Check whether its required count has just been reached.`);
    while (formed === need.size) {
      if (!best || right - left < best[1] - best[0]) best = [left, right];
      emit('Coverage holds. Record this range before removing its leftmost character.');
      const departing = input[left];
      const breaksCoverage = need.has(departing) && counts.get(departing) === need.get(departing);
      if (breaksCoverage) formed--;
      counts.set(departing, counts.get(departing) - 1);
      if (!counts.get(departing)) counts.delete(departing);
      left++;
      const next = right + 1 < input.length ? 'Expand right next.' : 'No input remains; keep the best recorded range.';
      emit(breaksCoverage ? `Remove ${departing}. Its count falls below ${need.get(departing)}; coverage breaks. ${next}` : `Remove ${departing}. No required count falls below its threshold; coverage remains valid. Record the shorter range next.`);
    }
  }
  frames.at(-1).finished = true;
  return frames;
}
