import test from 'node:test';
import assert from 'node:assert/strict';
import * as timeline from '../src/timeline.js';
import {
  buildSegments, heroOpacity, sectionCopyOpacity, lingerEase, activeSectionIndex,
} from '../src/timeline.js';

const sections = [
  { scroll: 1.5, linger: 0.35 },
  { scroll: 1.25, linger: 0.2 },
  { scroll: 1.7, linger: 0.45 },
];
const connectors = ['c1.mp4', 'c2.mp4'];

test('segments begin after the hero and interleave dives with connectors', () => {
  const segments = buildSegments({ sections, connectors, diveScroll: 1.3, connScroll: 0.8, heroScroll: 0.65 });
  assert.deepEqual(segments.map(s => s.kind), ['dive', 'connector', 'dive', 'connector', 'dive']);
  assert.equal(segments[0].start, 0.65);
  assert.equal(segments[0].end, 2.15);
  assert.equal(segments.at(-1).end, 6.7);
});

test('hero and first case never compete at full opacity', () => {
  assert.equal(heroOpacity(0, 0.65), 1);
  assert.equal(heroOpacity(0.65, 0.65), 0);
  const first = { start: 0.65, end: 2.15 };
  assert.equal(sectionCopyOpacity({ index: 0, count: 3, position: 0.2, segment: first, hasHero: true }), 0);
  assert.ok(sectionCopyOpacity({ index: 0, count: 3, position: 1.1, segment: first, hasHero: true }) > 0.5);
});

test('linger remapping preserves exact endpoints and remains monotone', () => {
  assert.equal(lingerEase(0, 0.45), 0);
  assert.equal(lingerEase(1, 0.45), 1);
  const values = Array.from({ length: 21 }, (_, i) => lingerEase(i / 20, 0.45));
  assert.ok(values.every((value, i) => i === 0 || value >= values[i - 1]));
});

test('connector midpoint advances the active route to the incoming case', () => {
  const segments = buildSegments({ sections, connectors, diveScroll: 1.3, connScroll: 0.8, heroScroll: 0.65 });
  assert.equal(activeSectionIndex(segments[1].start + 0.1, segments, 3), 0);
  assert.equal(activeSectionIndex(segments[1].start + 0.7, segments, 3), 1);
});

test('segment blend weights form a complementary smooth dissolve at every seam', () => {
  assert.equal(typeof timeline.segmentBlendWeights, 'function');
  const { segmentBlendWeights } = timeline;
  const blendSegments = [
    { start: 0, end: 100 },
    { start: 100, end: 200 },
    { start: 200, end: 300 },
  ];

  assert.deepEqual(segmentBlendWeights(89, blendSegments, 20), [1, 0, 0]);
  assert.deepEqual(segmentBlendWeights(90, blendSegments, 20), [1, 0, 0]);
  assert.deepEqual(segmentBlendWeights(100, blendSegments, 20), [0.5, 0.5, 0]);
  assert.deepEqual(segmentBlendWeights(110, blendSegments, 20), [0, 1, 0]);
  assert.deepEqual(segmentBlendWeights(150, blendSegments, 20), [0, 1, 0]);
  assert.deepEqual(segmentBlendWeights(200, blendSegments, 20), [0, 0.5, 0.5]);

  const quarter = segmentBlendWeights(95, blendSegments, 20);
  assert.deepEqual(quarter, [0.84375, 0.15625, 0]);
  assert.equal(quarter[0] + quarter[1], 1);

  const threeQuarter = segmentBlendWeights(105, blendSegments, 20);
  assert.deepEqual(threeQuarter, [0.15625, 0.84375, 0]);
  assert.equal(threeQuarter[0] + threeQuarter[1], 1);
});
