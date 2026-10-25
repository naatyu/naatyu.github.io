import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { heatTransport, powerPlacement, usefulCapacity } from '../prototypes/readers/hardware-model.js';

const close = (a, b) => assert.ok(Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(a), Math.abs(b)), `${a} != ${b}`);
let cases = 0;
for (const powerKW of [0, 10, 100, 120, 150]) for (const liquidFraction of [0, .25, .75, 1]) for (const flowLPM of [30, 60, 120, 240]) for (const densityKgL of [.8, 1]) for (const specificHeatKJKgK of [3, 4]) {
  const result = heatTransport({ powerKW, liquidFraction, flowLPM, densityKgL, specificHeatKJKgK });
  close(result.liquidKW + result.airKW, powerKW);
  close(result.deltaK * result.massKgS * specificHeatKJKgK, powerKW * liquidFraction);
  close(result.massKgS, flowLPM * densityKgL / 60);
  cases++;
}
for (const a of [0, 1, 2, 3]) for (const b of [0, 1, 2, 3]) for (const c of [0, 1, 2, 3]) for (let bits = 0; bits < 8; bits++) for (const siteKW of [0, 2, 5, 9]) {
  const rackKW = [a, b, c], assignment = [bits & 1, (bits >> 1) & 1, (bits >> 2) & 1], branchKW = [2, 4];
  const result = powerPlacement({ rackKW, assignment, branchKW, siteKW });
  const left = rackKW.filter((_, i) => assignment[i] === 0).reduce((s, x) => s + x, 0);
  const right = a + b + c - left;
  assert.deepEqual(result.loads, [left, right]);
  assert.equal(result.feasible, left <= 2 && right <= 4 && a + b + c <= siteKW);
  close(result.totalKW, left + right);
  cases++;
}
// Enough total power, but not at the assigned branch. Reassignment repairs it.
assert.equal(powerPlacement({ rackKW: [3, 3], assignment: [0, 0], branchKW: [4, 4], siteKW: 8 }).feasible, false);
assert.equal(powerPlacement({ rackKW: [3, 3], assignment: [0, 1], branchKW: [4, 4], siteKW: 8 }).feasible, true);
assert.equal(powerPlacement({ rackKW: [3, 3], assignment: [0, 1], branchKW: [4, 4], siteKW: 8 }).totalKW, 6);
for (const installedGPUs of [0, 1, 72, 576]) for (const intervalHours of [0, 1, 24, 168]) for (const uptime of [0, .5, .99, 1]) for (const productiveFraction of [0, .25, .8, 1]) {
  const r = usefulCapacity({ installedGPUs, intervalHours, uptime, productiveFraction });
  close(r.usefulGPUHours + r.downtimeGPUHours + r.availableUnusedGPUHours, installedGPUs * intervalHours);
  close(r.usefulGPUHours, installedGPUs * intervalHours * uptime * productiveFraction);
  cases++;
}
assert.throws(() => heatTransport({ powerKW: 120, liquidFraction: 1, flowLPM: 0, densityKgL: 1, specificHeatKJKgK: 4 }), RangeError);
assert.throws(() => powerPlacement({ rackKW: [1], assignment: [2], branchKW: [2], siteKW: 2 }), RangeError);
assert.throws(() => usefulCapacity({ installedGPUs: 72, intervalHours: 1, uptime: 2, productiveFraction: 1 }), RangeError);
const source = fs.readFileSync(new URL('../../docs/systems/infrastructure/high-density-gpu-infrastructure.md', import.meta.url));
assert.equal(crypto.createHash('sha256').update(source).digest('hex'), '6aca26bfd118e25f24af1fc4dcb2fdab97e0a0062c5f2f07ffc3addcd6d69647');
console.log(`GPU infrastructure foundations: ${cases} heat, placement and useful-capacity cases; original unchanged. Reader integration checked separately.`);
