# Verndale Progressive Video Preloading Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reveal the desktop scroll film only after its first playable media window is decoded, preload the rest with two concurrent downloads, and hold decoded video instead of flashing posters when scrolling outruns the network.

**Architecture:** Add a small pure preload scheduler for priority selection and bounded background work, and add pure timeline helpers for segment playability and reachability. Keep fetch, blob, decode, loader DOM, scroll locking, and lifecycle cleanup inside the existing scroll-world runtime. The initial overlay waits for three priority clips to settle; later readiness gaps retain the last reachable video layer and expose a compact chapter-loading indicator.

**Tech Stack:** Vanilla ES modules, browser Fetch/Blob/AbortController APIs, HTML video events, CSS, Node's built-in test runner.

## Global Constraints

- Desktop film only; mobile poster mode and reduced-motion behavior remain unchanged.
- Do not change the eleven MP4 assets, their 720p resolution, CRF 20 encoding, compression, duration, or cache keys.
- Normal top entry prioritizes scene 1, connector 1, and scene 2; restored deep positions prioritize the current segment and immediate neighbors.
- Initial priority clips load in parallel; remaining clips use at most two concurrent downloads and prioritize forward clips.
- A clip is playable only after metadata and a decoded first frame are available; a failed clip is settled and intentionally falls back to its still.
- Never weaken existing decoded-frame seam locks, the connector 4 → Honda special handoff, or SeaWorld reachability.
- Destroy must abort pending fetches, remove loading UI, restore the exact previous document overflow values, and revoke object URLs.

---

### Task 1: Deterministic Preload Scheduling

**Files:**
- Create: `src/preload.js`
- Create: `tests/preload.test.js`

**Interfaces:**
- Produces: `selectPriorityIndices(segments, position, count = 3) -> number[]`
- Produces: `backgroundPreloadOrder(segments, priorityIndices, activeIndex) -> number[]`
- Produces: `runPreloadQueue(items, worker, concurrency = 2) -> Promise<void>`
- A segment is schedulable only when `segment.clip` is truthy.

- [ ] **Step 1: Write failing tests for top entry, restored entry, order, and concurrency**

Create `tests/preload.test.js`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  backgroundPreloadOrder,
  runPreloadQueue,
  selectPriorityIndices,
} from '../src/preload.js';

const segments = Array.from({ length: 7 }, (_, index) => ({
  start: index * 100,
  end: (index + 1) * 100,
  clip: `clip-${index}.mp4`,
}));

test('priority selection starts with the first three clips at the top', () => {
  assert.deepEqual(selectPriorityIndices(segments, 0), [0, 1, 2]);
});

test('priority selection centers a restored deep position when possible', () => {
  assert.deepEqual(selectPriorityIndices(segments, 450), [3, 4, 5]);
});

test('background order loads forward clips before earlier clips', () => {
  assert.deepEqual(backgroundPreloadOrder(segments, [3, 4, 5], 4), [6, 2, 1, 0]);
});

test('background queue never exceeds two active workers', async () => {
  const started = [];
  const releases = new Map();
  let active = 0;
  let peak = 0;
  const queue = runPreloadQueue([0, 1, 2, 3], index => new Promise(resolve => {
    started.push(index);
    active += 1;
    peak = Math.max(peak, active);
    releases.set(index, () => {
      active -= 1;
      resolve();
    });
  }), 2);

  await new Promise(resolve => setImmediate(resolve));
  assert.deepEqual(started, [0, 1]);
  releases.get(0)();
  await new Promise(resolve => setImmediate(resolve));
  assert.deepEqual(started, [0, 1, 2]);
  releases.get(1)();
  releases.get(2)();
  await new Promise(resolve => setImmediate(resolve));
  releases.get(3)();
  await queue;
  assert.equal(peak, 2);
});
```

- [ ] **Step 2: Run the new test and verify the module is missing**

Run: `node --test tests/preload.test.js`

Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `src/preload.js`.

- [ ] **Step 3: Implement the pure scheduler**

Create `src/preload.js`:

```js
export function selectPriorityIndices(segments, position, count = 3) {
  const available = segments
    .map((segment, index) => (segment.clip ? index : -1))
    .filter(index => index >= 0);
  if (!available.length || count <= 0) return [];

  let activeIndex = available[0];
  for (const index of available) {
    if (position >= segments[index].start) activeIndex = index;
  }
  const activeOffset = available.indexOf(activeIndex);
  const size = Math.min(count, available.length);
  const start = Math.max(0, Math.min(activeOffset - 1, available.length - size));
  return available.slice(start, start + size);
}

export function backgroundPreloadOrder(segments, priorityIndices, activeIndex) {
  const priority = new Set(priorityIndices);
  const available = segments
    .map((segment, index) => (segment.clip && !priority.has(index) ? index : -1))
    .filter(index => index >= 0);
  return [
    ...available.filter(index => index > activeIndex).sort((a, b) => a - b),
    ...available.filter(index => index < activeIndex).sort((a, b) => b - a),
  ];
}

export async function runPreloadQueue(items, worker, concurrency = 2) {
  const queue = [...items];
  const workerCount = Math.min(Math.max(1, concurrency), queue.length);
  await Promise.all(Array.from({ length: workerCount }, async () => {
    while (queue.length) {
      const item = queue.shift();
      await worker(item);
    }
  }));
}
```

- [ ] **Step 4: Run the scheduler tests**

Run: `node --test tests/preload.test.js`

Expected: 4 tests pass, 0 fail.

- [ ] **Step 5: Commit the scheduler**

```bash
git add src/preload.js tests/preload.test.js
git commit -m "feat: add bounded video preload scheduler"
```

---

### Task 2: Pure Segment Readiness and Reachability

**Files:**
- Modify: `src/timeline.js:1-90`
- Modify: `tests/timeline.test.js:1-190`

**Interfaces:**
- Produces: `isSegmentPlayable(segment) -> boolean`
- Produces: `reachableSegmentIndex(currentIndex, requestedIndex, segments) -> number`
- `failed` and clipless segments are traversable because their poster is an intentional fallback.
- A configured clip requires both `ready === true` and `painted === true`.

- [ ] **Step 1: Add failing readiness tests**

Add the two exports to the import list in `tests/timeline.test.js`, then add:

```js
test('configured video is playable only after metadata and a frame are ready', () => {
  assert.equal(isSegmentPlayable({ clip: 'scene.mp4', ready: false, painted: false }), false);
  assert.equal(isSegmentPlayable({ clip: 'scene.mp4', ready: true, painted: false }), false);
  assert.equal(isSegmentPlayable({ clip: 'scene.mp4', ready: true, painted: true }), true);
  assert.equal(isSegmentPlayable({ clip: 'scene.mp4', failed: true }), true);
  assert.equal(isSegmentPlayable({ clip: null }), true);
});

test('reachability stops at the first unplayable segment in either direction', () => {
  const chain = [
    { clip: '0.mp4', ready: true, painted: true },
    { clip: '1.mp4', ready: true, painted: true },
    { clip: '2.mp4', ready: false, painted: false },
    { clip: '3.mp4', ready: true, painted: true },
  ];
  assert.equal(reachableSegmentIndex(1, 3, chain), 1);
  assert.equal(reachableSegmentIndex(3, 0, chain), 3);
  chain[2].failed = true;
  assert.equal(reachableSegmentIndex(1, 3, chain), 3);
  assert.equal(reachableSegmentIndex(3, 0, chain), 0);
});
```

- [ ] **Step 2: Run the focused timeline tests and verify the missing exports fail**

Run: `node --test --test-name-pattern="playable|reachability" tests/timeline.test.js`

Expected: FAIL because `isSegmentPlayable` and `reachableSegmentIndex` are not exported.

- [ ] **Step 3: Implement the readiness helpers**

Add to `src/timeline.js` after `smoothstep`:

```js
export function isSegmentPlayable(segment) {
  return Boolean(
    !segment?.clip
      || segment.failed
      || (segment.ready && segment.painted),
  );
}

export function reachableSegmentIndex(currentIndex, requestedIndex, segments) {
  if (!segments.length) return 0;
  const current = clamp(currentIndex, 0, segments.length - 1);
  const requested = clamp(requestedIndex, 0, segments.length - 1);
  const direction = Math.sign(requested - current);
  if (!direction) return current;
  let reachable = current;
  for (let index = current + direction;
    direction > 0 ? index <= requested : index >= requested;
    index += direction) {
    if (!isSegmentPlayable(segments[index])) break;
    reachable = index;
  }
  return reachable;
}
```

- [ ] **Step 4: Run timeline tests**

Run: `node --test tests/timeline.test.js`

Expected: all timeline tests pass, including decoded-frame seam tests.

- [ ] **Step 5: Commit readiness math**

```bash
git add src/timeline.js tests/timeline.test.js
git commit -m "feat: add video readiness reachability"
```

---

### Task 3: Promise-Based Clip Fetch and Decode Lifecycle

**Files:**
- Modify: `src/scroll-world.js:10-18, 48-57, 143-175, 261-316, 466-490`
- Modify: `tests/scroll-world.test.js:35-181`

**Interfaces:**
- Consumes: `selectPriorityIndices`, `backgroundPreloadOrder`, `runPreloadQueue` from `src/preload.js`.
- Produces inside `mountScrollWorld`: `loadClip(segment) -> Promise<{ playable: boolean, failed: boolean }>`.
- Adds controller interface: `whenReady -> Promise<void>` for deterministic integration tests and callers.
- A segment adds `loadPromise`, `resolveLoad`, `loadSettled`, and `abortController` lifecycle fields.

- [ ] **Step 1: Extend the fake browser fixture and add a failing idempotent decode test**

In `tests/scroll-world.test.js`, give `FakeElement` a `dispatch` method and video stubs:

```js
dispatch(type, event = {}) {
  for (const handler of this.listeners.get(type) || []) handler(event);
}

pause() {}
play() { return Promise.resolve(); }
```

Replace `createBrowserFixture` with this complete version:

```js
function createBrowserFixture({ reduceMotion = true, fetchImpl } = {}) {
  const documentElement = new FakeElement('html');
  const head = new FakeElement('head');
  const body = new FakeElement('body');
  const document = {
    documentElement,
    head,
    body,
    createElement: tagName => new FakeElement(tagName),
    getElementById(id) {
      let match = null;
      const visit = node => {
        if (node.id === id) match = node;
        node.children.forEach(visit);
      };
      visit(head);
      visit(body);
      return match;
    },
  };
  const listeners = new Map();
  const window = {
    innerHeight: 900,
    innerWidth: 1440,
    scrollY: 0,
    pageYOffset: 0,
    matchMedia: query => ({ matches: reduceMotion && query.includes('prefers-reduced-motion') }),
    addEventListener(type, handler) {
      const handlers = listeners.get(type) || new Set();
      handlers.add(handler);
      listeners.set(type, handlers);
    },
    removeEventListener(type, handler) {
      listeners.get(type)?.delete(handler);
    },
    scrollTo() {},
  };
  const previous = {
    window: globalThis.window,
    document: globalThis.document,
    requestAnimationFrame: globalThis.requestAnimationFrame,
    cancelAnimationFrame: globalThis.cancelAnimationFrame,
    fetch: globalThis.fetch,
    URL: globalThis.URL,
  };
  globalThis.window = window;
  globalThis.document = document;
  globalThis.requestAnimationFrame = () => 1;
  globalThis.cancelAnimationFrame = () => {};
  globalThis.fetch = fetchImpl ?? previous.fetch;
  globalThis.URL = {
    createObjectURL: blob => `blob:${blob.url ?? 'test'}`,
    revokeObjectURL() {},
  };

  return {
    document,
    createRoot() {
      const root = new FakeElement('main');
      body.appendChild(root);
      return root;
    },
    setScroll(value) {
      window.scrollY = value;
      window.pageYOffset = value;
    },
    dispatch(type) {
      for (const handler of listeners.get(type) || []) handler();
    },
    restore() {
      Object.assign(globalThis, previous);
    },
  };
}
```

Add a `flush` helper and the test:

```js
const flush = () => new Promise(resolve => setImmediate(resolve));

test('priority clip fetches are idempotent and settle after decoded data', async () => {
  const requests = [];
  const fixture = createBrowserFixture({
    reduceMotion: false,
    fetchImpl: async url => {
      requests.push(url);
      return { ok: true, blob: async () => ({ url }) };
    },
  });
  try {
    const root = fixture.createRoot();
    const controller = mountScrollWorld(root, {
      atmosphere: false,
      nav: false,
      sections: [
        { id: 'one', label: 'One', still: '', clip: 'one.mp4', scroll: 1 },
        { id: 'two', label: 'Two', still: '', clip: 'two.mp4', scroll: 1 },
      ],
      connectors: ['connector.mp4'],
    });
    await flush();
    assert.deepEqual(requests, ['one.mp4', 'connector.mp4', 'two.mp4']);
    for (const video of root.querySelectorAll('.sw-scene__video')) {
      video.duration = 5;
      video.dispatch('loadedmetadata');
      video.dispatch('loadeddata');
    }
    await controller.whenReady;
    assert.equal(new Set(requests).size, 3);
    controller.destroy();
  } finally {
    fixture.restore();
  }
});
```

- [ ] **Step 2: Run the focused test and verify `whenReady` or fetch ordering fails**

Run: `node --test --test-name-pattern="priority clip fetches" tests/scroll-world.test.js`

Expected: FAIL because the runtime neither starts three priority fetches nor exposes `whenReady`.

- [ ] **Step 3: Convert media loading to an idempotent promise**

Import the preload helpers. Extend segment state with:

```js
loadPromise: null,
resolveLoad: null,
loadSettled: false,
abortController: null,
```

Add this settlement helper and replace `loadClip`:

```js
function settleClip(s, playable) {
  if (s.loadSettled) return;
  s.loadSettled = true;
  s.loading = false;
  const resolve = s.resolveLoad;
  s.resolveLoad = null;
  resolve?.({ playable, failed: s.failed });
}

function loadClip(s) {
  if (s.loadPromise) return s.loadPromise;
  if (reduce || !s.clip || destroyed) {
    return Promise.resolve({ playable: !s.clip, failed: false });
  }
  s.loading = true;
  s.loadPromise = new Promise(resolve => { s.resolveLoad = resolve; });
  s.abortController = new AbortController();
  const url = isMobile() && s.clipM ? s.clipM : s.clip;
  fetch(url, { signal: s.abortController.signal })
    .then(response => response.ok
      ? response.blob()
      : Promise.reject(new Error(`Media request failed: ${response.status}`)))
    .then(blob => {
      if (destroyed) return;
      const video = document.createElement('video');
      video.className = 'sw-scene__video';
      video.muted = true;
      video.playsInline = true;
      video.preload = 'auto';
      video.setAttribute('muted', '');
      video.setAttribute('playsinline', '');
      const objectUrl = URL.createObjectURL(blob);
      objectUrls.add(objectUrl);
      s.objectUrl = objectUrl;
      video.src = objectUrl;
      listen(video, 'loadedmetadata', () => {
        if (destroyed || s.failed) return;
        s.ready = true;
        read();
      });
      listen(video, 'loadeddata', () => {
        if (destroyed || s.failed) return;
        s.ready = true;
        s.painted = true;
        try { video.pause(); } catch (error) { /* no-op */ }
        if (userReady) primeVideo(video);
        settleClip(s, true);
        read();
      });
      listen(video, 'seeked', () => {
        if (destroyed || s.failed) return;
        s.painted = true;
        read();
      });
      listen(video, 'error', () => markMediaError(s, video), { once: true });
      s.el.appendChild(video);
      s.video = video;
      s.hasClip = true;
    })
    .catch(error => {
      if (!destroyed && error?.name !== 'AbortError') markMediaError(s);
    });
  return s.loadPromise;
}
```

Finish `markMediaError` with `settleClip(s, false)`. In `destroy`, abort every `segment.abortController` before revoking object URLs.

- [ ] **Step 4: Start the initial priority group and expose `whenReady`**

After the first `layout()`, derive the active index, schedule the initial three clips, and then start the bounded background queue:

```js
let resolveInitialReady;
const whenReady = new Promise(resolve => { resolveInitialReady = resolve; });

function segmentIndexAt(position) {
  let index = 0;
  for (let candidate = 1; candidate < NSEG; candidate += 1) {
    if (position >= SEGMENTS[candidate].start) index = candidate;
  }
  return index;
}

async function startPreloading() {
  if (reduce || destroyed) {
    resolveInitialReady();
    return;
  }
  const active = segmentIndexAt(window.scrollY || window.pageYOffset);
  const priority = selectPriorityIndices(SEGMENTS, window.scrollY || window.pageYOffset, 3);
  await Promise.all(priority.map(index => loadClip(SEGMENTS[index])));
  if (destroyed) return;
  resolveInitialReady();
  const background = backgroundPreloadOrder(SEGMENTS, priority, active);
  void runPreloadQueue(background, index => loadClip(SEGMENTS[index]), 2);
}
```

Call `void startPreloading()` after `layout()`, and add `whenReady` to the returned controller.

- [ ] **Step 5: Run the focused test and the complete scroll-world test file**

Run: `node --test --test-name-pattern="priority clip fetches" tests/scroll-world.test.js`

Expected: focused test passes.

Run: `node --test tests/scroll-world.test.js`

Expected: all scroll-world tests pass, including Honda and SeaWorld regressions.

- [ ] **Step 6: Commit the loading lifecycle**

```bash
git add src/scroll-world.js tests/scroll-world.test.js
git commit -m "feat: preload and decode priority video window"
```

---

### Task 4: Branded Initial Loader and Safe Scroll Lock

**Files:**
- Modify: `src/scroll-world.js:84-175, 437-490, 520-645`
- Modify: `tests/scroll-world.test.js`
- Modify: `tests/styles.test.js`

**Interfaces:**
- Consumes: `whenReady` and priority settlement from Task 3.
- Produces DOM: `.sw-loader`, `.sw-loader__logo`, `.sw-loader__bar > i`, `.sw-loader__label`.
- Produces DOM: `.sw-chapter-loader` with text `Loading next chapter` for Task 5.
- Produces internal `unlockScroll()` idempotent cleanup.

- [ ] **Step 1: Add failing loader markup, progress, and cleanup tests**

Add to `tests/scroll-world.test.js`:

```js
test('initial loader locks scrolling until priority clips settle', async () => {
  let resolveFetch;
  const fixture = createBrowserFixture({
    reduceMotion: false,
    fetchImpl: () => new Promise(resolve => { resolveFetch = resolve; }),
  });
  fixture.document.documentElement.style.overflow = 'clip';
  fixture.document.body.style.overflow = 'auto';
  try {
    const root = fixture.createRoot();
    const controller = mountScrollWorld(root, {
      atmosphere: false,
      nav: false,
      sections: [{ id: 'one', label: 'One', still: '', clip: 'one.mp4' }],
      connectors: [],
    });
    const [loader] = root.querySelectorAll('.sw-loader');
    assert.ok(loader);
    assert.equal(fixture.document.documentElement.style.overflow, 'hidden');
    assert.equal(fixture.document.body.style.overflow, 'hidden');
    resolveFetch({ ok: true, blob: async () => ({ url: 'one.mp4' }) });
    await flush();
    const [video] = root.querySelectorAll('.sw-scene__video');
    video.duration = 5;
    video.dispatch('loadedmetadata');
    video.dispatch('loadeddata');
    await controller.whenReady;
    assert.equal(loader.classList.contains('is-complete'), true);
    assert.equal(fixture.document.documentElement.style.overflow, 'clip');
    assert.equal(fixture.document.body.style.overflow, 'auto');
    controller.destroy();
  } finally {
    fixture.restore();
  }
});

test('destroy restores scrolling while priority media is pending', () => {
  const fixture = createBrowserFixture({
    reduceMotion: false,
    fetchImpl: () => new Promise(() => {}),
  });
  fixture.document.documentElement.style.overflow = '';
  fixture.document.body.style.overflow = 'scroll';
  try {
    const controller = mountScrollWorld(fixture.createRoot(), {
      atmosphere: false,
      nav: false,
      sections: [{ id: 'one', label: 'One', still: '', clip: 'pending.mp4' }],
      connectors: [],
    });
    controller.destroy();
    assert.equal(fixture.document.documentElement.style.overflow, '');
    assert.equal(fixture.document.body.style.overflow, 'scroll');
  } finally {
    fixture.restore();
  }
});
```

Add to `tests/styles.test.js`:

```js
test('film loader uses the official logo and exposes both loading states', () => {
  assert.match(engine, /public\/assets\/brand\/verndale-logo\.svg/);
  assert.match(engine, /Preparing the experience/);
  assert.match(engine, /Loading next chapter/);
  assert.match(engine, /\.sw-loader\{/);
  assert.match(engine, /\.sw-loader\.is-complete\{/);
  assert.match(engine, /\.sw-chapter-loader\.is-active\{/);
});
```

- [ ] **Step 2: Run the loader tests and verify they fail**

Run: `node --test --test-name-pattern="loader|loading states" tests/scroll-world.test.js tests/styles.test.js`

Expected: FAIL because loader DOM and styles do not exist.

- [ ] **Step 3: Build the loader DOM and scroll lock**

Create the nodes before `mountedNodes`:

```js
const loader = el('div', 'sw-loader');
loader.setAttribute('role', 'status');
loader.setAttribute('aria-live', 'polite');
const loaderLogo = el('img', 'sw-loader__logo');
loaderLogo.src = 'public/assets/brand/verndale-logo.svg';
loaderLogo.alt = 'Verndale';
const loaderLabel = el('span', 'sw-loader__label');
loaderLabel.textContent = 'Preparing the experience';
const loaderBar = el('span', 'sw-loader__bar');
const loaderFill = el('i');
loaderBar.appendChild(loaderFill);
loader.append(loaderLogo, loaderLabel, loaderBar);

const chapterLoader = el('div', 'sw-chapter-loader');
chapterLoader.setAttribute('role', 'status');
chapterLoader.textContent = 'Loading next chapter';
```

Append both nodes and include them in lifecycle cleanup. Add:

```js
let scrollLocked = false;
const previousOverflow = {
  html: document.documentElement.style.overflow,
  body: document.body.style.overflow,
};

function lockScroll() {
  if (scrollLocked) return;
  scrollLocked = true;
  document.documentElement.style.overflow = 'hidden';
  document.body.style.overflow = 'hidden';
}

function unlockScroll() {
  if (!scrollLocked) return;
  scrollLocked = false;
  document.documentElement.style.overflow = previousOverflow.html;
  document.body.style.overflow = previousOverflow.body;
}
```

Call `lockScroll()` immediately before starting a non-empty desktop priority group. If reduced motion is active or no configured clips exist, add `is-complete` to the loader immediately and never lock document scrolling.

Update `startPreloading` after each priority settlement:

```js
let settledPriority = 0;
await Promise.all(priority.map(async index => {
  await loadClip(SEGMENTS[index]);
  settledPriority += 1;
  loaderFill.style.transform = `scaleX(${settledPriority / priority.length})`;
}));
loader.classList.add('is-complete');
container.dataset.loading = 'false';
unlockScroll();
resolveInitialReady();
```

For an empty priority set, complete immediately with progress `scaleX(1)`. Call `unlockScroll()` from `destroy`.

- [ ] **Step 4: Add loader styles**

Add to the injected engine CSS:

```css
.sw-loader{position:fixed;inset:0;z-index:100;display:grid;place-content:center;justify-items:center;gap:22px;background:#fff;opacity:1;visibility:visible;transition:opacity .45s ease,visibility 0s linear .45s;pointer-events:auto}
.sw-loader.is-complete{opacity:0;visibility:hidden;pointer-events:none}
.sw-loader__logo{display:block;width:clamp(170px,18vw,250px);height:auto}
.sw-loader__label{font-size:.76rem;font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:var(--sw-ink-soft)}
.sw-loader__bar{display:block;width:min(260px,62vw);height:3px;overflow:hidden;background:color-mix(in srgb,var(--sw-ink) 12%,transparent)}
.sw-loader__bar i{display:block;width:100%;height:100%;transform:scaleX(0);transform-origin:left;background:#6a2ff3;transition:transform .25s ease}
.sw-chapter-loader{position:fixed;left:50%;bottom:66px;z-index:45;transform:translate(-50%,8px);padding:8px 14px;border-radius:999px;background:color-mix(in srgb,#fff 88%,transparent);color:var(--sw-ink);font-size:.72rem;font-weight:600;letter-spacing:.08em;text-transform:uppercase;opacity:0;visibility:hidden;transition:opacity .2s,transform .2s,visibility 0s linear .2s;backdrop-filter:blur(10px)}
.sw-chapter-loader.is-active{opacity:1;visibility:visible;transform:translate(-50%,0);transition-delay:0s}
```

- [ ] **Step 5: Run focused and full UI tests**

Run: `node --test --test-name-pattern="loader|loading states" tests/scroll-world.test.js tests/styles.test.js`

Expected: focused tests pass.

Run: `node --test tests/scroll-world.test.js tests/styles.test.js`

Expected: all scroll-world and style tests pass.

- [ ] **Step 6: Commit the loading presentation**

```bash
git add src/scroll-world.js tests/scroll-world.test.js tests/styles.test.js
git commit -m "feat: add branded film loading state"
```

---

### Task 5: Runtime Readiness Hold, Failure Release, and Final QA

**Files:**
- Modify: `src/scroll-world.js:10-15, 229-259, 261-417`
- Modify: `tests/scroll-world.test.js`
- Modify: `tests/timeline.test.js`

**Interfaces:**
- Consumes: `isSegmentPlayable` and `reachableSegmentIndex` from `src/timeline.js`.
- Maintains `displaySegmentIndex`, the last segment the viewer can reach through settled media.
- `.sw-chapter-loader.is-active` means requested scroll or a seam wants an unready configured clip.
- Failed media is traversable and therefore shows its intentional poster fallback.

- [ ] **Step 1: Add failing runtime hold and failure-release tests**

Add this deterministic media controller near `flush` in `tests/scroll-world.test.js`:

```js
function createControlledMediaFixture() {
  const requests = new Map();
  const fixture = createBrowserFixture({
    reduceMotion: false,
    fetchImpl: url => new Promise((resolve, reject) => {
      requests.set(url, { resolve, reject });
    }),
  });

  async function waitForRequest(url) {
    while (!requests.has(url)) await flush();
    return requests.get(url);
  }

  fixture.resolveVideo = async (root, url) => {
    const request = await waitForRequest(url);
    request.resolve({ ok: true, blob: async () => ({ url }) });
    await flush();
    const video = root.querySelectorAll('.sw-scene__video')
      .find(candidate => candidate.src === `blob:${url}`);
    assert.ok(video, `missing video element for ${url}`);
    video.duration = 5;
    video.dispatch('loadedmetadata');
    video.dispatch('loadeddata');
    await flush();
  };

  fixture.rejectVideo = async (url) => {
    const request = await waitForRequest(url);
    request.reject(new Error(`failed ${url}`));
    await flush();
  };

  fixture.settlePriorityVideos = async root => {
    await Promise.all([
      fixture.resolveVideo(root, 'one.mp4'),
      fixture.resolveVideo(root, 'one-two.mp4'),
      fixture.resolveVideo(root, 'two.mp4'),
    ]);
  };

  return fixture;
}

function threeSceneFilmConfig() {
  return {
    atmosphere: false,
    nav: false,
    connScroll: 1,
    sections: [
      { id: 'one', label: 'One', still: 'one.webp', clip: 'one.mp4', scroll: 1 },
      { id: 'two', label: 'Two', still: 'two.webp', clip: 'two.mp4', scroll: 1 },
      { id: 'three', label: 'Three', still: 'three.webp', clip: 'three.mp4', scroll: 1 },
    ],
    connectors: ['one-two.mp4', 'two-three.mp4'],
  };
}
```

Then add the failing runtime tests:

```js
test('fast scrolling holds decoded video instead of exposing an unready poster', async () => {
  const fixture = createControlledMediaFixture();
  try {
    const root = fixture.createRoot();
    const controller = mountScrollWorld(root, threeSceneFilmConfig());
    await fixture.settlePriorityVideos(root);
    await controller.whenReady;
    const scenes = root.querySelectorAll('.sw-scene');
    fixture.setScroll(4050);
    fixture.dispatch('resize');
    assert.deepEqual(scenes.map(scene => Number(scene.style.opacity)), [0, 0, 1, 0, 0]);
    assert.equal(root.querySelectorAll('.sw-chapter-loader')[0].classList.contains('is-active'), true);
    controller.destroy();
  } finally {
    fixture.restore();
  }
});

test('failed future video releases the readiness hold to its poster', async () => {
  const fixture = createControlledMediaFixture();
  try {
    const root = fixture.createRoot();
    const controller = mountScrollWorld(root, threeSceneFilmConfig());
    await fixture.settlePriorityVideos(root);
    await controller.whenReady;
    await fixture.resolveVideo(root, 'two-three.mp4');
    await fixture.rejectVideo('three.mp4');
    fixture.setScroll(4050);
    fixture.dispatch('resize');
    const scenes = root.querySelectorAll('.sw-scene');
    assert.equal(Number(scenes[4].style.opacity), 1);
    assert.equal(scenes[4].classList.contains('has-clip'), false);
    assert.equal(root.querySelectorAll('.sw-chapter-loader')[0].classList.contains('is-active'), false);
    controller.destroy();
  } finally {
    fixture.restore();
  }
});
```

- [ ] **Step 2: Run the focused hold tests and verify poster exposure fails**

Run: `node --test --test-name-pattern="fast scrolling|failed future" tests/scroll-world.test.js`

Expected: FAIL because the runtime follows scroll position even when later clips are unready.

- [ ] **Step 3: Gate seam readiness and requested segment reachability**

Import the Task 2 helpers and add `displaySegmentIndex` beside `currentSegmentIndex`. In `read`, calculate requested position before layer opacities:

```js
let requestedSegmentIndex = 0;
for (let index = 1; index < NSEG; index += 1) {
  if (y >= SEGMENTS[index].start) requestedSegmentIndex = index;
}
const reachable = reachableSegmentIndex(
  displaySegmentIndex,
  requestedSegmentIndex,
  SEGMENTS,
);
const waitingForChapter = reachable !== requestedSegmentIndex;
displaySegmentIndex = reachable;

const layerOpacities = waitingForChapter
  ? SEGMENTS.map((segment, index) => (index === displaySegmentIndex ? 1 : 0))
  : segmentLayerOpacities(
    y,
    SEGMENTS,
    fade,
    (outgoingIndex, incomingIndex) => isSegmentPlayable(SEGMENTS[incomingIndex])
      && mediaAtEdge(SEGMENTS[outgoingIndex], 'end')
      && mediaAtEdge(SEGMENTS[incomingIndex], 'start'),
  );

const waitingAtSeam = layerOpacities.some((opacity, index) => (
  opacity > 0.001
  && index < NSEG - 1
  && y >= SEGMENTS[index + 1].start - fade / 2
  && !isSegmentPlayable(SEGMENTS[index + 1])
));
chapterLoader.classList.toggle('is-active', waitingForChapter || waitingAtSeam);
```

Assign `currentSegmentIndex = requestedSegmentIndex` for reporting. Remove the `inHeroBand` exception from `has-clip`; once the initial loader clears, scene 1 must already be video-backed under the hero:

```js
s.el.classList.toggle('has-clip', s.painted && !s.failed);
```

When initial priority settlement completes, set `displaySegmentIndex` to the restored requested index before the loader fades. Every `settleClip` and `markMediaError` calls `read()` so the hold releases immediately without another scroll event.

- [ ] **Step 4: Run hold tests, seam regressions, and full unit suite**

Run: `node --test --test-name-pattern="fast scrolling|failed future|after-boundary|later scene|media edge" tests/scroll-world.test.js tests/timeline.test.js`

Expected: readiness tests and connector 4/Honda/SeaWorld regressions pass.

Run: `npm test`

Expected: all tests pass with 0 failures.

- [ ] **Step 5: Verify asset contract and static diff quality**

Run: `npm run verify:assets`

Expected: `verified 6 stills and 11 videos`.

Run: `git diff --check`

Expected: no output and exit 0.

- [ ] **Step 6: Perform desktop browser QA at 1280×720**

Start or reuse the local server, open the page with an empty cache, and verify:

1. The Verndale loader is the first visible UI and uses the official logo.
2. Its progress advances across the three priority clips.
3. The loader fades only after scene 1, connector 1, and scene 2 have decoded frames.
4. Scene 1 is video-backed when the loader clears; no still-to-video flash occurs.
5. Under network throttling, fast scrolling holds the last decoded video and shows `Loading next chapter` rather than a poster.
6. Releasing the throttle loads the requested segment and removes the chapter indicator.
7. A normal full pass preserves all ten seams.
8. Connector 4 reaches its decoded last frame before Honda appears.
9. Honda → connector 5 → SeaWorld completes, with SeaWorld as the only visible scene and status `06 / 06`.
10. Reverse to connector 4 and forward to SeaWorld again; the final scene remains reachable.
11. No uncaught runtime errors are present.

- [ ] **Step 7: Commit the readiness guard**

```bash
git add src/scroll-world.js src/timeline.js tests/scroll-world.test.js tests/timeline.test.js
git commit -m "feat: prevent poster flashes during progressive loading"
```

- [ ] **Step 8: Run post-commit verification**

Run: `npm test`

Expected: all tests pass with 0 failures.

Run: `npm run verify:assets`

Expected: `verified 6 stills and 11 videos`.

Run: `git status --short`

Expected: only the pre-existing untracked `.agents/` and `skills-lock.json` entries; no implementation files remain modified.
