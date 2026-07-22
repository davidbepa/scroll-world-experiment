import test from 'node:test';
import assert from 'node:assert/strict';
import * as timeline from '../src/timeline.js';
import {
  buildSegments, heroOpacity, sectionCopyOpacity, lingerEase, activeSectionIndex,
  segmentLayerOpacities, segmentMediaProgress, nextMediaProgress,
  shouldSnapToSeamEndpoint, sectionPresentationSegment, mediaAtEdge,
  shouldHoldSeamEndpoint,
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

test('segment layer opacities preserve full composited coverage at every seam', () => {
  assert.equal(typeof timeline.segmentLayerOpacities, 'function');
  assert.equal('segmentBlendWeights' in timeline, false);
  const { segmentLayerOpacities } = timeline;
  const blendSegments = [
    { start: 0, end: 100 },
    { start: 100, end: 200 },
    { start: 200, end: 300 },
  ];
  const coverage = ([lower, upper]) => upper + lower * (1 - upper);

  assert.deepEqual(segmentLayerOpacities(89, blendSegments, 20), [1, 0, 0]);
  assert.deepEqual(segmentLayerOpacities(90, blendSegments, 20), [1, 0, 0]);
  assert.deepEqual(segmentLayerOpacities(100, blendSegments, 20), [1, 0.5, 0]);
  assert.deepEqual(segmentLayerOpacities(110, blendSegments, 20), [1, 1, 0]);
  assert.deepEqual(segmentLayerOpacities(111, blendSegments, 20), [0, 1, 0]);
  assert.deepEqual(segmentLayerOpacities(150, blendSegments, 20), [0, 1, 0]);
  assert.deepEqual(segmentLayerOpacities(200, blendSegments, 20), [0, 1, 0.5]);

  const quarter = segmentLayerOpacities(95, blendSegments, 20);
  assert.deepEqual(quarter, [1, 0.15625, 0]);
  assert.equal(coverage(quarter.slice(0, 2)), 1);

  const midpoint = segmentLayerOpacities(100, blendSegments, 20);
  assert.equal(coverage(midpoint.slice(0, 2)), 1);

  const threeQuarter = segmentLayerOpacities(105, blendSegments, 20);
  assert.deepEqual(threeQuarter, [1, 0.84375, 0]);
  assert.equal(coverage(threeQuarter.slice(0, 2)), 1);

  const secondMidpoint = segmentLayerOpacities(200, blendSegments, 20);
  assert.equal(coverage(secondMidpoint.slice(1, 3)), 1);
});

test('an incoming segment can lengthen only its own crossfade band', () => {
  const blendSegments = [
    { start: 0, end: 100 },
    { start: 100, end: 200 },
    { start: 200, end: 300, crossfadeIn: 40 },
  ];

  assert.deepEqual(segmentLayerOpacities(85, blendSegments, 20), [1, 0, 0]);
  assert.deepEqual(segmentLayerOpacities(100, blendSegments, 20), [1, 0.5, 0]);
  assert.deepEqual(segmentLayerOpacities(185, blendSegments, 20), [0, 1, 0.04296875]);
  assert.deepEqual(segmentLayerOpacities(200, blendSegments, 20), [0, 1, 0.5]);
});

test('an after-boundary crossfade holds the outgoing segment through the endpoint', () => {
  const blendSegments = [
    { start: 0, end: 100 },
    { start: 100, end: 200 },
    { start: 200, end: 300, crossfadeIn: 40, crossfadeAfter: true },
  ];

  assert.deepEqual(segmentLayerOpacities(199, blendSegments, 20), [0, 1, 0]);
  assert.deepEqual(segmentLayerOpacities(200, blendSegments, 20), [0, 1, 0]);
  assert.deepEqual(segmentLayerOpacities(210, blendSegments, 20), [0, 1, 0.15625]);
  assert.deepEqual(segmentLayerOpacities(220, blendSegments, 20), [0, 1, 0.5]);
  assert.deepEqual(segmentLayerOpacities(240, blendSegments, 20), [0, 1, 1]);
  assert.deepEqual(segmentLayerOpacities(241, blendSegments, 20), [0, 0, 1]);

  blendSegments[2].transitionComplete = false;
  assert.deepEqual(segmentLayerOpacities(241, blendSegments, 20), [0, 1, 1]);
  blendSegments[2].transitionComplete = true;
  assert.deepEqual(segmentLayerOpacities(241, blendSegments, 20), [0, 0, 1]);

  assert.deepEqual(
    segmentLayerOpacities(210, blendSegments, 20, () => false),
    [0, 1, 0],
  );
  assert.deepEqual(
    segmentLayerOpacities(210, blendSegments, 20, () => true),
    [0, 1, 0.15625],
  );
});

test('an after-boundary scene holds frame zero until its crossfade completes', () => {
  const segment = {
    start: 200,
    end: 400,
    crossfadeIn: 40,
    crossfadeAfter: true,
  };

  assert.equal(segmentMediaProgress(200, segment), 0);
  assert.equal(segmentMediaProgress(220, segment), 0);
  assert.equal(segmentMediaProgress(240, segment), 0);
  segment.transitionComplete = false;
  assert.equal(segmentMediaProgress(280, segment), 0);
  segment.transitionComplete = true;
  assert.equal(segmentMediaProgress(280, segment), 0.25);
  assert.equal(segmentMediaProgress(400, segment), 1);
});

test('an endpoint handoff bypasses scrub easing so the connector cannot lag', () => {
  assert.equal(nextMediaProgress(0.8, 1, { snap: true }), 1);
  assert.ok(Math.abs(nextMediaProgress(0.8, 1) - 0.836) < Number.EPSILON);
});

test('an after-boundary handoff seeks the outgoing endpoint before blending', () => {
  const connector = { start: 100, end: 200 };
  const incoming = {
    start: 200,
    end: 400,
    crossfadeIn: 40,
    crossfadeAfter: true,
  };

  assert.equal(shouldSnapToSeamEndpoint(159, connector, incoming, 20), false);
  assert.equal(shouldSnapToSeamEndpoint(160, connector, incoming, 20), true);
  assert.equal(shouldSnapToSeamEndpoint(200, connector, incoming, 20), true);
});

test('a reverse handoff holds the connector endpoint until the scene is hidden', () => {
  assert.equal(shouldHoldSeamEndpoint({ crossfadeAfter: true, transitionHidden: true }), false);
  assert.equal(shouldHoldSeamEndpoint({ crossfadeAfter: true, transitionHidden: false }), true);
  assert.equal(shouldHoldSeamEndpoint({ crossfadeAfter: false, transitionHidden: false }), false);
});

test('scene copy stays hidden until an after-boundary crossfade completes', () => {
  const segment = { start: 10.85, end: 12.1 };
  const presentation = sectionPresentationSegment(segment, {
    crossfadeIn: 0.16,
    crossfadeAfter: true,
  });

  assert.equal(presentation.start, 11.01);
  assert.equal(sectionCopyOpacity({
    index: 4,
    count: 6,
    position: 10.95,
    segment: presentation,
    hasHero: true,
  }), 0);
});

test('media edge locking uses decoded frame state rather than scroll target state', () => {
  const segment = {
    hasClip: true,
    ready: true,
    failed: false,
    video: { currentTime: 4.1, duration: 5.041667, seeking: false },
  };

  assert.equal(mediaAtEdge(segment, 'end'), false);
  segment.video.currentTime = 5.036625;
  assert.equal(mediaAtEdge(segment, 'end'), true);
  segment.video.seeking = true;
  assert.equal(mediaAtEdge(segment, 'end'), false);
  segment.video.seeking = false;
  segment.video.currentTime = 0;
  assert.equal(mediaAtEdge(segment, 'start'), true);
});
