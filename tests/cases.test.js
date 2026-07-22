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
  assert.equal(config.hero.copySide, 'left');
  assert.deepEqual(
    config.sections.map(({ copySide }) => copySide),
    ['right', 'left', 'left', 'right', 'right', 'left'],
  );
});
