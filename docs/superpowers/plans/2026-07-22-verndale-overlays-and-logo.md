# Verndale Overlays and Official Logo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give scene copy a visibly progressive lavender-to-transparent gradient, make the desktop header gradient white, and replace the generated brand mark with the supplied official Verndale SVG.

**Architecture:** Keep the existing scroll-world engine, side-aware backdrop flip, and header structure. Change only the Verndale skin gradient tokens and brand-link contents, store the supplied SVG as a repository asset, and lock all three outcomes with static contract tests before browser QA.

**Tech Stack:** HTML5, CSS, SVG, Node.js built-in test runner, Python static HTTP server, in-app Chromium browser automation

## Global Constraints

- Work directly on the existing `main` branch, as approved.
- Preserve all video files, scene order, scroll timing, connector pacing, media opacity logic, copy, CTA destinations, and mobile poster behavior.
- Preserve the engine-owned bottom-up mobile copy gradient; only change the Verndale skin's `.sw-copy-backdrop` fill.
- Preserve the existing right-side backdrop flip so the opaque portion stays behind right-aligned copy.
- The desktop header gradient must contain white only; do not retain lavender or purple in that rule.
- Copy `/Users/david.bergmann/Desktop/logo.svg` byte-for-byte into the repository. Do not modify the supplied source file.
- Preserve the brand link destination and accessible name.
- Do not touch the user-owned untracked `.agents/` or `skills-lock.json` paths.

---

### Task 1: Implement the gradients and official logo test-first

**Files:**

- Modify: `tests/styles.test.js`
- Modify: `src/styles.css`
- Modify: `index.html`
- Create: `public/assets/brand/verndale-logo.svg`

**Interfaces:**

- Consumes: `.sw-root .sw-copy-backdrop`, desktop `.site-header`, and `.site-brand`.
- Produces: the approved four-stop lavender scene gradient, the approved three-stop white desktop header gradient, and the supplied 390.35×81.36 official logo rendered through the existing home link.

- [ ] **Step 1: Add failing contract tests**

Add the page markup fixture beside the existing style and engine fixtures in `tests/styles.test.js`:

```js
const index = await readFile(new URL('../index.html', import.meta.url), 'utf8');
```

Append these tests:

```js
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
```

- [ ] **Step 2: Run the focused tests and verify RED**

Run:

```bash
node --test --test-name-pattern "approved gradients|supplied official logo asset" tests/styles.test.js
```

Expected: both matching tests fail because the current gradients use the previous stops, the header still uses lavender, the header contains generated text/shape markup, the image rule is absent, and the repository SVG does not exist.

- [ ] **Step 3: Add the supplied SVG asset without altering it**

Create `public/assets/brand/`, read `/Users/david.bergmann/Desktop/logo.svg`, and use `apply_patch` to add `public/assets/brand/verndale-logo.svg` with exactly the same SVG text. Do not use a formatting or SVG optimization tool.

Verify byte identity immediately:

```bash
cmp /Users/david.bergmann/Desktop/logo.svg public/assets/brand/verndale-logo.svg
```

Expected: no output and exit code 0.

- [ ] **Step 4: Replace the generated brand mark with the official asset**

In `index.html`, replace:

```html
<a class="site-brand" href="https://www.verndale.com/" aria-label="Verndale home"><span aria-hidden="true"></span>VERNDALE</a>
```

with:

```html
<a class="site-brand" href="https://www.verndale.com/" aria-label="Verndale home"><img src="public/assets/brand/verndale-logo.svg" alt="" /></a>
```

The image is decorative because the enclosing link already supplies the accessible name.

- [ ] **Step 5: Apply the approved gradient and logo CSS**

In `src/styles.css`, remove the obsolete generated-mark rule:

```css
.site-brand span { width:18px; height:18px; border-radius:5px; background:var(--purple); box-shadow:7px 7px 0 var(--yellow); }
```

Add after `.site-brand`:

```css
.site-brand img { display:block; width:clamp(142px,12.5vw,180px); height:auto; }
```

Replace the scene backdrop with:

```css
.sw-root .sw-copy-backdrop { background:linear-gradient(90deg,color-mix(in srgb,var(--lavender) 96%,transparent) 0%,color-mix(in srgb,var(--lavender) 80%,transparent) 28%,color-mix(in srgb,var(--lavender) 38%,transparent) 56%,transparent 78%); }
```

Replace the desktop header skin inside `@media (min-width:861px)` with:

```css
.site-header { background:linear-gradient(180deg,color-mix(in srgb,var(--white) 96%,transparent) 0%,color-mix(in srgb,var(--white) 76%,transparent) 55%,transparent 100%); }
```

- [ ] **Step 6: Run focused and complete automated verification**

Run:

```bash
node --test --test-name-pattern "approved gradients|supplied official logo asset" tests/styles.test.js
npm test
npm run verify:assets
cmp /Users/david.bergmann/Desktop/logo.svg public/assets/brand/verndale-logo.svg
git diff --check
```

Expected: the two focused tests pass; the full suite reports 43 passing tests and zero failures; all six stills and eleven videos validate; the SVG comparison and whitespace check print nothing.

- [ ] **Step 7: Commit the implementation**

Run:

```bash
git add index.html src/styles.css tests/styles.test.js public/assets/brand/verndale-logo.svg
git commit -m "feat: update overlays and Verndale logo"
```

Expected: exactly the four task files are committed; `.agents/` and `skills-lock.json` remain untouched and untracked.

---

### Task 2: Verify the gradients and logo in the desktop experience

**Files:**

- Inspect: the live page at `http://127.0.0.1:4183/`
- No repository files are modified unless verification reveals a task-scoped defect.

**Interfaces:**

- Consumes: the production header, left/right scene copy overlays, connector intervals, and official SVG image.
- Produces: desktop evidence that the gradients, logo, side mirroring, and overlay clearing behave correctly without runtime regressions.

- [ ] **Step 1: Start a clean preview**

Run:

```bash
python3 -m http.server 4183 --bind 127.0.0.1
```

Expected: the page is available at `http://127.0.0.1:4183/` without startup errors.

- [ ] **Step 2: Verify the initial header and logo at 1280×720**

Inspect the live page at desktop size. Require:

```text
header background: vertical white-to-transparent gradient
header gradient: no lavender or purple color stop
logo asset: public/assets/brand/verndale-logo.svg
logo intrinsic size: 390.35 × 81.36
logo rendered width: between 142px and 180px
logo aspect ratio: approximately 4.80:1
brand-link accessible name: Verndale home
brand-link destination: https://www.verndale.com/
```

Visually confirm the official yellow accent and dark Verndale wordmark are crisp, proportionate, and do not disturb navigation or the “Let's talk” CTA.

- [ ] **Step 3: Verify left- and right-aligned copy gradients**

Sample at least one readable left-aligned scene and one readable right-aligned scene. Confirm the backdrop is strongest at the copy-side edge, steps down through visibly softer lavender stops, and reaches full transparency before the opposite edge. On right-side copy, confirm the existing transform mirrors the gradient and the text remains right-aligned.

Require `getComputedStyle(copyBackdrop).backgroundImage` to contain the approved 96%, 80%, and 38% lavender color-mix results and `opacity > 0` while the copy is readable.

- [ ] **Step 4: Verify overlays clear during connectors**

Move to a connector midpoint and inspect `.sw-copy-backdrop`. Require computed opacity `0` while the connector video remains fully visible. Confirm copy/backdrop reappears only when the incoming scene text is shown.

- [ ] **Step 5: Check mobile preservation and runtime health**

At 860px or narrower, confirm the static poster mode and existing header behavior remain intact. Return to 1280×720 and inspect current-origin diagnostics. Require no console errors, missing-logo requests, media failures, or invalid seek errors.

- [ ] **Step 6: Report verification evidence**

Report the rendered logo dimensions and accessible link result, left/right gradient behavior, connector overlay opacity, mobile preservation, automated test count, asset-verification result, SVG byte-identity result, and console status. Do not make unrelated design changes.
