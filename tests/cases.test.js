import test from 'node:test';
import assert from 'node:assert/strict';
import { CASES, CONNECTORS, createWorldConfig } from '../src/cases.js';

const expectedIds = [
  'marinemax',
  'southeast-toyota-finance',
  'iata',
  'aspen-snowmass',
  'honda-powersports',
  'seaworld',
];

test('case manifest preserves approved order and completeness', () => {
  assert.deepEqual(CASES.map(({ id }) => id), expectedIds);
  assert.equal(CONNECTORS.length, CASES.length - 1);
  for (const scene of CASES) {
    assert.ok(scene.label);
    assert.ok(scene.eyebrow);
    assert.ok(scene.title);
    assert.ok(scene.body);
    assert.equal(scene.tags.length, 3);
    assert.match(scene.still, /^public\/assets\/stills\/.+\.webp$/);
    assert.match(scene.clip, /^public\/assets\/video\/.+\.mp4$/);
    assert.equal('clipMobile' in scene, false);
    assert.equal('stillMobile' in scene, false);
  }
});

test('hero and finale CTAs are exact', () => {
  const config = createWorldConfig();
  assert.equal(config.hero.title, 'Experience is your growth system.');
  assert.equal(config.hero.scroll, 0.65);
  assert.equal(config.sections.at(-1).cta.primary.label, "Build what's next");
  assert.equal(config.sections.at(-1).cta.primary.href, 'https://www.verndale.com/contact-us');
  assert.equal(config.mobileMode, 'posters');
});

test('hero and case copy sides match the approved desktop composition', () => {
  const config = createWorldConfig();
  assert.equal(config.hero.copySide, 'right');
  assert.deepEqual(
    config.sections.map(({ copySide }) => copySide),
    ['right', 'left', 'left', 'right', 'right', 'left'],
  );
});

test('updated connector 4 has a distinct runtime cache key', () => {
  assert.equal(CONNECTORS[3], 'public/assets/video/connector-4.mp4?v=87b2bbc');
  assert.deepEqual(
    CONNECTORS.filter((_, index) => index !== 3),
    [1, 2, 3, 5].map(index => `public/assets/video/connector-${index}.mp4`),
  );
});

test('desktop connectors use the approved slower scroll span', () => {
  const config = createWorldConfig();
  assert.equal(config.connScroll, 1.2);
  assert.equal(config.crossfade, 0.08);
});

test('connector 4 fades into scene 5 over the extended band', () => {
  const config = createWorldConfig();
  assert.deepEqual(
    config.sections.map(({ crossfadeIn }) => crossfadeIn ?? null),
    [null, null, null, null, 0.16, null],
  );
});
