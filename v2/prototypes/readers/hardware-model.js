// Conceptual facility arithmetic, not a rack commissioning or protection model.
const positive = (x, name, zero = false) => {
  if (!Number.isFinite(x) || (zero ? x < 0 : x <= 0)) throw new RangeError(name);
  return x;
};
const fraction = (x, name) => {
  if (!Number.isFinite(x) || x < 0 || x > 1) throw new RangeError(name);
  return x;
};

export function heatTransport({ powerKW, liquidFraction, flowLPM, densityKgL, specificHeatKJKgK }) {
  positive(powerKW, 'power', true);
  fraction(liquidFraction, 'liquid fraction');
  positive(flowLPM, 'flow');
  positive(densityKgL, 'density');
  positive(specificHeatKJKgK, 'specific heat');
  const liquidKW = powerKW * liquidFraction;
  const airKW = powerKW - liquidKW;
  const massKgS = flowLPM * densityKgL / 60;
  const deltaK = liquidKW / (massKgS * specificHeatKJKgK);
  if (![liquidKW, airKW, massKgS, deltaK].every(Number.isFinite)) throw new RangeError('overflow');
  return { liquidKW, airKW, massKgS, deltaK };
}

// Fixed assignment: every rack belongs to one branch. Site and branch constraints
// are simultaneous; the smallest branch capacity is not the whole-site capacity.
export function powerPlacement({ rackKW, assignment, branchKW, siteKW }) {
  if (!Array.isArray(rackKW) || !Array.isArray(assignment) || !Array.isArray(branchKW) || !branchKW.length || rackKW.length !== assignment.length) throw new RangeError('shape');
  positive(siteKW, 'site', true);
  branchKW.forEach(x => positive(x, 'branch capacity', true));
  rackKW.forEach(x => positive(x, 'rack demand', true));
  const loads = branchKW.map(() => 0);
  rackKW.forEach((power, i) => {
    const branch = assignment[i];
    if (!Number.isInteger(branch) || branch < 0 || branch >= loads.length) throw new RangeError('branch index');
    loads[branch] += power;
  });
  const totalKW = rackKW.reduce((s, x) => s + x, 0);
  const marginsKW = loads.map((x, i) => branchKW[i] - x);
  const siteMarginKW = siteKW - totalKW;
  if (![totalKW, siteMarginKW, ...loads, ...marginsKW].every(Number.isFinite)) throw new RangeError('overflow');
  return { loads, totalKW, marginsKW, siteMarginKW, feasible: siteMarginKW >= 0 && marginsKW.every(x => x >= 0) };
}

export function usefulCapacity({ installedGPUs, intervalHours, uptime, productiveFraction }) {
  if (!Number.isSafeInteger(installedGPUs) || installedGPUs < 0) throw new RangeError('GPU count');
  positive(intervalHours, 'interval', true);
  fraction(uptime, 'uptime');
  fraction(productiveFraction, 'productive fraction');
  const installedGPUHours = installedGPUs * intervalHours;
  const availableGPUHours = installedGPUHours * uptime;
  const usefulGPUHours = availableGPUHours * productiveFraction;
  const downtimeGPUHours = installedGPUHours - availableGPUHours;
  const availableUnusedGPUHours = availableGPUHours - usefulGPUHours;
  if (![installedGPUHours, availableGPUHours, usefulGPUHours, downtimeGPUHours, availableUnusedGPUHours].every(Number.isFinite)) throw new RangeError('overflow');
  return { installedGPUHours, availableGPUHours, usefulGPUHours, downtimeGPUHours, availableUnusedGPUHours };
}
