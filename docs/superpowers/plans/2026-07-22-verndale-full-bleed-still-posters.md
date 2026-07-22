# Verndale Full-Bleed Still Posters Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the unintended left-edge gap from every `.sw-scene__still` poster while retaining the existing centered zoom.

**Architecture:** Keep the existing full-viewport scene/stage CSS and poster scale progression. Remove only the runtime horizontal translation and its unused `stageX` state, then verify the runtime transform and actual desktop bounding rectangles.

**Tech Stack:** JavaScript ES modules, Node.js test runner, Python static HTTP server, in-app Chromium browser automation

## Global Constraints

- Every `.sw-scene__still` poster must cover both viewport edges at desktop scroll positions.
- Preserve the existing scale progression: `1.03 + local * 0.14` when reduced motion is off.
- Preserve centered transform origin, `object-fit: cover`, and existing `object-position` rules.
- Do not alter `.sw-scene__video`, scene opacity, crossfades, media loading, connector pacing, scene timing, copy, navigation, or mobile poster mode.
- Remove the now-unused `stageX` state rather than retaining dead compensation logic.

---

### Task 1: Center still-poster transforms

**Files:**
- Modify: `tests/scroll-world.test.js`
- Modify: `src/scroll-world.js`

**Interfaces:**
- Consumes: `mountScrollWorld(container, config)` and the existing `read()` poster fallback path
- Produces: `.sw-scene__still.style.transform === "scale(1.030)"` at initial desktop progress, with the existing scale formula preserved for later progress

- [ ] **Step 1: Write the failing runtime regression test**

Append this test to `tests/scroll-world.test.js`:

```js
test('still posters remain centered and full bleed while retaining fallback zoom', () => {
  const fixture = createBrowserFixture();
  try {
    const root = fixture.createRoot();
    const controller = mountScrollWorld(root, config());
    const [still] = root.querySelectorAll('.sw-scene__still');

    assert.equal(still.style.transform, 'scale(1.030)');
    assert.doesNotMatch(still.style.transform, /translateX/);
    controller.destroy();
  } finally {
    fixture.restore();
  }
});
```

- [ ] **Step 2: Run the focused test to verify it fails**

Run:

```bash
node --test --test-name-pattern "still posters remain centered and full bleed" tests/scroll-world.test.js
```

Expected: FAIL because the current value is `translateX(2vw) scale(1.030)` instead of `scale(1.030)`.

- [ ] **Step 3: Remove the horizontal offset at its source**

In `src/scroll-world.js`, remove:

```js
let stageX = 0;
```

Remove this line from `layout()`:

```js
stageX = window.innerWidth > 860 ? 4 : 0;
```

Replace the poster transform in `read()`:

```js
s.img.style.transform = `translateX(${stageX - 2}vw) scale(${scale.toFixed(3)})`;
```

with:

```js
s.img.style.transform = `scale(${scale.toFixed(3)})`;
```

- [ ] **Step 4: Run the focused test to verify it passes**

Run:

```bash
node --test --test-name-pattern "still posters remain centered and full bleed" tests/scroll-world.test.js
```

Expected: one matching test passes with no failures.

- [ ] **Step 5: Run regression and asset verification**

Run:

```bash
npm test
npm run verify:assets
git diff --check
```

Expected: the complete suite passes; all six stills and eleven videos validate; diff hygiene is clean.

- [ ] **Step 6: Commit the fix**

```bash
git add src/scroll-world.js tests/scroll-world.test.js
git commit -m "fix: keep still posters full bleed"
```

### Task 2: Verify every still and unaffected video behavior

**Files:**
- Inspect: `src/scroll-world.js`
- Inspect: the live page at `http://127.0.0.1:4182/`
- No repository files are modified.

**Interfaces:**
- Consumes: the eleven `.sw-scene` layers created by `mountScrollWorld()`
- Produces: browser evidence that all eleven still posters cover the viewport and video behavior remains unchanged

- [ ] **Step 1: Start a clean preview**

Run:

```bash
python3 -m http.server 4182 --bind 127.0.0.1
```

Expected: the page is served at `http://127.0.0.1:4182/` without startup errors.

- [ ] **Step 2: Measure all still-poster rectangles at 1280×720**

At initial scroll position, inspect every `.sw-scene__still` using `getBoundingClientRect()` and computed styles. For all eleven posters, require:

```text
left <= 0
right >= 1280
width >= 1280
transform matrix translation x = 0
object-fit = cover
object-position = 50% 42%
```

Expected initial transform geometry at 1280px with `scale(1.03)`: approximately `left = -19.2`, `right = 1299.2`, and no visible page-background strip.

- [ ] **Step 3: Check scaled fallback progression**

Inspect representative early, midpoint, and late scroll positions before or while a poster is acting as fallback. Confirm its scale remains monotone from 1.03 toward 1.17 and its left/right bounds continue covering the viewport.

- [ ] **Step 4: Confirm video layers are unchanged**

After a scene video paints, verify `.sw-scene__video` remains full-viewport with `left = 0`, `right = 1280`, `object-fit: cover`, and no transform. Sample a scene seam and confirm the existing outgoing/incoming opacity relationship and full media coverage are unchanged.

- [ ] **Step 5: Check runtime health and report**

Inspect current-origin browser diagnostics. Expected: no console errors, media failures, or invalid seek errors. Report all-eleven poster coverage, representative zoom values, unchanged video/seam behavior, and any limitation.
