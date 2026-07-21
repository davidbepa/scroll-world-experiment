import test from 'node:test';
import assert from 'node:assert/strict';
import { mountPosterWorld, renderPosterHTML } from '../src/poster-world.js';
import { CASES } from '../src/cases.js';

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
