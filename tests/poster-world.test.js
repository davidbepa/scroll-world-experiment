import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { mountPosterWorld, renderPosterHTML } from '../src/poster-world.js';
import { CASES, createWorldConfig } from '../src/cases.js';

test('poster mode renders all cases, proofs, sources, and final CTA', () => {
  const html = renderPosterHTML(CASES);
  assert.equal((html.match(/class="poster-case"/g) || []).length, 6);
  for (const scene of CASES) {
    assert.match(html, new RegExp(scene.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    assert.match(html, new RegExp(scene.proof.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    assert.match(html, new RegExp(scene.source.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
  assert.match(html, /Build what&#39;s next/);
});

test('poster mode escapes untrusted text', () => {
  const html = renderPosterHTML([{ ...CASES[0], title: '<script>alert(1)</script>' }]);
  assert.doesNotMatch(html, /<script>/);
  assert.match(html, /&lt;script&gt;/);
});

test('poster mode mounts its markup and mode on the container', () => {
  const container = { dataset: {}, innerHTML: '' };

  mountPosterWorld(container, CASES);

  assert.equal(container.dataset.mode, 'posters');
  assert.equal(container.innerHTML, renderPosterHTML(CASES));
});

test('runtime asset URLs resolve from the repository-root static server', () => {
  const html = renderPosterHTML(CASES);
  const config = createWorldConfig();

  assert.match(html, /src="public\/assets\/stills\/marinemax\.webp"/);
  assert.match(html, /this\.src='public\/assets\/fallback-system\.svg'/);
  assert.ok(config.sections.every(scene => scene.still.startsWith('public/assets/stills/')));
  assert.ok(config.sections.every(scene => scene.clip.startsWith('public/assets/video/')));
  assert.ok(config.connectors.every(path => path.startsWith('public/assets/video/')));
});

test('fallback artwork uses only the binding five-color palette', () => {
  const svg = readFileSync(new URL('../public/assets/fallback-system.svg', import.meta.url), 'utf8');
  const colors = svg.match(/#[0-9a-f]{6}/gi) || [];
  const palette = new Set(['#FFB800', '#6A2FF3', '#E1D5FD', '#1C1C1C', '#FFFFFF']);

  assert.ok(colors.length > 0);
  assert.deepEqual(colors.filter(color => !palette.has(color.toUpperCase())), []);
});
