# Wider Hero Backdrop Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Widen the shared copy backdrop only while it represents the desktop hero, leaving case-study and mobile backdrop widths unchanged.

**Architecture:** The existing scroll-world runtime will label its shared backdrop with `data-context="hero"` or `data-context="scene"` according to the copy that currently controls backdrop opacity. The desktop skin will retain its current scene width and add one hero-context width override.

**Tech Stack:** Vanilla JavaScript, CSS, Node's built-in test runner.

## Global Constraints

- The case-study desktop backdrop remains `width:min(76vw,1040px)`.
- Only hero context uses `width:min(82vw,1120px)`.
- Gradient colors, stops, opacity logic, copy placement, videos, transitions, loading behavior, and mobile styles remain unchanged.

---

### Task 1: Label and Widen Only the Hero Backdrop

**Files:**
- Modify: `src/scroll-world.js:510-548`
- Modify: `src/styles.css:52-54`
- Test: `tests/scroll-world.test.js:660-710`
- Test: `tests/styles.test.js:31-69`

**Interfaces:**
- Produces DOM state: `.sw-copy-backdrop[data-context="hero"|"scene"]`.
- Produces desktop CSS: `.sw-root .sw-copy-backdrop[data-context="hero"] { width:min(82vw,1120px); }`.

- [ ] **Step 1: Write failing runtime and style assertions**

In `tests/scroll-world.test.js`, extend `directional copy backdrop follows readable copy and clears connectors`:

```js
fixture.setScroll(0);
fixture.dispatch('resize');
assert.equal(backdrop.dataset.context, 'hero');

fixture.setScroll(900);
fixture.dispatch('resize');
assert.equal(backdrop.dataset.context, 'scene');
```

In `tests/styles.test.js`, extend `desktop-only film layout preserves global skin and engine mobile behavior`:

```js
const desktopHeroBackdropRule = desktopFilm.match(
  /\.sw-root \.sw-copy-backdrop\[data-context="hero"\]\s*\{([^}]*)\}/,
)?.[1] ?? '';

assert.match(desktopBackdropRule, /width\s*:\s*min\(76vw,1040px\)\s*;/);
assert.match(desktopHeroBackdropRule, /width\s*:\s*min\(82vw,1120px\)\s*;/);
assert.doesNotMatch(globalStyles, /\.sw-root \.sw-copy-backdrop\[data-context="hero"\]/);
```

- [ ] **Step 2: Run the focused tests and verify they fail for the missing hero context**

Run:

```bash
node --test --test-name-pattern="directional copy backdrop|desktop-only film layout" tests/scroll-world.test.js tests/styles.test.js
```

Expected: both focused tests fail because `data-context` and the hero-only width rule do not exist.

- [ ] **Step 3: Label the shared backdrop from the dominant copy**

In `src/scroll-world.js`, track backdrop context alongside side and opacity:

```js
let backdropOpacity = 0;
let backdropSide = 'left';
let backdropContext = 'scene';
if (hero) {
  const opacity = heroOpacity(position, HERO_SCROLL);
  hero.style.opacity = opacity;
  hero.style.pointerEvents = opacity > 0.5 ? 'auto' : 'none';
  if (opacity > backdropOpacity) {
    backdropOpacity = opacity;
    backdropSide = hero.dataset.side;
    backdropContext = 'hero';
  }
}
```

Inside the existing copy-dominance branch add:

```js
backdropContext = 'scene';
```

Then write the state to the shared backdrop:

```js
copyBackdrop.dataset.context = backdropContext;
copyBackdrop.dataset.side = backdropSide;
copyBackdrop.style.opacity = backdropOpacity;
```

- [ ] **Step 4: Add the desktop-only hero width override**

In the existing `@media (min-width:861px)` block in `src/styles.css`:

```css
.sw-root .sw-copy-backdrop { width:min(76vw,1040px); }
.sw-root .sw-copy-backdrop[data-context="hero"] { width:min(82vw,1120px); }
```

- [ ] **Step 5: Run focused and full verification**

Run:

```bash
node --test --test-name-pattern="directional copy backdrop|desktop-only film layout" tests/scroll-world.test.js tests/styles.test.js
npm test
git diff --check
```

Expected: focused tests pass, all 69+ tests pass, and `git diff --check` produces no output.

- [ ] **Step 6: Commit the implementation**

```bash
git add src/scroll-world.js src/styles.css tests/scroll-world.test.js tests/styles.test.js
git commit -m "style: widen only the hero backdrop"
```
