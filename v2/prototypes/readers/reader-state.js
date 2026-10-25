// Only explicitly registered teaching models are saved. Never replay clicks.
const models = new WeakMap();
const copy = value => JSON.parse(JSON.stringify(value));
export function registerReaderState(article, key, controller) {
  if (!article || !key || !['read','validate','write'].every(name => typeof controller?.[name] === 'function')) throw new TypeError('Reader state controller required');
  if (!models.has(article)) models.set(article, new Map());
  const entries = models.get(article);
  if (entries.has(key)) throw new Error('Duplicate reader state key: ' + key);
  entries.set(key, controller);
}
export function captureReaderModels(article) {
  return [...(models.get(article) || [])].map(([key, controller]) => {
    const state = controller.read();
    if (!controller.validate(state)) throw new Error('Invalid live reader state: ' + key);
    return {key, state: copy(state)};
  });
}
export function validReaderModels(article, saved) {
  const entries = [...(models.get(article) || [])];
  return Array.isArray(saved) && saved.length === entries.length && entries.every(([key, controller], i) => {
    try { return saved[i]?.key === key && controller.validate(saved[i].state) === true; }
    catch { return false; }
  });
}
export function restoreReaderModels(article, saved) {
  if (!validReaderModels(article, saved)) return false;
  for (const [i, [, controller]] of [...(models.get(article) || [])].entries()) controller.write(copy(saved[i].state));
  return true;
}
