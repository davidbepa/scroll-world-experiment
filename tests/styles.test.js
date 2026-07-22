import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const styles = await readFile(new URL('../src/styles.css', import.meta.url), 'utf8');
const engine = await readFile(new URL('../src/scroll-world.js', import.meta.url), 'utf8');
const index = await readFile(new URL('../index.html', import.meta.url), 'utf8');

function atRuleBlock(css, atRule) {
  const start = css.indexOf(atRule);
  assert.notEqual(start, -1, `missing ${atRule}`);

  const openingBrace = css.indexOf('{', start);
  let depth = 0;
  for (let index = openingBrace; index < css.length; index += 1) {
    if (css[index] === '{') depth += 1;
    if (css[index] === '}') depth -= 1;
    if (depth === 0) return css.slice(openingBrace + 1, index);
  }

  assert.fail(`unterminated ${atRule}`);
}

test('header navigation and contact CTA remove their own text decoration', () => {
  const navRule = styles.match(/\.site-header nav a\s*\{([^}]*)\}/)?.[1] ?? '';
  const contactRule = styles.match(/\.site-header \.site-contact\s*\{([^}]*)\}/)?.[1] ?? '';
  assert.match(navRule, /text-decoration\s*:\s*none\s*;/);
  assert.match(contactRule, /text-decoration\s*:\s*none\s*;/);
  assert.match(styles, /\.site-header a,\.poster-case a\s*\{[^}]*text-decoration-thickness\s*:\s*2px;/);
});

test('desktop-only film layout preserves global skin and engine mobile behavior', () => {
  const desktopFilm = atRuleBlock(styles, '@media (min-width:861px)');
  const globalStyles = styles.replace(`@media (min-width:861px) {${desktopFilm}}`, '');
  const engineDesktop = atRuleBlock(engine, '@media(min-width:861px)');
  const engineOutsideDesktop = engine.replace(`@media(min-width:861px){${engineDesktop}}`, '');
  const engineMobile = atRuleBlock(engine, '@media(max-width:860px)');

  assert.match(
    desktopFilm,
    /\.sw-root \.sw-copy\[data-side="right"\],\.sw-root \.sw-hero\[data-side="right"\]\s*\{[^}]*left\s*:\s*auto\s*;[^}]*right\s*:\s*clamp\(24px,6vw,88px\)\s*;[^}]*text-align\s*:\s*right\s*;/,
  );
  assert.match(desktopFilm, /\[data-side="right"\] \.sw-copy__body,[^{]*\[data-side="right"\] \.sw-hero__body\s*\{[^}]*margin-left\s*:\s*auto\s*;/);
  assert.match(desktopFilm, /\[data-side="right"\] \.sw-copy__tags,[^{]*\[data-side="right"\] \.sw-copy__cta\s*\{[^}]*justify-content\s*:\s*flex-end\s*;/);
  assert.match(desktopFilm, /\.sw-root \.sw-route\s*\{[^}]*display\s*:\s*none\s*;/);
  assert.match(desktopFilm, /\.sw-root \.sw-status\s*\{[^}]*display\s*:\s*flex\s*;/);
  assert.doesNotMatch(globalStyles, /\.sw-root \.sw-copy\[data-side="right"\]/);
  assert.doesNotMatch(globalStyles, /\.sw-root \[data-side="right"\] \.sw-copy__body/);
  assert.doesNotMatch(globalStyles, /\.sw-root \.sw-status\s*\{/);
  assert.match(globalStyles, /\.sw-root \.sw-copy-backdrop\s*\{[^}]*background\s*:/);
  assert.match(globalStyles, /\.sw-root \.sw-copy__eyebrow,\.sw-root \.sw-hero__eyebrow\s*\{[^}]*color\s*:\s*var\(--purple\)\s*;/);
  assert.match(globalStyles, /\.sw-root \.sw-copy__title,\.sw-root \.sw-hero__title\s*\{[^}]*font-family\s*:/);
  assert.match(globalStyles, /\.sw-root \.sw-copy__body,\.sw-root \.sw-hero__body\s*\{[^}]*font-family\s*:/);
  assert.match(globalStyles, /\.sw-root \.sw-btn--primary\s*\{[^}]*background\s*:\s*var\(--yellow\)\s*;/);
  assert.match(globalStyles, /\.sw-root \.sw-status__bar i\s*\{[^}]*background\s*:\s*var\(--purple\)\s*;/);
  assert.match(globalStyles, /\.sw-root \.sw-hint\s*\{[^}]*display\s*:\s*none\s*;/);
  assert.doesNotMatch(desktopFilm, /\.sw-root \.sw-copy-backdrop\s*\{/);
  assert.doesNotMatch(desktopFilm, /\.sw-root \.sw-copy__eyebrow,\.sw-root \.sw-hero__eyebrow\s*\{/);
  assert.doesNotMatch(desktopFilm, /\.sw-root \.sw-copy__title,\.sw-root \.sw-hero__title\s*\{/);
  assert.doesNotMatch(desktopFilm, /\.sw-root \.sw-copy__body,\.sw-root \.sw-hero__body\s*\{/);
  assert.doesNotMatch(desktopFilm, /\.sw-root \.sw-btn--primary\s*\{/);
  assert.doesNotMatch(desktopFilm, /\.sw-root \.sw-status__bar i\s*\{/);
  assert.doesNotMatch(desktopFilm, /\.sw-root \.sw-hint\s*\{/);
  assert.match(engineDesktop, /\.sw-copy\[data-side="right"\],\.sw-hero\[data-side="right"\]\{left:auto;right:clamp\(18px,5vw,64px\);text-align:right;\}/);
  assert.match(engineDesktop, /\.sw-copy\[data-side="right"\] \.sw-copy__body,\.sw-hero\[data-side="right"\] \.sw-hero__body\{margin-left:auto;\}/);
  assert.match(engineDesktop, /\.sw-copy\[data-side="right"\] \.sw-copy__tags,\.sw-copy\[data-side="right"\] \.sw-copy__cta\{justify-content:flex-end;\}/);
  assert.doesNotMatch(engineOutsideDesktop, /\.sw-copy\[data-side="right"\],\.sw-hero\[data-side="right"\]\{left:auto;right:clamp\(18px,5vw,64px\);text-align:right;\}/);
  assert.doesNotMatch(engineOutsideDesktop, /\.sw-copy\[data-side="right"\] \.sw-copy__body,\.sw-hero\[data-side="right"\] \.sw-hero__body\{margin-left:auto;\}/);
  assert.doesNotMatch(engineOutsideDesktop, /\.sw-copy\[data-side="right"\] \.sw-copy__tags,\.sw-copy\[data-side="right"\] \.sw-copy__cta\{justify-content:flex-end;\}/);
  assert.match(engineMobile, /\.sw-copy,\.sw-copy\[data-side="right"\],\.sw-hero\{left:clamp\(18px,5vw,64px\);right:clamp\(18px,5vw,64px\);/);
  assert.match(engineMobile, /\.sw-status\{display:none;\}/);
  assert.doesNotMatch(desktopFilm, /\.sw-root \.sw-copylayer::before/);
});

test('scene copy overlay and desktop header use the approved gradients', () => {
  const desktopFilm = atRuleBlock(styles, '@media (min-width:861px)');
  const backdropRule = styles.match(/\.sw-root \.sw-copy-backdrop\s*\{([^}]*)\}/)?.[1] ?? '';
  const headerRule = desktopFilm.match(/\.site-header\s*\{([^}]*)\}/)?.[1] ?? '';

  assert.match(
    backdropRule,
    /background:linear-gradient\(90deg,color-mix\(in srgb,var\(--lavender\) 96%,transparent\) 0%,color-mix\(in srgb,var\(--lavender\) 80%,transparent\) 28%,color-mix\(in srgb,var\(--lavender\) 38%,transparent\) 56%,transparent 78%\);/,
  );
  assert.match(
    headerRule,
    /background:linear-gradient\(180deg,color-mix\(in srgb,var\(--white\) 96%,transparent\) 0%,color-mix\(in srgb,var\(--white\) 76%,transparent\) 55%,transparent 100%\);/,
  );
  assert.doesNotMatch(headerRule, /var\(--(?:lavender|purple)\)/);
});

test('header uses the supplied official logo asset', async () => {
  const logo = await readFile(
    new URL('../public/assets/brand/verndale-logo.svg', import.meta.url),
    'utf8',
  ).catch(() => '');

  assert.match(
    index,
    /<a class="site-brand" href="https:\/\/www\.verndale\.com\/" aria-label="Verndale home"><img src="public\/assets\/brand\/verndale-logo\.svg" alt="" \/><\/a>/,
  );
  assert.doesNotMatch(index, /<span aria-hidden="true"><\/span>VERNDALE/);
  assert.match(
    styles,
    /\.site-brand img\s*\{[^}]*display:block;[^}]*width:clamp\(142px,12\.5vw,180px\);[^}]*height:auto;/,
  );
  assert.doesNotMatch(styles, /\.site-brand span\s*\{/);
  assert.match(logo, /width="390\.35" height="81\.36"/);
  assert.match(logo, /viewBox="0 0 390\.35 81\.36"/);
  assert.match(logo, /fill="#ffb800"/);
});
