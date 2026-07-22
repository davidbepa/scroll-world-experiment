import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const styles = await readFile(new URL('../src/styles.css', import.meta.url), 'utf8');

test('header contact CTA removes only its own text decoration', () => {
  const contactRule = styles.match(/\.site-header \.site-contact\s*\{([^}]*)\}/)?.[1] ?? '';
  assert.match(contactRule, /text-decoration\s*:\s*none\s*;/);
  assert.match(styles, /\.site-header a,\.poster-case a\s*\{[^}]*text-decoration-thickness\s*:\s*2px;/);
});

test('desktop film mirrors right-aligned copy and removes only the vertical route rail', () => {
  assert.match(styles, /\.sw-root \.sw-copy-backdrop\s*\{[^}]*background\s*:/);
  assert.match(
    styles,
    /\.sw-root \.sw-copy\[data-side="right"\],\.sw-root \.sw-hero\[data-side="right"\]\s*\{[^}]*left\s*:\s*auto\s*;[^}]*right\s*:\s*clamp\(24px,6vw,88px\)\s*;[^}]*text-align\s*:\s*right\s*;/,
  );
  assert.match(styles, /\[data-side="right"\] \.sw-copy__body,[^{]*\[data-side="right"\] \.sw-hero__body\s*\{[^}]*margin-left\s*:\s*auto\s*;/);
  assert.match(styles, /\[data-side="right"\] \.sw-copy__tags,[^{]*\[data-side="right"\] \.sw-copy__cta\s*\{[^}]*justify-content\s*:\s*flex-end\s*;/);
  assert.match(styles, /\.sw-root \.sw-route\s*\{[^}]*display\s*:\s*none\s*;/);
  assert.match(styles, /\.sw-root \.sw-status\s*\{[^}]*display\s*:\s*flex\s*;/);
  assert.doesNotMatch(styles, /\.sw-root \.sw-copylayer::before/);
});
