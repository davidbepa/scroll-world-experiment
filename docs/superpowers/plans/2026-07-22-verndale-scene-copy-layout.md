# Verndale Scene Copy Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Place the six case-study copy blocks on the approved desktop sides and hide the directional scrim whenever no text is visible, especially throughout connector transitions.

**Architecture:** Store each case's side in the section manifest and keep the hero explicitly left-aligned. Replace the always-on copy-layer pseudo-element with one runtime scrim whose side and opacity are driven by the same values already applied to visible hero/case copy; media timing and dissolve math stay untouched.

**Tech Stack:** Plain HTML/CSS, native JavaScript ES modules, Node.js test runner, local desktop browser QA.

## Global Constraints

- Work on the existing `main` branch; the user explicitly approved in-place work.
- Hero copy remains on the left.
- Case sides are exactly: MarineMax right; Southeast Toyota Finance left; IATA left; Aspen Snowmass right; Honda Powersports right; SeaWorld left.
- Connector segments show no case copy and no gradient scrim.
- The scrim opacity must equal the currently visible hero/case copy opacity.
- Media assets, scene order, case copy, route behavior, video seeking, media dissolve timing, crossfade weights, scroll distances, header layout, mobile mode, and poster mode remain unchanged.
- Preserve user-owned `.agents/` and `skills-lock.json` files.

## File Structure

| File | Responsibility |
|---|---|
| `src/cases.js` | Owns the hero and per-case `copySide` configuration. |
| `src/scroll-world.js` | Builds directional copy DOM and synchronizes scrim side/opacity with visible copy. |
| `src/styles.css` | Applies Verndale desktop positioning, mirrored gradients, and route-safe right inset. |
| `tests/cases.test.js` | Locks the approved side sequence and hero side. |
| `tests/scroll-world.test.js` | Verifies runtime side attributes, copy-linked scrim opacity, and zero-overlay connector state. |
| `tests/styles.test.js` | Verifies the unlayered Verndale skin targets the new scrim/right-copy selectors and removes the persistent pseudo-overlay. |

---

### Task 1: Declare the approved copy-side map

**Files:**
- Modify: `src/cases.js:2-84`
- Modify: `tests/cases.test.js:14-37`

**Interfaces:**
- Consumes: Existing `CASES: Array<Case>` and `createWorldConfig(): WorldConfig` objects.
- Produces: `hero.copySide: 'left'` and `section.copySide: 'left' | 'right'` for every film section.

- [ ] **Step 1: Write the failing manifest test**

Add this test to `tests/cases.test.js`:

```js
test('hero and case copy sides match the approved desktop composition', () => {
  const config = createWorldConfig();
  assert.equal(config.hero.copySide, 'left');
  assert.deepEqual(
    config.sections.map(({ copySide }) => copySide),
    ['right', 'left', 'left', 'right', 'right', 'left'],
  );
});
```

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```bash
node --test tests/cases.test.js
```

Expected: FAIL because `config.hero.copySide` and each section's `copySide` are currently `undefined`.

- [ ] **Step 3: Add the minimal manifest values**

In `src/cases.js`, add the exact `copySide` value beside each scene's visual settings:

```js
// MarineMax
copySide: 'right', accent: '#6A2FF3', scroll: 1.5, linger: 0.35,

// Southeast Toyota Finance
copySide: 'left', accent: '#FFB800', scroll: 1.25, linger: 0.2,

// IATA
copySide: 'left', accent: '#6A2FF3', scroll: 1.25, linger: 0.2,

// Aspen Snowmass
copySide: 'right', accent: '#FFB800', scroll: 1.4, linger: 0.35,

// Honda Powersports
copySide: 'right', accent: '#6A2FF3', scroll: 1.25, linger: 0.2,

// SeaWorld
copySide: 'left', accent: '#FFB800', scroll: 1.7, linger: 0.45,
```

Add the explicit hero side in `createWorldConfig()`:

```js
hero: {
  copySide: 'left',
  eyebrow: 'Connected experiences · measurable growth',
  // existing hero fields remain unchanged
},
```

- [ ] **Step 4: Run focused and full tests**

Run:

```bash
node --test tests/cases.test.js
npm test
```

Expected: focused test passes; full suite passes with 36 tests and zero failures.

- [ ] **Step 5: Review and commit Task 1**

Run:

```bash
git diff --check
git diff -- src/cases.js tests/cases.test.js
git add src/cases.js tests/cases.test.js
git commit -m "feat: configure scene copy sides"
```

Expected: only the approved side configuration and its regression test are committed.

---

### Task 2: Tie directional scrim visibility to readable copy

**Files:**
- Modify: `src/scroll-world.js:110-186,321-341,524-560`
- Modify: `src/styles.css:44-59`
- Modify: `tests/scroll-world.test.js:174-266`
- Modify: `tests/styles.test.js:1-20`

**Interfaces:**
- Consumes: `hero.copySide` and `section.copySide` from Task 1; existing `heroOpacity(...)` and `sectionCopyOpacity(...)` values.
- Produces: One `.sw-copy-backdrop[data-side='left'|'right']`, copy articles with `data-side`, and a desktop layout where backdrop opacity equals the strongest visible copy opacity.

- [ ] **Step 1: Write the failing runtime test**

Add this test to `tests/scroll-world.test.js`:

```js
test('directional copy backdrop follows readable copy and clears connectors', () => {
  const fixture = createBrowserFixture();
  try {
    const root = fixture.createRoot();
    const controller = mountScrollWorld(root, {
      atmosphere: false,
      nav: false,
      hero: { copySide: 'left', title: 'Hero', scroll: 0.5 },
      connScroll: 0.5,
      sections: [
        { id: 'one', label: 'One', copySide: 'right', still: '', clip: '', scroll: 1 },
        { id: 'two', label: 'Two', copySide: 'left', still: '', clip: '', scroll: 1 },
      ],
      connectors: ['connector.mp4'],
    });

    const [backdrop] = root.querySelectorAll('.sw-copy-backdrop');
    const [hero] = root.querySelectorAll('.sw-hero');
    const copies = root.querySelectorAll('.sw-copy');
    const css = fixture.document.getElementById('sw-css').textContent;

    assert.ok(backdrop);
    assert.equal(hero.dataset.side, 'left');
    assert.deepEqual(copies.map(copy => copy.dataset.side), ['right', 'left']);
    assert.doesNotMatch(css, /\.sw-copylayer::before/);

    fixture.setScroll(600); // first-copy fade-in
    fixture.dispatch('resize');
    assert.equal(Number(backdrop.style.opacity), Number(copies[0].style.opacity));
    assert.ok(Number(backdrop.style.opacity) > 0 && Number(backdrop.style.opacity) < 1);

    fixture.setScroll(900); // center of first dive
    fixture.dispatch('resize');
    assert.equal(backdrop.dataset.side, 'right');
    assert.equal(Number(backdrop.style.opacity), 1);

    fixture.setScroll(1575); // center of connector
    fixture.dispatch('resize');
    assert.equal(Number(backdrop.style.opacity), 0);
    assert.deepEqual(copies.map(copy => Number(copy.style.opacity)), [0, 0]);

    fixture.setScroll(2250); // center of second dive
    fixture.dispatch('resize');
    assert.equal(backdrop.dataset.side, 'left');
    assert.equal(Number(backdrop.style.opacity), 1);

    controller.destroy();
  } finally {
    fixture.restore();
  }
});
```

- [ ] **Step 2: Write the failing Verndale skin test**

Append this test to `tests/styles.test.js`:

```js
test('desktop film skin styles the directional backdrop and route-safe right copy', () => {
  assert.match(styles, /\.sw-root \.sw-copy-backdrop\s*\{[^}]*background\s*:/);
  assert.match(styles, /\.sw-root \.sw-copy\[data-side="right"\]\s*\{[^}]*left\s*:\s*auto\s*;[^}]*right\s*:/);
  assert.doesNotMatch(styles, /\.sw-root \.sw-copylayer::before/);
});
```

- [ ] **Step 3: Run focused tests and verify RED**

Run:

```bash
node --test tests/scroll-world.test.js tests/styles.test.js
```

Expected: FAIL because `.sw-copy-backdrop`, `data-side`, the route-safe right-copy rule, and synchronized backdrop opacity do not exist; the old `.sw-copylayer::before` rules still exist.

- [ ] **Step 4: Build the dedicated backdrop and side attributes**

In `src/scroll-world.js`, create and mount a real backdrop immediately after `copylayer` is created:

```js
const copylayer = el('div', 'sw-copylayer');
const copyBackdrop = el('div', 'sw-copy-backdrop');
copyBackdrop.dataset.side = 'left';
copylayer.appendChild(copyBackdrop);
```

When building hero and case articles, normalize their sides without changing DOM order:

```js
hero.dataset.side = HERO.copySide === 'right' ? 'right' : 'left';
```

```js
copy.dataset.side = s.copySide === 'right' ? 'right' : 'left';
```

- [ ] **Step 5: Synchronize backdrop state inside `read()`**

Replace the hero/copy opacity block with this single-pass presentation state. Keep the existing transform and pointer-event assignments:

```js
let backdropOpacity = 0;
let backdropSide = 'left';

if (hero) {
  const opacity = heroOpacity(position, HERO_SCROLL);
  hero.style.opacity = opacity;
  hero.style.pointerEvents = opacity > 0.5 ? 'auto' : 'none';
  if (opacity > backdropOpacity) {
    backdropOpacity = opacity;
    backdropSide = hero.dataset.side;
  }
}

for (let i = 0; i < N; i += 1) {
  const segment = diveMathSegments[i];
  const progress = clamp((position - segment.start) / (segment.end - segment.start));
  const opacity = sectionCopyOpacity({
    index: i,
    count: N,
    position,
    segment,
    hasHero: Boolean(HERO),
  });
  const copy = copies[i];
  copy.style.opacity = opacity;
  copy.style.transform = reduce ? 'none' : `translateY(${(0.5 - progress) * 4}vh)`;
  copy.style.pointerEvents = opacity > 0.5 ? 'auto' : 'none';
  if (opacity > backdropOpacity) {
    backdropOpacity = opacity;
    backdropSide = copy.dataset.side;
  }
}

copyBackdrop.dataset.side = backdropSide;
copyBackdrop.style.opacity = backdropOpacity;
```

At connector midpoints, every `sectionCopyOpacity(...)` result is zero, so `copyBackdrop.style.opacity` becomes exactly `0` without consulting media blend weights or changing the timeline.

- [ ] **Step 6: Replace the engine's persistent pseudo-overlay CSS**

In the injected CSS string in `src/scroll-world.js`, replace `.sw-copylayer::before` with a real, copy-linked backdrop and explicit side selectors:

```css
.sw-copylayer{position:fixed;inset:0;z-index:20;pointer-events:none;}
.sw-copy-backdrop{position:absolute;inset:0 auto 0 0;z-index:0;width:min(58vw,780px);opacity:0;will-change:opacity;background:linear-gradient(90deg,var(--sw-bg) 0%,color-mix(in srgb,var(--sw-bg) 82%,transparent) 34%,color-mix(in srgb,var(--sw-bg) 40%,transparent) 62%,transparent 100%);}
.sw-copy-backdrop[data-side="right"]{left:auto;right:0;transform:scaleX(-1);}
.sw-copy,.sw-hero{position:absolute;z-index:1;left:clamp(18px,5vw,64px);right:auto;top:50%;transform:translateY(-50%);width:min(42vw,520px);opacity:0;will-change:opacity,transform;}
.sw-copy[data-side="right"]{left:auto;right:clamp(150px,18vw,260px);}
```

Update the mobile fallback selector so it targets the real backdrop and neutralizes mirroring:

```css
@media(max-width:860px){
  .sw-nav{display:none}.sw-copy-backdrop,.sw-copy-backdrop[data-side="right"]{left:0;right:0;width:100%;height:60%;top:auto;bottom:0;transform:none;background:linear-gradient(0deg,var(--sw-bg) 8%,color-mix(in srgb,var(--sw-bg) 70%,transparent) 46%,transparent 100%);}
  .sw-copy,.sw-copy[data-side="right"],.sw-hero{left:clamp(18px,5vw,64px);right:clamp(18px,5vw,64px);top:auto;bottom:clamp(64px,14vh,120px);transform:none;width:auto;max-width:560px;}
  .sw-copy,.sw-copy[data-side="right"],.sw-hero{bottom:calc(clamp(56px,12dvh,110px) + env(safe-area-inset-bottom));}
  .sw-copy__title{font-size:clamp(1.9rem,7.5vw,2.7rem)}.sw-copy__body{max-width:none;font-size:clamp(.98rem,3.6vw,1.1rem)}.sw-scene__video,.sw-scene__still{object-position:center 46%;}
  .sw-hint{bottom:calc(20px + env(safe-area-inset-bottom))}.sw-route{gap:16px;right:6px}.sw-route__label{display:none}.sw-status{display:none;}
}
```

- [ ] **Step 7: Update the Verndale skin**

In `src/styles.css`, replace the old pseudo-element override and split the copy layout into side-aware rules:

```css
.sw-root .sw-copy-backdrop { background:linear-gradient(90deg,var(--lavender) 0%,color-mix(in srgb,var(--lavender) 92%,transparent) 45%,transparent 100%); }
.sw-root .sw-copy,.sw-root .sw-hero { left:clamp(24px,6vw,88px); right:auto; width:min(40vw,520px); }
.sw-root .sw-copy[data-side="right"] { left:auto; right:clamp(150px,18vw,260px); width:min(38vw,500px); }
```

The injected `[data-side="right"]` transform mirrors the Verndale gradient automatically. The right inset leaves the fixed route rail and its labels outside the reading column.

- [ ] **Step 8: Run focused and full automated verification**

Run:

```bash
node --test tests/scroll-world.test.js tests/styles.test.js
npm test
git diff --check
```

Expected: focused tests pass; full suite passes with 38 tests and zero failures; diff check prints nothing.

- [ ] **Step 9: Verify all scene and connector states in the desktop browser**

Serve the repository from a fresh port to avoid cached CSS:

```bash
python3 -m http.server 4175 --bind 127.0.0.1
```

At a desktop viewport, set `window.scrollTo(0, multiplier * window.innerHeight)` for these multipliers:

| State | Multiplier | Expected |
|---|---:|---|
| Hero | `0.00` | Left copy and left scrim visible |
| MarineMax center | `1.40` | Right copy and right scrim visible |
| Connector 1 center | `2.55` | No copy; scrim opacity `0` |
| Southeast Toyota Finance center | `3.575` | Left copy and left scrim visible |
| Connector 2 center | `4.60` | No copy; scrim opacity `0` |
| IATA center | `5.625` | Left copy and left scrim visible |
| Connector 3 center | `6.65` | No copy; scrim opacity `0` |
| Aspen Snowmass center | `7.75` | Right copy and right scrim visible |
| Connector 4 center | `8.85` | No copy; scrim opacity `0` |
| Honda Powersports center | `9.875` | Right copy and right scrim visible |
| Connector 5 center | `10.90` | No copy; scrim opacity `0` |
| SeaWorld center | `12.15` | Left copy and left scrim visible; CTA interactive |

For every scene center, inspect `.sw-copy` bounding boxes and `.sw-copy-backdrop`: left-side copy centers must fall left of the viewport midpoint, right-side copy centers must fall right of it, `backdrop.dataset.side` must match, and computed backdrop opacity must be greater than `0.95`. At connector centers, all `.sw-copy` computed opacities and backdrop opacity must be `0`. Confirm the route rail does not overlap right-side copy, capture representative screenshots of MarineMax, connector 3, and Honda Powersports, and confirm the console has no warnings or errors.

- [ ] **Step 10: Review and commit Task 2**

Run:

```bash
git diff --check
git diff -- src/scroll-world.js src/styles.css tests/scroll-world.test.js tests/styles.test.js
git add src/scroll-world.js src/styles.css tests/scroll-world.test.js tests/styles.test.js
git commit -m "feat: reveal video between scene copy"
```

Expected: the commit contains only directional copy/backdrop behavior and its regression coverage.

---

## Final Verification

After both task reviews are clean, run:

```bash
npm test
git diff --check b0c890a..HEAD
git status --short
```

Expected: 38 tests pass, the implementation diff is whitespace-clean, and only pre-existing user-owned untracked files remain outside the two task commits.
