# Verndale Copy Composition and Opaque Seams Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Put the opening hero and requested case copy on their approved sides with right-aligned right panels, remove the Verndale vertical route rail, and eliminate background bleed at every media seam.

**Architecture:** Keep side choice in the existing hero/case configuration and let the scroll-world engine expose it through `data-side`. The Verndale skin owns the symmetric desktop placement, alignment, and route-rail removal, while the generic engine keeps one directional scrim and its reusable route component. Replace complementary scene weights with coverage-preserving layer opacities: the earlier/lower layer stays opaque while the later/upper layer eases over it.

**Tech Stack:** Vanilla JavaScript ES modules, generated DOM/CSS in `src/scroll-world.js`, site CSS in `src/styles.css`, Node's built-in `node:test`, Vite, and Playwright-backed in-app browser QA.

## Global Constraints

- Work on the existing `main` branch, starting from commit `9bebcdb`.
- Preserve scene order, video/still assets, case copy, CTA copy and destinations, scroll distances, crossfade duration (`0.08` viewport heights), easing, video seeking, and DOM media stacking order.
- Preserve the generic engine route component; hide only `.sw-root .sw-route` in the Verndale desktop skin.
- Keep the bottom `.sw-status` pill visible on desktop.
- Keep connector copy and scrim opacity exactly `0`.
- Keep mobile poster mode and reduced-motion behavior unchanged.
- Do not modify or stage the user-owned `.agents/` directory or `skills-lock.json`.

---

### Task 1: Right-side composition and Verndale route cleanup

**Files:**
- Modify: `src/cases.js:75-86`
- Modify: `src/scroll-world.js:541-565`
- Modify: `src/styles.css:44-61`
- Test: `tests/cases.test.js:39-47`
- Test: `tests/styles.test.js:13-17`
- Test: `tests/scroll-world.test.js:268-318`

**Interfaces:**
- Consumes: `hero.copySide: 'left' | 'right'`, `section.copySide: 'left' | 'right'`, the engine-generated `data-side` attributes, `.sw-copy-backdrop`, `.sw-route`, and `.sw-status`.
- Produces: `createWorldConfig().hero.copySide === 'right'`; desktop right-side panels with right-aligned text/body/tags/CTA; a hidden Verndale `.sw-route`; and the preserved visible `.sw-status` pill.

- [ ] **Step 1: Change the configuration test to require the opening hero on the right**

Replace the hero assertion in `tests/cases.test.js` with:

```js
test('hero and case copy sides match the approved desktop composition', () => {
  const config = createWorldConfig();
  assert.equal(config.hero.copySide, 'right');
  assert.deepEqual(
    config.sections.map(({ copySide }) => copySide),
    ['right', 'left', 'left', 'right', 'right', 'left'],
  );
});
```

- [ ] **Step 2: Expand the stylesheet test to cover alignment, rail removal, and status preservation**

Replace the existing desktop-film test in `tests/styles.test.js` with:

```js
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
```

- [ ] **Step 3: Strengthen the runtime scrim test for the right-side hero and a single mirrored backdrop**

Update the test fixture and assertions in `tests/scroll-world.test.js`:

```js
test('directional copy backdrop follows readable copy and clears connectors', () => {
  const fixture = createBrowserFixture();
  try {
    const root = fixture.createRoot();
    const controller = mountScrollWorld(root, {
      atmosphere: false,
      nav: false,
      hero: { copySide: 'right', title: 'Hero', scroll: 0.5 },
      connScroll: 0.5,
      sections: [
        { id: 'one', label: 'One', copySide: 'right', still: '', clip: '', scroll: 1 },
        { id: 'two', label: 'Two', copySide: 'left', still: '', clip: '', scroll: 1 },
      ],
      connectors: ['connector.mp4'],
    });

    const backdrops = root.querySelectorAll('.sw-copy-backdrop');
    const [backdrop] = backdrops;
    const [hero] = root.querySelectorAll('.sw-hero');
    const copies = root.querySelectorAll('.sw-copy');
    const css = fixture.document.getElementById('sw-css').textContent;

    assert.equal(backdrops.length, 1);
    assert.equal(hero.dataset.side, 'right');
    assert.deepEqual(copies.map(copy => copy.dataset.side), ['right', 'left']);
    assert.match(css, /\.sw-copy-backdrop\[data-side="right"\]\{[^}]*transform:scaleX\(-1\)/);
    assert.doesNotMatch(css, /\.sw-copylayer::before/);

    fixture.setScroll(0);
    fixture.dispatch('resize');
    assert.equal(backdrop.dataset.side, 'right');
    assert.equal(Number(backdrop.style.opacity), 1);

    fixture.setScroll(600);
    fixture.dispatch('resize');
    assert.equal(Number(backdrop.style.opacity), Number(copies[0].style.opacity));
    assert.ok(Number(backdrop.style.opacity) > 0 && Number(backdrop.style.opacity) < 1);

    fixture.setScroll(900);
    fixture.dispatch('resize');
    assert.equal(backdrop.dataset.side, 'right');
    assert.equal(Number(backdrop.style.opacity), 1);

    fixture.setScroll(1575);
    fixture.dispatch('resize');
    assert.equal(Number(backdrop.style.opacity), 0);
    assert.deepEqual(copies.map(copy => Number(copy.style.opacity)), [0, 0]);

    fixture.setScroll(2250);
    fixture.dispatch('resize');
    assert.equal(backdrop.dataset.side, 'left');
    assert.equal(Number(backdrop.style.opacity), 1);

    controller.destroy();
  } finally {
    fixture.restore();
  }
});
```

- [ ] **Step 4: Run the focused tests and confirm they fail for the approved reasons**

Run:

```bash
node --test tests/cases.test.js tests/styles.test.js tests/scroll-world.test.js
```

Expected: FAIL because the hero still reports `left`, the Verndale right selector does not include `.sw-hero`, right alignment rules are absent, `.sw-route` is still visible, and `.sw-status` has no explicit `display:flex` in the site skin.

- [ ] **Step 5: Configure the hero on the right**

Change the hero object in `src/cases.js` to:

```js
hero: {
  copySide: 'right',
  eyebrow: 'Connected experiences · measurable growth',
  title: 'Experience is your growth system.',
  body: 'We connect strategy, design, technology, data, AI and marketing to create digital experiences that perform.',
  cta: { label: 'Explore the work', href: '#marinemax' },
  scroll: 0.65,
  linger: 0.3,
},
```

- [ ] **Step 6: Give the generic engine correct right-side alignment hooks without changing mobile layout**

Replace the desktop right-side and alignment portion of the injected CSS in `src/scroll-world.js` with:

```css
.sw-copy,.sw-hero{position:absolute;z-index:1;left:clamp(18px,5vw,64px);right:auto;top:50%;transform:translateY(-50%);width:min(42vw,520px);opacity:0;will-change:opacity,transform;text-align:left;}
.sw-copy[data-side="right"],.sw-hero[data-side="right"]{left:auto;right:clamp(18px,5vw,64px);text-align:right;}
.sw-copy[data-side="right"] .sw-copy__body,.sw-hero[data-side="right"] .sw-hero__body{margin-left:auto;}
.sw-copy[data-side="right"] .sw-copy__tags,.sw-copy[data-side="right"] .sw-copy__cta{justify-content:flex-end;}
```

Keep the existing mobile selector unchanged so the established bottom-sheet placement still wins below `860px`:

```css
@media(max-width:860px){
  .sw-copy,.sw-copy[data-side="right"],.sw-hero{left:clamp(18px,5vw,64px);right:clamp(18px,5vw,64px);top:auto;bottom:clamp(64px,14vh,120px);transform:none;width:auto;max-width:560px;}
}
```

- [ ] **Step 7: Apply symmetric Verndale placement, right alignment, route removal, and status preservation**

Replace the relevant desktop-skin rules in `src/styles.css` with:

```css
.sw-root .sw-copy,.sw-root .sw-hero {
  left:clamp(24px,6vw,88px);
  right:auto;
  width:min(40vw,520px);
  text-align:left;
}
.sw-root .sw-copy[data-side="right"],.sw-root .sw-hero[data-side="right"] {
  left:auto;
  right:clamp(24px,6vw,88px);
  width:min(40vw,520px);
  text-align:right;
}
.sw-root [data-side="right"] .sw-copy__body,.sw-root [data-side="right"] .sw-hero__body { margin-left:auto; }
.sw-root [data-side="right"] .sw-copy__tags,.sw-root [data-side="right"] .sw-copy__cta { justify-content:flex-end; }
.sw-root .sw-route { display:none; }
.sw-root .sw-status {
  display:flex;
  bottom:clamp(24px,4vh,48px);
  padding:10px 16px;
  border:1px solid color-mix(in srgb,var(--ink) 14%,transparent);
  border-radius:999px;
  background:color-mix(in srgb,var(--white) 55%,transparent);
  backdrop-filter:blur(10px);
}
```

Delete the now-dead Verndale-only route color overrides:

```css
.sw-root .sw-route::before { background:var(--purple); }
.sw-root .sw-route__dot i { background:color-mix(in srgb,var(--purple) 38%,transparent); }
.sw-root .sw-route__dot:hover i,.sw-root .sw-route__dot.is-active i { background:var(--purple); }
.sw-root .sw-route__dot.is-active i { box-shadow:0 0 0 5px color-mix(in srgb,var(--purple) 22%,transparent); }
```

- [ ] **Step 8: Run focused and full automated verification**

Run:

```bash
node --test tests/cases.test.js tests/styles.test.js tests/scroll-world.test.js
npm test
```

Expected: both commands PASS; the full suite reports `38` tests, `0` failures.

- [ ] **Step 9: Verify desktop composition in the browser**

Start a fresh preview server:

```bash
npm run dev -- --host 127.0.0.1 --port 4176
```

At `1440×900` and `1024×768`, inspect the opening hero plus the center of all six dive segments. Expected:

```text
Hero, MarineMax, Aspen Snowmass, Honda Powersports:
  panel center x > viewport midpoint
  computed text-align = right
  body right edge aligns with the panel right edge
  tags and CTA computed justify-content = flex-end

Southeast Toyota Finance, IATA, SeaWorld:
  panel center x < viewport midpoint
  computed text-align = left

All positions:
  .sw-route computed display = none and is absent from the accessibility snapshot
  .sw-status computed display = flex and remains visible
  connector midpoint copy opacity = 0
  connector midpoint scrim opacity = 0
  browser console errors = 0
```

- [ ] **Step 10: Commit the independently verified composition change**

```bash
git add src/cases.js src/scroll-world.js src/styles.css tests/cases.test.js tests/styles.test.js tests/scroll-world.test.js
git commit -m "fix: refine scene copy composition"
```

---

### Task 2: Coverage-preserving media seam opacities

**Files:**
- Modify: `src/timeline.js:8-32`
- Modify: `src/scroll-world.js:11-12,308-323`
- Test: `tests/timeline.test.js:44-67`
- Test: `tests/scroll-world.test.js:232-266`

**Interfaces:**
- Consumes: timeline position in pixels, ordered segment objects with numeric `start` values, and crossfade band width in pixels.
- Produces: `segmentLayerOpacities(position: number, segments: Array<{start: number}>, crossfade: number): number[]`; within a seam the earlier/lower layer is `1` and later/upper layer is `smoothstep(0..1)`, while outside seams exactly one layer is `1`.

- [ ] **Step 1: Replace complementary-weight expectations with coverage-preserving opacity expectations**

Replace the seam test in `tests/timeline.test.js` with:

```js
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
```

- [ ] **Step 2: Change the DOM-level dissolve test to require an opaque lower layer and stable stacking**

Replace the current dissolve test in `tests/scroll-world.test.js` with:

```js
test('scene layers preserve full coverage without changing stacking order', () => {
  const fixture = createBrowserFixture();
  try {
    const root = fixture.createRoot();
    const controller = mountScrollWorld(root, {
      atmosphere: false,
      nav: false,
      crossfade: 0.08,
      sections: [
        { id: 'one', label: 'One', still: '', clip: '', scroll: 1 },
        { id: 'two', label: 'Two', still: '', clip: '', scroll: 1 },
      ],
      connectors: [null],
    });
    const scenes = root.querySelectorAll('.sw-scene');
    const initialStack = scenes.map(scene => scene.style.zIndex);
    const coverage = () => {
      const [lower, upper] = scenes.map(scene => Number(scene.style.opacity));
      return upper + lower * (1 - upper);
    };

    fixture.setScroll(864);
    fixture.dispatch('resize');
    assert.deepEqual(scenes.map(scene => Number(scene.style.opacity)), [1, 0]);
    assert.equal(coverage(), 1);

    fixture.setScroll(900);
    fixture.dispatch('resize');
    assert.deepEqual(scenes.map(scene => Number(scene.style.opacity)), [1, 0.5]);
    assert.equal(coverage(), 1);
    assert.deepEqual(scenes.map(scene => scene.style.zIndex), initialStack);

    fixture.setScroll(936);
    fixture.dispatch('resize');
    assert.deepEqual(scenes.map(scene => Number(scene.style.opacity)), [0, 1]);
    assert.equal(coverage(), 1);
    assert.deepEqual(scenes.map(scene => scene.style.zIndex), initialStack);

    fixture.setScroll(900);
    fixture.dispatch('resize');
    assert.deepEqual(scenes.map(scene => Number(scene.style.opacity)), [1, 0.5]);
    assert.deepEqual(scenes.map(scene => scene.style.zIndex), initialStack);

    controller.destroy();
  } finally {
    fixture.restore();
  }
});
```

- [ ] **Step 3: Run the focused tests and confirm the new function is missing**

Run:

```bash
node --test tests/timeline.test.js tests/scroll-world.test.js
```

Expected: FAIL because `timeline.segmentLayerOpacities` is undefined and the runtime midpoint still reports `[0.5, 0.5]`.

- [ ] **Step 4: Replace complementary weights with coverage-preserving layer opacities**

Replace `segmentBlendWeights` in `src/timeline.js` with:

```js
export function segmentLayerOpacities(position, segments, crossfade) {
  const opacities = Array(segments.length).fill(0);
  if (!segments.length) return opacities;
  const band = Number.isFinite(crossfade) ? Math.max(0, crossfade) : 0;

  if (band > 0) {
    for (let index = 0; index < segments.length - 1; index += 1) {
      const boundary = segments[index + 1].start;
      const bandStart = boundary - band / 2;
      const bandEnd = boundary + band / 2;
      if (position < bandStart || position > bandEnd) continue;
      const incoming = smoothstep((position - bandStart) / band);
      opacities[index] = 1;
      opacities[index + 1] = incoming;
      return opacities;
    }
  }

  let active = 0;
  for (let index = 1; index < segments.length; index += 1) {
    if (position >= segments[index].start) active = index;
  }
  opacities[active] = 1;
  return opacities;
}
```

This intentionally leaves both layers at `1` at the inclusive upper edge of the band; one pixel/position past that edge the normal active-layer branch returns only the later layer at `1`. Because the later layer has stable higher z-index, both states render the same fully covered frame at that endpoint.

- [ ] **Step 5: Rename the scroll-world import and read-loop variable**

In `src/scroll-world.js`, replace the timeline import with:

```js
import {
  activeSectionIndex, buildSegments, clamp, heroOpacity, lingerEase,
  sectionCopyOpacity, segmentLayerOpacities,
} from './timeline.js';
```

Then replace the opacity calculation in `read()` with:

```js
const layerOpacities = segmentLayerOpacities(y, SEGMENTS, fade);
```

and inside the scene loop use:

```js
const opacity = layerOpacities[i];
```

- [ ] **Step 6: Run focused and full automated verification**

Run:

```bash
node --test tests/timeline.test.js tests/scroll-world.test.js
npm test
```

Expected: both commands PASS; the full suite reports `38` tests, `0` failures. Also run:

```bash
rg "segmentBlendWeights|blendWeights" src tests
```

Expected: no matches.

- [ ] **Step 7: Verify every desktop media seam in the browser**

Use the fresh server from Task 1 at `1440×900`. Check the ten segment boundaries, expressed as viewport-height timeline positions:

```js
const boundaries = [2.15, 2.95, 4.2, 5.0, 6.25, 7.05, 8.45, 9.25, 10.5, 11.3];
const band = 0.08;
```

At `boundary - band / 2`, `boundary`, and `boundary + band / 2` for each boundary, inspect the two adjacent `.sw-scene` elements. Expected:

```text
band start: lower opacity = 1, upper opacity = 0
midpoint:   lower opacity = 1, upper opacity = 0.5
band end:   lower opacity = 1, upper opacity = 1
after band: lower opacity = 0, upper opacity = 1
coverage:   upper + lower × (1 - upper) = 1 at every sampled point
z-index:    unchanged while scrolling forward and backward
visual:     no lavender background or particles visible through any seam
console:    0 errors and 0 warnings
```

Capture one representative seam-midpoint screenshot and visually confirm that the footage fills the viewport without pale bubbles or transparency.

- [ ] **Step 8: Commit the independently verified seam fix**

```bash
git add src/timeline.js src/scroll-world.js tests/timeline.test.js tests/scroll-world.test.js
git commit -m "fix: preserve media coverage at seams"
```

---

### Final verification

- [ ] **Step 1: Run the complete automated suite from a clean working tree**

```bash
npm test
git status --short
```

Expected: `38` tests pass with `0` failures. `git status --short` lists only the user-owned untracked `.agents/` directory and `skills-lock.json`.

- [ ] **Step 2: Run the approved desktop QA matrix once more**

At `1440×900` and `1024×768`, verify hero/case placement and alignment, all connector midpoints, all seam midpoints, hidden vertical route, visible bottom status, correct links, and a clean console. Expected: every item in the approved design spec's verification contract passes.
