import test from 'node:test';
import assert from 'node:assert/strict';
import {
  backgroundPreloadOrder,
  runPreloadQueue,
  selectPriorityIndices,
} from '../src/preload.js';

const segments = Array.from({ length: 7 }, (_, index) => ({
  start: index * 100,
  end: (index + 1) * 100,
  clip: `clip-${index}.mp4`,
}));

test('priority selection starts with the first three clips at the top', () => {
  assert.deepEqual(selectPriorityIndices(segments, 0), [0, 1, 2]);
});

test('priority selection centers a restored deep position when possible', () => {
  assert.deepEqual(selectPriorityIndices(segments, 450), [3, 4, 5]);
});

test('background order loads forward clips before earlier clips', () => {
  assert.deepEqual(backgroundPreloadOrder(segments, [3, 4, 5], 4), [6, 2, 1, 0]);
});

test('background queue never exceeds two active workers', async () => {
  const started = [];
  const releases = new Map();
  let active = 0;
  let peak = 0;
  const queue = runPreloadQueue([0, 1, 2, 3], index => new Promise(resolve => {
    started.push(index);
    active += 1;
    peak = Math.max(peak, active);
    releases.set(index, () => {
      active -= 1;
      resolve();
    });
  }), 2);

  await new Promise(resolve => setImmediate(resolve));
  assert.deepEqual(started, [0, 1]);
  releases.get(0)();
  await new Promise(resolve => setImmediate(resolve));
  assert.deepEqual(started, [0, 1, 2]);
  releases.get(1)();
  releases.get(2)();
  await new Promise(resolve => setImmediate(resolve));
  releases.get(3)();
  await queue;
  assert.equal(peak, 2);
});
