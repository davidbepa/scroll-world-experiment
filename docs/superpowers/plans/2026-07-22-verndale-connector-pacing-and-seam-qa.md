# Verndale Connector Pacing and Seam QA Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make all five desktop connector videos advance 33% more slowly per scroll pixel and verify all ten scene/connector seams.

**Architecture:** Keep the existing scroll-scrub engine and media untouched. Change only the shared connector scroll-span configuration from `0.8` to `1.2` viewport heights, then validate the production setting, timeline behavior, assets, endpoint frames, and live browser transitions.

**Tech Stack:** JavaScript ES modules, Node.js test runner, Python static HTTP server, ffmpeg/ffprobe, in-app Chromium browser automation

## Global Constraints

- Desktop connectors use exactly `1.2` viewport heights each.
- Connector media progress is 33% slower per scroll pixel than the current `0.8`-viewport setting.
- Scene-specific scroll spans and the `0.08`-viewport crossfade band remain unchanged.
- Do not re-encode, trim, retime, or replace any video.
- Do not alter mobile poster mode, typography, copy placement, navigation, scene timing, or visual styling.
- All ten media seams must maintain full visual coverage and use the expected adjacent layers.

---

### Task 1: Lock and implement connector pacing

**Files:**
- Modify: `tests/cases.test.js`
- Modify: `src/cases.js`

**Interfaces:**
- Consumes: `createWorldConfig(): WorldConfig` from `src/cases.js`
- Produces: `WorldConfig.connScroll === 1.2` while preserving `WorldConfig.crossfade === 0.08`

- [ ] **Step 1: Write the failing production-configuration test**

Append this test to `tests/cases.test.js`:

```js
test('desktop connectors use the approved slower scroll span', () => {
  const config = createWorldConfig();
  assert.equal(config.connScroll, 1.2);
  assert.equal(config.crossfade, 0.08);
});
```

- [ ] **Step 2: Run the focused test to verify it fails**

Run:

```bash
node --test --test-name-pattern "desktop connectors use the approved slower scroll span" tests/cases.test.js
```

Expected: FAIL with an assertion showing actual `0.8` and expected `1.2`.

- [ ] **Step 3: Apply the minimal pacing change**

In `createWorldConfig()` in `src/cases.js`, replace:

```js
connScroll: 0.8,
```

with:

```js
connScroll: 1.2,
```

- [ ] **Step 4: Run the focused test to verify it passes**

Run:

```bash
node --test --test-name-pattern "desktop connectors use the approved slower scroll span" tests/cases.test.js
```

Expected: one matching test passes with no failures.

- [ ] **Step 5: Run regression and asset verification**

Run:

```bash
npm test
npm run verify:assets
```

Expected: the complete test suite passes; all six scene videos, five connector videos, and six stills pass asset verification.

- [ ] **Step 6: Commit the behavior change**

```bash
git add src/cases.js tests/cases.test.js
git commit -m "fix: slow connector scroll pacing"
```

### Task 2: Verify endpoint continuity and live desktop seams

**Files:**
- Inspect: `public/assets/video/*.mp4`
- Inspect: `src/scroll-world.js`
- No repository files are modified.

**Interfaces:**
- Consumes: the 11 ordered media segments built from `CASES` and `CONNECTORS`
- Produces: evidence for all ten adjacent-media boundaries and the five `1.2`-viewport connector spans

- [ ] **Step 1: Inspect source media metadata**

Use `ffprobe` on every file in `public/assets/video/` and record width, height, frame rate, frame count, duration, and codec. Expected: all files are readable desktop video assets with consistent presentation dimensions and frame rates.

- [ ] **Step 2: Compare every endpoint pair**

Extract the final frame of each outgoing segment and the first frame of each incoming segment for these ordered pairs:

```text
marinemax → connector-1
connector-1 → southeast-toyota-finance
southeast-toyota-finance → connector-2
connector-2 → iata
iata → connector-3
connector-3 → aspen-snowmass
aspen-snowmass → connector-4
connector-4 → honda-powersports
honda-powersports → connector-5
connector-5 → seaworld
```

Build a temporary side-by-side contact sheet and inspect all ten pairs for matching composition, color, camera direction, and absence of an obvious framing jump. Keep generated QA files outside the repository.

- [ ] **Step 3: Start a clean local preview**

Run:

```bash
python3 -m http.server 4180 --bind 127.0.0.1
```

Expected: the static server serves the page at `http://127.0.0.1:4180/` without startup errors.

- [ ] **Step 4: Inspect all ten live crossfade bands**

At a 1280×720 desktop viewport, inspect each boundary immediately before, at the midpoint of, and immediately after its `0.08 × 720 = 57.6px` crossfade band.

For each sample, confirm:

```text
before: outgoing layer opacity = 1
midpoint: outgoing layer opacity = 1; incoming layer opacity ≈ 0.5
after: incoming layer opacity = 1
coverage: maximum visible media opacity = 1
connector copy/overlay: hidden
media currentTime: follows scroll position
```

The expected boundary positions, in viewport heights from the top, are:

```text
2.15, 3.35, 4.60, 5.80, 7.05, 8.25, 9.65, 10.85, 12.10, 13.30
```

- [ ] **Step 5: Verify the slower connector mapping**

For each connector, compare its start and end positions and confirm the difference is exactly `1.2` viewport heights (`864px` at a 720px viewport). Sample 25%, 50%, and 75% of one connector and confirm video `currentTime / duration` tracks approximately `0.25`, `0.50`, and `0.75` after seek settling.

- [ ] **Step 6: Check runtime health**

Inspect browser console output after traversing the full page. Expected: no uncaught exceptions, media loading failures, or invalid seek errors.

- [ ] **Step 7: Report results**

Report the connector speed reduction, automated-test results, asset-verification results, all-ten-seam coverage result, endpoint visual assessment, and any remaining limitation without changing additional behavior.
