import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const styles = await readFile(new URL('../src/styles.css', import.meta.url), 'utf8');

test('header contact CTA removes only its own text decoration', () => {
  const contactRule = styles.match(/\.site-header \.site-contact\s*\{([^}]*)\}/)?.[1] ?? '';
  assert.match(contactRule, /text-decoration\s*:\s*none\s*;/);
  assert.match(styles, /\.site-header a,\.poster-case a\s*\{[^}]*text-decoration-thickness\s*:\s*2px;/);
});
