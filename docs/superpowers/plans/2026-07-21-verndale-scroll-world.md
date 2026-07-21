# Verndale Scroll-World Landing Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and verify a standalone desktop scroll-scrubbed Verndale landing page that flies through six glossy, frame-locked client systems and degrades to an accessible poster experience on phones and for reduced motion.

**Architecture:** Plain HTML, CSS, and native JavaScript serve a config-driven page with no runtime dependencies. Pure timeline and manifest modules feed an adapted copy of the scroll-world reference engine; a Bash 3.2-safe Higgsfield pipeline generates, frame-locks, encodes, and verifies the Draft media chain. The render workflow pauses after calibration and after the still review so credit usage and visual coherence are approved before downstream spending.

**Tech Stack:** HTML5, CSS, ES modules on Node.js 22, Node's built-in test runner, Bash 3.2, Higgsfield CLI, `seedance_2_0_mini`, `gpt_image_2`, `ffmpeg`/`ffprobe`, `jq`, `cwebp`, and the portable scrub engine in `.agents/skills/scroll-world/references/scrub-engine.js`.

## Global Constraints

- Use the exact approved brand palette: sun yellow `#FFB800`, electric purple `#6A2FF3`, lavender `#E1D5FD`, ink `#1C1C1C`, white `#FFFFFF`.
- Use Titillium Web for display text and Open Sans for body text, with local system fallbacks.
- Preserve the six-case order: MarineMax, Southeast Toyota Finance, IATA, Aspen Snowmass, Honda Powersports, SeaWorld.
- Render Phase 1 only: six `gpt_image_2` stills, six `seedance_2_0_mini` dives, and five `seedance_2_0_mini` connectors at 720p.
- Desktop film only: do not create, load, or advertise mobile video variants; phone/coarse-pointer and reduced-motion modes render posters and copy.
- Keep every connector frame-locked to the neighboring rendered dives' actual boundary frames.
- Use one video model for the entire Draft chain.
- Reuse the approved style preamble byte-for-byte in all six still prompts.
- Do not batch renders until one still and one Draft dive have calibrated actual trial/credit use.
- Pause if projected usage exceeds 70% of the verified allowance or the allowance cannot be verified.
- Standard 1080p rendering, deployment, CMS integration, analytics setup, and production-site changes remain out of scope.
- Use Bash 3.2-safe syntax: no associative arrays and no zsh array loops.
- Use `apply_patch` for source-file edits; generated media and generated prompt files may be written by the checked-in pipeline.

## File Structure

| Path | Responsibility |
|---|---|
| `package.json` | Dependency-free test and local-serve commands |
| `index.html` | Semantic document shell, fixed primary header, and world mount point |
| `src/cases.js` | Single source of truth for case copy, proof, render subjects, asset paths, pacing, and connectors |
| `src/timeline.js` | Pure scroll-segment, linger, hero, copy-opacity, and active-section math |
| `src/poster-world.js` | Accessible static poster experience for phone and reduced-motion modes |
| `src/scroll-world.js` | Adapted portable scrub engine for desktop film mode |
| `src/main.js` | Mode selection, local QA fault injection, and page mounting |
| `src/styles.css` | Verndale tokens, primary header, desktop chrome, poster layout, and overrides for the engine |
| `public/assets/fallback-system.svg` | Production fallback image for unavailable stills or clips |
| `public/assets/stills/*.webp` | Six approved generated posters |
| `public/assets/video/*.mp4` | Six encoded dives and five encoded connectors |
| `render/prompts.mjs` | Exact shared style and still/dive/connector prompt builders |
| `scripts/write-prompts.mjs` | Generates all 17 prompt text files into `.render/prompts/` |
| `scripts/render-common.sh` | Shared workspace, model flags, IDs, result download, and encode functions |
| `scripts/render.sh` | Bash 3.2-safe pipeline entry point with named stages |
| `scripts/verify-assets.mjs` | Checks expected public asset filenames and invokes `ffprobe` assertions |
| `tests/cases.test.js` | Manifest order, copy, CTA, asset, and desktop-only contract |
| `tests/timeline.test.js` | Deterministic timeline and opacity behavior |
| `tests/poster-world.test.js` | Safe, complete static fallback markup |
| `tests/prompts.test.js` | Prompt count, shared preamble, seam language, and SeaWorld filter-safe wording |
| `tests/render-contract.test.js` | Render script model, flag, endpoint, and Bash compatibility contract |
| `.render/` | Ignored raw jobs, source media, extracted frames, logs, and QA output |
| `docs/render-calibration.md` | Recorded before/after allowance data and approved batch estimate |

---

### Task 1: Lock the Case Manifest

**Files:**
- Create: `package.json`
- Create: `src/cases.js`
- Create: `tests/cases.test.js`
- Modify: `.gitignore`

**Interfaces:**
- Consumes: approved design in `docs/superpowers/specs/2026-07-21-verndale-scroll-world-design.md`
- Produces: `CASES: CaseStudy[]`, `CONNECTORS: string[]`, and `createWorldConfig(): WorldConfig`

- [ ] **Step 1: Write the failing manifest contract**

```js
// tests/cases.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import { CASES, CONNECTORS, createWorldConfig } from '../src/cases.js';

const expectedIds = [
  'marinemax',
  'southeast-toyota-finance',
  'iata',
  'aspen-snowmass',
  'honda-powersports',
  'seaworld',
];

test('case manifest preserves approved order and completeness', () => {
  assert.deepEqual(CASES.map(({ id }) => id), expectedIds);
  assert.equal(CONNECTORS.length, CASES.length - 1);
  for (const scene of CASES) {
    assert.ok(scene.label);
    assert.ok(scene.eyebrow);
    assert.ok(scene.title);
    assert.ok(scene.body);
    assert.equal(scene.tags.length, 3);
    assert.match(scene.still, /^public\/assets\/stills\/.+\.webp$/);
    assert.match(scene.clip, /^public\/assets\/video\/.+\.mp4$/);
    assert.equal('clipMobile' in scene, false);
    assert.equal('stillMobile' in scene, false);
  }
});

test('hero and finale CTAs are exact', () => {
  const config = createWorldConfig();
  assert.equal(config.hero.title, 'Experience is your growth system.');
  assert.equal(config.hero.scroll, 0.65);
  assert.equal(config.sections.at(-1).cta.primary.label, "Build what's next");
  assert.equal(config.sections.at(-1).cta.primary.href, 'https://www.verndale.com/contact-us');
  assert.equal(config.mobileMode, 'posters');
});
```

- [ ] **Step 2: Run the test and confirm the missing module failure**

Run: `node --test tests/cases.test.js`  
Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `src/cases.js`.

- [ ] **Step 3: Create the dependency-free project contract**

```json
{
  "name": "verndale-scroll-world",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "node --test tests/*.test.js",
    "serve": "python3 -m http.server 4173",
    "prompts": "node scripts/write-prompts.mjs",
    "verify:assets": "node scripts/verify-assets.mjs"
  }
}
```

Append `.render/` to `.gitignore`.

- [ ] **Step 4: Implement the exact case manifest**

Create `src/cases.js` with this data shape and all six approved records:

```js
export const CASES = [
  {
    id: 'marinemax', label: 'MarineMax',
    eyebrow: 'Commerce that moves', title: 'Turn inspiration into action.',
    body: 'We transformed premium boat discovery into a clearer, mobile-first path from browsing to buying.',
    tags: ['Strategy', 'UX', 'Commerce'], proof: '104% increase in product-detail-page engagement',
    source: 'https://www.verndale.com/our-work/marinemax',
    subject: 'A premium digital boat-buying system with a sculptural yacht on a rotating platform, a financing-calculator dial, mobile product-detail panels, comparison modules, and a clear golden customer path connecting discovery to action.',
    focalPoint: 'the sculptural yacht and golden customer path',
    still: 'public/assets/stills/marinemax.webp', clip: 'public/assets/video/marinemax.mp4',
    accent: '#6A2FF3', scroll: 1.5, linger: 0.35,
  },
  {
    id: 'southeast-toyota-finance', label: 'Southeast Toyota Finance',
    eyebrow: 'Personalization at scale', title: 'Make every next step personal.',
    body: "A guided digital experience responds to each customer's context, simplifying service and payment journeys.",
    tags: ['DXP', 'Personalization', 'UX'], proof: '700% increase in seven-day promises to pay',
    source: 'https://www.verndale.com/our-work/southeast-toyota-finance',
    subject: 'A refined automotive-finance cockpit with a sculptural vehicle, branching personalized journey tracks, payment milestone modules, customer-profile orbs, and a central DXP decision engine.',
    focalPoint: 'the central DXP decision engine and personalized route',
    still: 'public/assets/stills/southeast-toyota-finance.webp', clip: 'public/assets/video/southeast-toyota-finance.mp4',
    accent: '#FFB800', scroll: 1.25, linger: 0.2,
  },
  {
    id: 'iata', label: 'IATA',
    eyebrow: 'Complexity, cleared', title: 'Move complexity at global scale.',
    body: 'A rapid CMS migration unified operations, improved performance, and returned thousands of hours to the team.',
    tags: ['Optimizely', 'Migration', 'Governance'], proof: 'Approximately 5,000 hours saved',
    source: 'https://www.verndale.com/our-work/iata',
    subject: 'A global aviation content hub with a central control tower, orbiting aircraft forms, fragmented content blocks flowing into a clean unified taxonomy, governance gates, and a bright global route network.',
    focalPoint: 'the central control tower and unified content stream',
    still: 'public/assets/stills/iata.webp', clip: 'public/assets/video/iata.mp4',
    accent: '#6A2FF3', scroll: 1.25, linger: 0.2,
  },
  {
    id: 'aspen-snowmass', label: 'Aspen Snowmass',
    eyebrow: 'Digital as destination', title: 'Make planning feel like arriving.',
    body: 'An immersive, accessible experience turns trip planning into the first memorable part of the visit.',
    tags: ['Experience Design', 'Accessibility', 'DXP'], proof: '58% conversion growth',
    source: 'https://www.verndale.com/our-work/aspen-snowmass',
    subject: 'A glossy mountain-resort planning system with four stylized peaks, a cable car, lodge and trail modules, immersive media panels, accessible wayfinding, and a golden booking route moving through the landscape.',
    focalPoint: 'the cable car and golden booking route through the peaks',
    still: 'public/assets/stills/aspen-snowmass.webp', clip: 'public/assets/video/aspen-snowmass.mp4',
    accent: '#FFB800', scroll: 1.4, linger: 0.35,
  },
  {
    id: 'honda-powersports', label: 'Honda Powersports',
    eyebrow: 'Performance by design', title: 'Build for speed. Stay built to scale.',
    body: 'Platform engineering and integrations gave a global product experience the speed and stability it needed.',
    tags: ['Performance', 'Sitecore', 'Integrations'], proof: 'Average CPU usage reduced from 30% to 6%',
    source: 'https://www.verndale.com/fr/our-work/honda-powersports',
    subject: 'A high-performance product platform with a sculptural motorcycle, responsive device panels, integration conduits, product-data modules, performance gauges, and a rapid golden signal passing through the system.',
    focalPoint: 'the sculptural motorcycle and connected performance gauges',
    still: 'public/assets/stills/honda-powersports.webp', clip: 'public/assets/video/honda-powersports.mp4',
    accent: '#6A2FF3', scroll: 1.25, linger: 0.2,
  },
  {
    id: 'seaworld', label: 'SeaWorld',
    eyebrow: 'Experiences that evolve', title: 'Make every visit begin online.',
    body: 'A flexible commerce platform, analytics, and continuous optimization connect inspiration to checkout.',
    tags: ['Commerce', 'Analytics', 'Optimization'], proof: 'Checkout success improved by 13%',
    source: 'https://www.verndale.com/our-work/seaworld',
    subject: 'A polished family theme-park commerce system with a ticket portal, attraction modules, itinerary paths, checkout gates, analytics blocks, and a golden journey connecting inspiration to purchase. No people, no figures, no water features.',
    focalPoint: 'the ticket portal and connected checkout gates',
    still: 'public/assets/stills/seaworld.webp', clip: 'public/assets/video/seaworld.mp4',
    accent: '#FFB800', scroll: 1.7, linger: 0.45,
    cta: { primary: { label: "Build what's next", href: 'https://www.verndale.com/contact-us' } },
  },
];

export const CONNECTORS = Array.from({ length: CASES.length - 1 }, (_, index) =>
  `public/assets/video/connector-${index + 1}.mp4`
);

export function createWorldConfig() {
  return {
    hero: {
      eyebrow: 'Connected experiences · measurable growth',
      title: 'Experience is your growth system.',
      body: 'We connect strategy, design, technology, data, AI and marketing to create digital experiences that perform.',
      cta: { label: 'Explore the work', href: '#marinemax' },
      scroll: 0.65,
      linger: 0.3,
    },
    mobileMode: 'posters',
    hint: 'scroll to explore',
    diveScroll: 1.3,
    connScroll: 0.8,
    crossfade: 0.08,
    atmosphere: true,
    nav: false,
    sections: CASES.map(scene => ({ ...scene, still: scene.still.replace(/^public\//, ''), clip: scene.clip.replace(/^public\//, '') })),
    connectors: CONNECTORS.map(path => path.replace(/^public\//, '')),
  };
}
```

- [ ] **Step 5: Run the manifest test**

Run: `node --test tests/cases.test.js`  
Expected: 2 tests pass, 0 fail.

- [ ] **Step 6: Commit the manifest contract**

```bash
git add package.json .gitignore src/cases.js tests/cases.test.js
git commit -m "feat: define Verndale scroll-world manifest"
```

---

### Task 2: Build and Test Scroll Math

**Files:**
- Create: `src/timeline.js`
- Create: `tests/timeline.test.js`

**Interfaces:**
- Consumes: `sections`, `connectors`, `diveScroll`, `connScroll`, and `hero.scroll` from `createWorldConfig()`
- Produces: `clamp`, `smoothstep`, `lingerEase`, `buildSegments`, `heroOpacity`, `sectionCopyOpacity`, and `activeSectionIndex`

- [ ] **Step 1: Write the failing timeline tests**

```js
// tests/timeline.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildSegments, heroOpacity, sectionCopyOpacity, lingerEase, activeSectionIndex,
} from '../src/timeline.js';

const sections = [
  { scroll: 1.5, linger: 0.35 },
  { scroll: 1.25, linger: 0.2 },
  { scroll: 1.7, linger: 0.45 },
];
const connectors = ['c1.mp4', 'c2.mp4'];

test('segments begin after the hero and interleave dives with connectors', () => {
  const segments = buildSegments({ sections, connectors, diveScroll: 1.3, connScroll: 0.8, heroScroll: 0.65 });
  assert.deepEqual(segments.map(s => s.kind), ['dive', 'connector', 'dive', 'connector', 'dive']);
  assert.equal(segments[0].start, 0.65);
  assert.equal(segments[0].end, 2.15);
  assert.equal(segments.at(-1).end, 6.7);
});

test('hero and first case never compete at full opacity', () => {
  assert.equal(heroOpacity(0, 0.65), 1);
  assert.equal(heroOpacity(0.65, 0.65), 0);
  const first = { start: 0.65, end: 2.15 };
  assert.equal(sectionCopyOpacity({ index: 0, count: 3, position: 0.2, segment: first, hasHero: true }), 0);
  assert.ok(sectionCopyOpacity({ index: 0, count: 3, position: 1.1, segment: first, hasHero: true }) > 0.5);
});

test('linger remapping preserves exact endpoints and remains monotone', () => {
  assert.equal(lingerEase(0, 0.45), 0);
  assert.equal(lingerEase(1, 0.45), 1);
  const values = Array.from({ length: 21 }, (_, i) => lingerEase(i / 20, 0.45));
  assert.ok(values.every((value, i) => i === 0 || value >= values[i - 1]));
});

test('connector midpoint advances the active route to the incoming case', () => {
  const segments = buildSegments({ sections, connectors, diveScroll: 1.3, connScroll: 0.8, heroScroll: 0.65 });
  assert.equal(activeSectionIndex(segments[1].start + 0.1, segments, 3), 0);
  assert.equal(activeSectionIndex(segments[1].start + 0.7, segments, 3), 1);
});
```

- [ ] **Step 2: Verify failure**

Run: `node --test tests/timeline.test.js`  
Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `src/timeline.js`.

- [ ] **Step 3: Implement the pure timeline module**

```js
// src/timeline.js
export const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));

export function smoothstep(value) {
  const x = clamp(value);
  return x * x * (3 - 2 * x);
}

export function lingerEase(value, linger = 0) {
  const x = clamp(value);
  const amount = clamp(linger);
  const centered = x - 0.5;
  return (1 - amount) * x + amount * (4 * centered ** 3 + 0.5);
}

export function buildSegments({ sections, connectors, diveScroll, connScroll, heroScroll = 0 }) {
  const result = [];
  let cursor = heroScroll;
  sections.forEach((section, sectionIndex) => {
    const width = section.scroll ?? diveScroll;
    const dive = { kind: 'dive', sectionIndex, start: cursor, end: cursor + width, width, linger: section.linger ?? 0 };
    result.push(dive);
    cursor = dive.end;
    if (sectionIndex < sections.length - 1 && connectors[sectionIndex]) {
      const connector = { kind: 'connector', sectionIndex, start: cursor, end: cursor + connScroll, width: connScroll, linger: 0 };
      result.push(connector);
      cursor = connector.end;
    }
  });
  return result;
}

export function heroOpacity(position, heroScroll) {
  if (!heroScroll) return 0;
  return smoothstep(1 - clamp(position / heroScroll));
}

export function sectionCopyOpacity({ index, count, position, segment, hasHero }) {
  const progress = clamp((position - segment.start) / (segment.end - segment.start));
  const before = position < segment.start;
  const after = position > segment.end;
  if (index === 0 && hasHero) {
    if (before || after) return 0;
    return smoothstep(progress / 0.24) * smoothstep(1 - Math.max(0, progress - 0.72) / 0.28);
  }
  if (index === 0) return after ? 0 : smoothstep(1 - progress / 0.62);
  if (index === count - 1) return before ? 0 : smoothstep(progress / 0.4);
  return before || after ? 0 : smoothstep(1 - Math.abs(progress - 0.5) / 0.5);
}

export function activeSectionIndex(position, segments, count) {
  let current = segments[0];
  for (const segment of segments) if (position >= segment.start) current = segment;
  const raw = current.kind === 'dive'
    ? current.sectionIndex
    : current.sectionIndex + ((position - current.start) / current.width > 0.5 ? 1 : 0);
  return clamp(raw, 0, count - 1);
}
```

- [ ] **Step 4: Run the timeline tests**

Run: `node --test tests/timeline.test.js`  
Expected: 4 tests pass, 0 fail.

- [ ] **Step 5: Commit scroll math**

```bash
git add src/timeline.js tests/timeline.test.js
git commit -m "feat: add deterministic scroll timeline"
```

---

### Task 3: Build the Accessible Poster Experience

**Files:**
- Create: `index.html`
- Create: `src/poster-world.js`
- Create: `src/main.js`
- Create: `src/styles.css`
- Create: `public/assets/fallback-system.svg`
- Create: `tests/poster-world.test.js`

**Interfaces:**
- Consumes: `CASES` from `src/cases.js`
- Produces: `renderPosterHTML(cases): string` and `mountPosterWorld(container, cases): void`

- [ ] **Step 1: Write the failing fallback markup test**

```js
// tests/poster-world.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import { renderPosterHTML } from '../src/poster-world.js';
import { CASES } from '../src/cases.js';

test('poster mode renders all cases, proofs, sources, and final CTA', () => {
  const html = renderPosterHTML(CASES);
  assert.equal((html.match(/class="poster-case"/g) || []).length, 6);
  for (const scene of CASES) {
    assert.match(html, new RegExp(scene.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    assert.match(html, new RegExp(scene.proof.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    assert.match(html, new RegExp(scene.source.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
  assert.match(html, /Build what&#39;s next/);
});

test('poster mode escapes untrusted text', () => {
  const html = renderPosterHTML([{ ...CASES[0], title: '<script>alert(1)</script>' }]);
  assert.doesNotMatch(html, /<script>/);
  assert.match(html, /&lt;script&gt;/);
});
```

- [ ] **Step 2: Confirm failure**

Run: `node --test tests/poster-world.test.js`  
Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `src/poster-world.js`.

- [ ] **Step 3: Implement safe poster markup**

```js
// src/poster-world.js
const escapeHTML = value => String(value).replace(/[&<>'"]/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;',
}[char]));

export function renderPosterHTML(cases) {
  return `<div class="poster-world">
    <section class="poster-hero" aria-labelledby="poster-hero-title">
      <p class="eyebrow">Connected experiences · measurable growth</p>
      <h1 id="poster-hero-title">Experience is your growth system.</h1>
      <p>We connect strategy, design, technology, data, AI and marketing to create digital experiences that perform.</p>
    </section>
    ${cases.map((scene, index) => `<article class="poster-case" id="${escapeHTML(scene.id)}">
      <img src="${escapeHTML(scene.still.replace(/^public\//, ''))}" onerror="this.src='assets/fallback-system.svg'" alt="" />
      <div><span>${String(index + 1).padStart(2, '0')} / ${String(cases.length).padStart(2, '0')}</span>
      <p class="eyebrow">${escapeHTML(scene.eyebrow)}</p><h2>${escapeHTML(scene.title)}</h2>
      <p>${escapeHTML(scene.body)}</p><strong>${escapeHTML(scene.proof)}</strong>
      <ul>${scene.tags.map(tag => `<li>${escapeHTML(tag)}</li>`).join('')}</ul>
      <a href="${escapeHTML(scene.source)}">Read the ${escapeHTML(scene.label)} story</a>
      ${scene.cta ? `<a class="primary-cta" href="${escapeHTML(scene.cta.primary.href)}">${escapeHTML(scene.cta.primary.label)}</a>` : ''}</div>
    </article>`).join('')}
  </div>`;
}

export function mountPosterWorld(container, cases) {
  container.dataset.mode = 'posters';
  container.innerHTML = renderPosterHTML(cases);
}
```

- [ ] **Step 4: Create the semantic shell and initial poster mount**

Create `index.html` exactly as this semantic shell:

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  <meta name="description" content="Explore how Verndale connects strategy, design, technology, data, AI, and marketing to create digital experiences that perform." />
  <title>Verndale — Experience is your growth system</title>
  <link rel="stylesheet" href="src/styles.css" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;600;700&family=Titillium+Web:wght@600;700&display=swap" rel="stylesheet" />
</head>
<body>
  <header class="site-header">
    <a class="site-brand" href="https://www.verndale.com/" aria-label="Verndale home"><span aria-hidden="true"></span>VERNDALE</a>
    <nav aria-label="Primary navigation">
      <a href="https://www.verndale.com/expertise">Expertise</a>
      <a href="https://www.verndale.com/our-work/our-work-listing">Work</a>
      <a href="https://www.verndale.com/insights">Insights</a>
      <a href="https://www.verndale.com/about-us">About</a>
    </nav>
    <a class="site-contact" href="https://www.verndale.com/contact-us">Let's talk</a>
  </header>
  <main id="world"></main>
  <script type="module" src="src/main.js"></script>
</body>
</html>
```

Implement `src/main.js` initially as:

```js
import { CASES } from './cases.js';
import { mountPosterWorld } from './poster-world.js';

mountPosterWorld(document.getElementById('world'), CASES);
```

Create `public/assets/fallback-system.svg` as a 1600×900 lavender canvas containing a central purple glossy rounded cube, a yellow orbit, and the accessible `<title>Verndale connected system</title>`. Build `src/styles.css` with this baseline, then add the component selectors used by `poster-world.js` without changing the tokens:

```css
:root { --yellow:#FFB800; --purple:#6A2FF3; --lavender:#E1D5FD; --ink:#1C1C1C; --white:#FFFFFF; }
* { box-sizing:border-box; }
html { scroll-behavior:smooth; background:var(--lavender); color:var(--ink); }
body { margin:0; font-family:"Open Sans",system-ui,sans-serif; background:var(--lavender); }
h1,h2,h3 { font-family:"Titillium Web",system-ui,sans-serif; text-wrap:balance; }
a,button { outline-offset:4px; }
a:focus-visible,button:focus-visible { outline:3px solid var(--purple); }
.site-header { position:fixed; z-index:1000; inset:0 0 auto; display:grid; grid-template-columns:1fr auto 1fr; align-items:center; gap:24px; padding:20px clamp(20px,5vw,64px); }
.site-brand,.site-header nav,.site-contact { position:relative; z-index:1; }
.site-header nav { display:flex; gap:24px; }
.site-contact { justify-self:end; padding:10px 18px; border-radius:999px; background:var(--ink); color:var(--white); }
.poster-world { padding:120px clamp(20px,6vw,88px) 80px; }
.poster-hero { min-height:55vh; display:grid; align-content:center; max-width:760px; }
.poster-case { min-height:80vh; display:grid; grid-template-columns:minmax(0,1.25fr) minmax(280px,.75fr); align-items:center; gap:clamp(28px,6vw,96px); border-top:1px solid color-mix(in srgb,var(--ink) 16%,transparent); }
.poster-case img { width:100%; border-radius:28px; }
.poster-case ul { display:flex; flex-wrap:wrap; gap:8px; padding:0; list-style:none; }
.poster-case li { padding:7px 12px; border-radius:999px; background:color-mix(in srgb,var(--purple) 12%,var(--white)); }
.eyebrow { color:var(--purple); font-weight:700; letter-spacing:.12em; text-transform:uppercase; }
.primary-cta { display:inline-block; margin-top:20px; padding:13px 22px; border-radius:999px; background:var(--yellow); color:var(--ink); font-weight:700; }
@media (max-width:860px) {
  .site-header { grid-template-columns:1fr auto; } .site-header nav { display:none; }
  .poster-case { grid-template-columns:1fr; padding:60px 0; }
}
@media (prefers-reduced-motion:reduce) { html { scroll-behavior:auto; } *,*::before,*::after { animation:none!important; transition:none!important; } }
```

- [ ] **Step 5: Run unit and manual browser checks**

Run: `npm test`  
Expected: 8 tests pass, 0 fail.

Run: `npm run serve`  
Expected: server listens at `http://localhost:4173`; the browser shows six readable case sections, exact header routes, and a working final CTA without console errors.

- [ ] **Step 6: Commit the static experience**

```bash
git add index.html src/main.js src/poster-world.js src/styles.css public/assets/fallback-system.svg tests/poster-world.test.js
git commit -m "feat: add accessible Verndale poster experience"
```

---

### Task 4: Adapt the Desktop Scrub Engine

**Files:**
- Create: `src/scroll-world.js`
- Modify: `src/main.js`
- Modify: `src/styles.css`
- Create: `tests/mode.test.js`

**Interfaces:**
- Consumes: `createWorldConfig()` and timeline functions
- Produces: `getExperienceMode(media): 'film' | 'posters'` and `mountScrollWorld(container, config): ScrollWorldController`
- Controller: `{ jumpTo(index): void, getState(): { activeIndex: number, segmentIndex: number, totalScroll: number }, destroy(): void }`

- [ ] **Step 1: Write the failing mode-selection test**

```js
// tests/mode.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import { getExperienceMode } from '../src/main.js';

test('desktop receives film mode', () => {
  assert.equal(getExperienceMode({ reduced: false, coarse: false, small: false }), 'film');
});

test('phone, coarse pointer, and reduced motion receive posters', () => {
  assert.equal(getExperienceMode({ reduced: true, coarse: false, small: false }), 'posters');
  assert.equal(getExperienceMode({ reduced: false, coarse: true, small: false }), 'posters');
  assert.equal(getExperienceMode({ reduced: false, coarse: false, small: true }), 'posters');
});
```

- [ ] **Step 2: Verify the missing export failure**

Run: `node --test tests/mode.test.js`  
Expected: FAIL because `getExperienceMode` is not exported.

- [ ] **Step 3: Copy the complete reference engine and make it an ES module**

Use the full contents of `.agents/skills/scroll-world/references/scrub-engine.js` as the base for `src/scroll-world.js`. Replace its CommonJS/global footer with:

```js
export { mountScrollWorld };
```

Import the tested math at the top:

```js
import {
  clamp, smoothstep, lingerEase, buildSegments, heroOpacity,
  sectionCopyOpacity, activeSectionIndex,
} from './timeline.js';
```

- [ ] **Step 4: Add the approved hero prelude and controller contract**

Extend the reference engine with these exact behaviors:

```js
const HERO = config.hero || null;
const HERO_SCROLL = HERO?.scroll || 0;
const mathSegments = buildSegments({
  sections: SECTIONS,
  connectors: CONNECTORS,
  diveScroll: DIVE_W,
  connScroll: CONN_W,
  heroScroll: HERO_SCROLL,
});
```

Assign each DOM segment's `start`/`end` from `mathSegments` during layout. Create a `.sw-hero` article from `HERO` before the case-copy loop. While the scroll position is inside the hero band, keep the first scene's poster at opacity 1, set `.sw-hero` opacity with `heroOpacity(y / vh, HERO_SCROLL)`, and set case opacity with `sectionCopyOpacity(...)`. Add a `.sw-status` containing active `01 / 06`, a fill bar, and `Scroll to explore`; update it from `activeSectionIndex(...)`.

Declare `let currentSegmentIndex = 0` beside the reference engine's `activeIndex` state. Inside `read()`, assign `currentSegmentIndex = ci` immediately after resolving the current segment so `getState()` always reports the same segment used for opacity and active-route calculations.

For every route button, set an exact accessible label and active state:

```js
dot.type = 'button';
dot.setAttribute('aria-label', `Jump to ${s.label}`);
if (k === activeIndex) dot.setAttribute('aria-current', 'step');
else dot.removeAttribute('aria-current');
```

Return the controller and remove every registered listener in `destroy()`:

```js
return {
  jumpTo,
  getState: () => ({ activeIndex, segmentIndex: currentSegmentIndex, totalScroll: totalW }),
  destroy,
};
```

- [ ] **Step 5: Add load-failure resilience**

Keep the reference blob loader and seek coalescing. Add `img.onerror` so a failed still switches once to `assets/fallback-system.svg`. On video fetch/decode failure, add `is-media-error` to the scene, leave the still visible, and do not retry in a loop. Preserve `null` connector support.

- [ ] **Step 6: Replace the initial main module with mode-aware mounting**

```js
// src/main.js
import { CASES, createWorldConfig } from './cases.js';
import { mountPosterWorld } from './poster-world.js';
import { mountScrollWorld } from './scroll-world.js';

export function getExperienceMode({ reduced, coarse, small }) {
  return reduced || coarse || small ? 'posters' : 'film';
}

function runtimeMedia() {
  return {
    reduced: matchMedia('(prefers-reduced-motion: reduce)').matches,
    coarse: matchMedia('(hover: none) and (pointer: coarse)').matches,
    small: matchMedia('(max-width: 860px)').matches,
  };
}

if (typeof document !== 'undefined') {
  const root = document.getElementById('world');
  if (getExperienceMode(runtimeMedia()) === 'posters') mountPosterWorld(root, CASES);
  else {
    const config = createWorldConfig();
    if (location.hostname === 'localhost') {
      const params = new URLSearchParams(location.search);
      const missingConnector = Number(params.get('qaMissingConnector'));
      const missingVideo = Number(params.get('qaMissingVideo'));
      if (missingConnector >= 1 && missingConnector <= config.connectors.length) config.connectors[missingConnector - 1] = null;
      if (missingVideo >= 1 && missingVideo <= config.sections.length) config.sections[missingVideo - 1].clip = 'assets/video/intentionally-missing.mp4';
    }
    const controller = mountScrollWorld(root, config);
    if (location.hostname === 'localhost') window.__scrollWorld = controller;
  }
}
```

Guard the browser-only mount so Node can import `getExperienceMode` without a DOM.

- [ ] **Step 7: Add visual-system overrides**

In `src/styles.css`, override the engine with the approved palette and layout: fixed site header above the engine, left copy column, right-side route rail, bottom `.sw-status`, Titillium/Open Sans stacks, yellow primary CTA, purple active route, and lavender page background. Hide the empty reference `.sw-topbar`. Keep engine CSS namespaced.

- [ ] **Step 8: Run tests and inspect desktop fallbacks**

Run: `npm test`  
Expected: 10 tests pass, 0 fail.

Run the local server and inspect:

- `http://localhost:4173/` — film shell remains usable with branded fallback art while media files are absent.
- `http://localhost:4173/?qaMissingConnector=3` — direct crossfade path does not throw.
- `http://localhost:4173/?qaMissingVideo=3` — IATA retains fallback art and copy.

Expected: no console errors except the intentionally missing asset request; route jumps update active state.

- [ ] **Step 9: Commit the desktop engine**

```bash
git add src/main.js src/scroll-world.js src/styles.css tests/mode.test.js
git commit -m "feat: add desktop scroll-scrub engine"
```

---

### Task 5: Generate Exact Prompt Files

**Files:**
- Create: `render/prompts.mjs`
- Create: `scripts/write-prompts.mjs`
- Create: `tests/prompts.test.js`

**Interfaces:**
- Consumes: `CASES` from `src/cases.js`
- Produces: `STYLE_PREAMBLE`, `buildStillPrompt(scene)`, `buildDivePrompt(scene)`, `buildConnectorPrompt(from, to)`, and 17 files under `.render/prompts/`

- [ ] **Step 1: Write the failing prompt contract**

```js
// tests/prompts.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import { CASES } from '../src/cases.js';
import { STYLE_PREAMBLE, buildStillPrompt, buildDivePrompt, buildConnectorPrompt } from '../render/prompts.mjs';

test('all stills start with the byte-identical approved style', () => {
  for (const scene of CASES) assert.ok(buildStillPrompt(scene).startsWith(STYLE_PREAMBLE));
});

test('dives and connectors contain continuous-camera and no-text constraints', () => {
  for (const scene of CASES) {
    const prompt = buildDivePrompt(scene);
    assert.match(prompt, /Single continuous cinematic camera move, no cuts/);
    assert.match(prompt, /No text, no captions/);
  }
  for (let i = 0; i < CASES.length - 1; i += 1) {
    const prompt = buildConnectorPrompt(CASES[i], CASES[i + 1]);
    assert.match(prompt, /pulls up and back/);
    assert.match(prompt, /seamless flowing transition/);
  }
});

test('SeaWorld wording avoids known filter triggers', () => {
  const seaworld = buildStillPrompt(CASES.at(-1)).toLowerCase();
  for (const word of ['pool', 'waterfall', 'swim', 'wine', 'bed']) assert.doesNotMatch(seaworld, new RegExp(`\\b${word}\\b`));
  assert.match(seaworld, /no people, no figures/);
});
```

- [ ] **Step 2: Confirm failure**

Run: `node --test tests/prompts.test.js`  
Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `render/prompts.mjs`.

- [ ] **Step 3: Implement the prompt builders**

```js
// render/prompts.mjs
export const STYLE_PREAMBLE = 'Isometric glossy vinyl-toy diorama floating as a precise modular system on a plain solid #E1D5FD background with a soft contact shadow beneath it. Smooth polished plastic shading, subtle translucent acrylic details, soft studio rim light, refined collectible product-film look, gentle depth of field. Cohesive color palette of sun yellow #FFB800, electric purple #6A2FF3, lavender #E1D5FD, ink #1C1C1C, and white #FFFFFF. Premium, precise, inventive, highly detailed, centered composition, generous headroom, absolutely no text, no letters, no numbers, no logos.';

export const STYLE_TAIL = 'Glossy vinyl-toy modular system, smooth polished plastic shading, translucent acrylic details, soft studio rim light, gentle depth of field, sun yellow #FFB800, electric purple #6A2FF3, lavender #E1D5FD, ink #1C1C1C, and white #FFFFFF.';

export const buildStillPrompt = scene => `${STYLE_PREAMBLE}\nSubject: ${scene.subject}`;

export const buildDivePrompt = scene => `Single continuous cinematic camera move, no cuts. Begin high and far, looking down at the whole ${scene.label} modular system from outside like a precise collectible model. The camera slowly glides forward and descends toward ${scene.focalPoint}, flying inside the working system as upper modules gently separate to reveal the interior mechanisms. ${STYLE_TAIL} Smooth, graceful, slow motion, subtle parallax. No text, no captions.`;

export const buildConnectorPrompt = (from, to) => `Single continuous cinematic camera move, no cuts. The camera smoothly pulls up and back out of the ${from.label} modular system, rises to reveal the connected Verndale ecosystem, follows a luminous sun-yellow signal path forward, and arrives above the ${to.label} modular system, beginning to descend toward ${to.focalPoint}. One connected glossy systems world, seamless flowing transition. ${STYLE_TAIL} Smooth graceful slow motion. No text, no captions.`;
```

- [ ] **Step 4: Implement the generator**

`scripts/write-prompts.mjs` must create `.render/prompts`, write `still-<id>.txt` and `dive-<id>.txt` for all six scenes, and `connector-1.txt` through `connector-5.txt` for adjacent pairs using UTF-8. It must print `wrote 17 prompt files` and exit nonzero if the count differs.

- [ ] **Step 5: Run tests and generate prompts**

Run: `npm test && npm run prompts`  
Expected: 13 tests pass, 0 fail; final line is `wrote 17 prompt files`.

- [ ] **Step 6: Commit the prompt source**

```bash
git add render/prompts.mjs scripts/write-prompts.mjs tests/prompts.test.js
git commit -m "feat: define Verndale render prompts"
```

---

### Task 6: Build the Bash 3.2-Safe Render Pipeline

**Files:**
- Create: `scripts/render-common.sh`
- Create: `scripts/render.sh`
- Create: `scripts/verify-assets.mjs`
- Create: `tests/render-contract.test.js`

**Interfaces:**
- Consumes: `.render/prompts/*.txt`
- Produces: raw PNG/MP4/job JSON under `.render/`, encoded WebP/MP4 under `public/assets/`, and verification exit status
- CLI: `./scripts/render.sh calibrate|stills|contact-sheet|dives|frames|connectors|encode|verify`

- [ ] **Step 1: Write the failing render contract test**

```js
// tests/render-contract.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('render pipeline is Bash 3.2-safe and uses the approved Draft model', async () => {
  const common = await readFile('scripts/render-common.sh', 'utf8');
  const runner = await readFile('scripts/render.sh', 'utf8');
  assert.match(common, /^#!\/bin\/bash/);
  assert.match(runner, /^#!\/bin\/bash/);
  assert.doesNotMatch(common + runner, /declare\s+-A/);
  assert.match(common, /seedance_2_0_mini/);
  assert.match(common, /--resolution 720p/);
  assert.match(common, /--start-image/);
  assert.match(common, /--end-image/);
  assert.match(runner, /last-\$prev\.png/);
  assert.match(runner, /first-\$name\.png/);
});
```

- [ ] **Step 2: Confirm failure**

Run: `node --test tests/render-contract.test.js`  
Expected: FAIL with `ENOENT` for `scripts/render-common.sh`.

- [ ] **Step 3: Implement shared render functions**

`scripts/render-common.sh` must define these exact constants and functions:

```bash
#!/bin/bash
set -u

PROJECT_ROOT=$(cd "$(dirname "$0")/.." && pwd)
RENDER_DIR="$PROJECT_ROOT/.render"
PROMPT_DIR="$RENDER_DIR/prompts"
RAW_DIR="$RENDER_DIR/raw"
FRAME_DIR="$RENDER_DIR/frames"
JOB_DIR="$RENDER_DIR/jobs"
STILL_DIR="$PROJECT_ROOT/public/assets/stills"
VIDEO_DIR="$PROJECT_ROOT/public/assets/video"
NAMES="marinemax southeast-toyota-finance iata aspen-snowmass honda-powersports seaworld"
VMODEL="seedance_2_0_mini"
VOPTS="--mode std --resolution 720p"
DIVE_DUR=8
CONN_DUR=5

mkdir -p "$RAW_DIR" "$FRAME_DIR" "$JOB_DIR" "$STILL_DIR" "$VIDEO_DIR"

result_url() { jq -r '.[0].result_url // empty' "$1"; }

download_result() {
  json=$1
  output=$2
  url=$(result_url "$json")
  [ -n "$url" ] || return 1
  curl -fsSL "$url" -o "$output"
}

gen_still() {
  name=$1
  higgsfield generate create gpt_image_2 --prompt "$(cat "$PROMPT_DIR/still-$name.txt")" \
    --aspect_ratio 3:2 --resolution 2k --quality high --wait --wait-timeout 15m --json \
    > "$JOB_DIR/still-$name.json" 2> "$JOB_DIR/still-$name.err" && \
  download_result "$JOB_DIR/still-$name.json" "$RAW_DIR/still-$name.png"
}

gen_dive() {
  name=$1
  higgsfield generate create "$VMODEL" --prompt "$(cat "$PROMPT_DIR/dive-$name.txt")" \
    --start-image "$RAW_DIR/still-$name.png" $VOPTS --aspect_ratio 16:9 --duration "$DIVE_DUR" \
    --wait --wait-timeout 20m --json > "$JOB_DIR/dive-$name.json" 2> "$JOB_DIR/dive-$name.err" && \
  download_result "$JOB_DIR/dive-$name.json" "$RAW_DIR/dive-$name.mp4"
}

gen_connector() {
  number=$1
  from=$2
  to=$3
  higgsfield generate create "$VMODEL" --prompt "$(cat "$PROMPT_DIR/connector-$number.txt")" \
    --start-image "$FRAME_DIR/last-$from.png" --end-image "$FRAME_DIR/first-$to.png" \
    $VOPTS --aspect_ratio 16:9 --duration "$CONN_DUR" --wait --wait-timeout 20m --json \
    > "$JOB_DIR/connector-$number.json" 2> "$JOB_DIR/connector-$number.err" && \
  download_result "$JOB_DIR/connector-$number.json" "$RAW_DIR/connector-$number.mp4"
}

encode_video() {
  input=$1
  output=$2
  ffmpeg -v error -y -i "$input" -an -vf "unsharp=5:5:0.8:5:5:0.0" \
    -c:v libx264 -preset slow -crf 20 -pix_fmt yuv420p \
    -g 8 -keyint_min 8 -sc_threshold 0 -movflags +faststart "$output"
}
```

- [ ] **Step 4: Implement stage orchestration**

`scripts/render.sh` must source `render-common.sh` and implement:

- `calibrate`: generate MarineMax still, convert it to WebP, then generate the MarineMax Draft dive.
- `stills`: concurrently generate only missing still PNGs; print one success/failure line per name; convert all successful PNGs with `cwebp -quiet -q 84 -resize 1800 0`.
- `contact-sheet`: use `ffmpeg` to scale the six PNGs to 768×512 and arrange them 3×2 at `.render/contact-sheet.png`.
- `dives`: concurrently generate only missing dive MP4s, maximum six jobs.
- `frames`: extract first frame at `-ss 0` and last interior frame at `-sseof -0.15` for every dive.
- `connectors`: iterate the Bash word list in order and concurrently generate five connectors using `last-$prev.png` and `first-$name.png`.
- `encode`: encode all six dives and five connectors to their exact public paths.
- `verify`: call `node scripts/verify-assets.mjs`.

Unknown commands must print usage and exit 2. Every stage must exit nonzero if an expected output is missing.

- [ ] **Step 5: Implement public asset verification**

`scripts/verify-assets.mjs` must assert the exact six WebP and eleven MP4 filenames, run `ffprobe -v error -show_entries stream=codec_name,width,height -show_entries format=duration -of json` for each video, require H.264, require width ≥ 1280 and height ≥ 720, require duration > 4 seconds, and fail if any audio stream exists. Print `verified 6 stills and 11 videos` only when all checks pass.

- [ ] **Step 6: Validate scripts without rendering**

Run: `chmod +x scripts/render.sh scripts/render-common.sh`  
Run: `bash -n scripts/render-common.sh scripts/render.sh`  
Expected: no output, exit 0.

Run: `npm test`  
Expected: 14 tests pass, 0 fail.

- [ ] **Step 7: Commit the pipeline**

```bash
git add scripts/render-common.sh scripts/render.sh scripts/verify-assets.mjs tests/render-contract.test.js
git commit -m "feat: add frame-locked render pipeline"
```

---

### Task 7: Calibrate Trial and Credit Use

**Files:**
- Create: `docs/render-calibration.md`
- Generated: `.render/raw/still-marinemax.png`
- Generated: `public/assets/stills/marinemax.webp`
- Generated: `.render/raw/dive-marinemax.mp4`

**Interfaces:**
- Consumes: approved prompts and render scripts
- Produces: verified per-job allowance use, projected Draft-chain cost, and an explicit batch decision

- [ ] **Step 1: Confirm selected workspace and model capability**

Run:

```bash
higgsfield workspace set d90d0788-00b2-4b22-a7ef-1872334d7c65
higgsfield workspace list
higgsfield model get seedance_2_0_mini
```

Expected: Private Plus workspace selected; the model schema exposes start-image and end-image inputs.

- [ ] **Step 2: Record the before balance and generate prompts**

Run: `npm run prompts`  
Expected: `wrote 17 prompt files`.

Record the full `higgsfield workspace list` output under `Before` in `docs/render-calibration.md`.

- [ ] **Step 3: Start the calibration render detached**

Run `./scripts/render.sh calibrate` in a background/async terminal and poll its log every 30–60 seconds.  
Expected outputs: `.render/raw/still-marinemax.png`, `public/assets/stills/marinemax.webp`, and `.render/raw/dive-marinemax.mp4`.

- [ ] **Step 4: Inspect calibration quality before cost extrapolation**

Open the MarineMax still and extract/open the first, midpoint, and last dive frames. Accept only if the glossy material, centered composition, Verndale palette, readable yacht/commerce system, and slow continuous dive match the spec. Reroll at most one calibration still or dive before escalating the quality issue.

- [ ] **Step 5: Record the after balance and compute the batch projection**

Record `higgsfield workspace list` under `After`. Calculate:

```text
still_cost = before_balance - balance_after_still
dive_cost  = balance_after_still - balance_after_dive
connector_cost_estimate = dive_cost × (CONN_DUR / DIVE_DUR)
remaining_draft_cost = 5 × still_cost + 5 × dive_cost + 5 × connector_cost_estimate
headroom = remaining_draft_cost × 0.15
```

If the free trial pays a job without changing visible credits, document that fact and the trial limitation shown by Higgsfield. If the available allowance still cannot be quantified, stop and ask the user before batching.

- [ ] **Step 6: Complete and commit the calibration report**

`docs/render-calibration.md` must contain the timestamps, workspace, before/after output, job IDs, accepted/rejected quality decision, calculated full-Draft estimate, percentage of verified allowance, and `Batch authorized: yes|no` with the reason.

```bash
git add docs/render-calibration.md public/assets/stills/marinemax.webp
git commit -m "docs: record Higgsfield render calibration"
```

Stop here when `Batch authorized` is `no`.

---

### Task 8: Generate and Approve the Six Stills

**Files:**
- Create: `public/assets/stills/marinemax.webp`
- Create: `public/assets/stills/southeast-toyota-finance.webp`
- Create: `public/assets/stills/iata.webp`
- Create: `public/assets/stills/aspen-snowmass.webp`
- Create: `public/assets/stills/honda-powersports.webp`
- Create: `public/assets/stills/seaworld.webp`
- Generated: `.render/contact-sheet.png`

**Interfaces:**
- Consumes: approved still prompts and a positive calibration decision
- Produces: six cohesive, approved 1800-pixel-wide WebP posters and six solid-background source PNGs for video conditioning

- [ ] **Step 1: Run only missing still jobs detached**

Run `./scripts/render.sh stills` asynchronously and poll logs every 30–60 seconds.  
Expected: six `.render/raw/still-*.png` files and six `public/assets/stills/*.webp` files; completed MarineMax is skipped.

- [ ] **Step 2: Create and inspect the contact sheet**

Run: `./scripts/render.sh contact-sheet`  
Expected: `.render/contact-sheet.png` at 2304×1024.

Open the sheet and reject any scene that differs materially in isometric angle, material gloss, palette, studio light, system scale, lavender background, or centered framing. Verify no generated text, letters, numbers, or logos appear.

- [ ] **Step 3: Reroll only rejected scenes**

Move a rejected raw PNG and its WebP to `.render/rejected/<timestamp>/`, rerun its `gen_still <id>` function from a Bash subshell that sources `render-common.sh`, and reconvert it. Regenerate the contact sheet and repeat the review. Do not restart accepted scenes.

- [ ] **Step 4: Commit approved posters**

```bash
git add public/assets/stills
git commit -m "feat: add approved glossy client-system stills"
```

---

### Task 9: Generate Dives and Validate Handoff Frames

**Files:**
- Generated: `.render/raw/dive-*.mp4`
- Generated: `.render/frames/first-*.png`
- Generated: `.render/frames/last-*.png`

**Interfaces:**
- Consumes: six approved source still PNGs and six dive prompts
- Produces: six accepted Draft dives and twelve inspected boundary frames

- [ ] **Step 1: Generate only missing dives detached**

Run `./scripts/render.sh dives` asynchronously and poll logs every 30–60 seconds.  
Expected: six `.render/raw/dive-*.mp4` files; accepted MarineMax calibration dive is skipped.

- [ ] **Step 2: Extract boundary frames**

Run: `./scripts/render.sh frames`  
Expected: one `first-<id>.png` and one `last-<id>.png` per case.

- [ ] **Step 3: Inspect all dive boundary frames before connectors**

Open the twelve frames as two six-image groups. First frames must agree with their stills. Last frames must show the camera inside each system, remain free of text/artifacts, and offer a clean aerial pull-out origin. Reject and reroll only a dive with a broken last frame, then rerun `frames`.

- [ ] **Step 4: Record accepted dive job IDs**

Append all six accepted job IDs and any reroll reasons to `docs/render-calibration.md`. Commit only the report; raw videos stay under `.render/`.

```bash
git add docs/render-calibration.md
git commit -m "docs: record accepted Draft dives"
```

---

### Task 10: Generate Connectors, Encode, and Verify Assets

**Files:**
- Create: `public/assets/video/marinemax.mp4`
- Create: `public/assets/video/southeast-toyota-finance.mp4`
- Create: `public/assets/video/iata.mp4`
- Create: `public/assets/video/aspen-snowmass.mp4`
- Create: `public/assets/video/honda-powersports.mp4`
- Create: `public/assets/video/seaworld.mp4`
- Create: `public/assets/video/connector-1.mp4` through `connector-5.mp4`

**Interfaces:**
- Consumes: accepted dive boundary frames and five connector prompts
- Produces: complete 11-clip Draft chain with consistent H.264 scrubbing encodes

- [ ] **Step 1: Generate all five connectors detached**

Run `./scripts/render.sh connectors` asynchronously and poll logs every 30–60 seconds.  
Expected: five `.render/raw/connector-*.mp4` files, each conditioned on `last-<from>.png` and `first-<to>.png`.

- [ ] **Step 2: Extract and inspect connector endpoints**

For each connector, extract its first and last frames into `.render/qa/connector-N-first.png` and `.render/qa/connector-N-last.png`. Compare them visually with the conditioning dive frames. Reroll only the connector if either endpoint changes composition, color, or geometry enough to produce a visible pop.

- [ ] **Step 3: Encode the full chain**

Run: `./scripts/render.sh encode`  
Expected: six named dive MP4s and five numbered connector MP4s under `public/assets/video/`, H.264, 720p or greater, no audio.

- [ ] **Step 4: Run machine verification**

Run: `./scripts/render.sh verify`  
Expected: `verified 6 stills and 11 videos`.

- [ ] **Step 5: Commit encoded Draft media**

```bash
git add public/assets/video docs/render-calibration.md
git commit -m "feat: add frame-locked Draft video chain"
```

---

### Task 11: Integrate, Exercise Failure Paths, and Complete QA

**Files:**
- Modify: `src/scroll-world.js`
- Modify: `src/styles.css`
- Create: `docs/qa/verndale-scroll-world-draft.md`

**Interfaces:**
- Consumes: complete public asset chain and all earlier modules
- Produces: verified Draft landing page and evidence-backed QA report

- [ ] **Step 1: Run the complete automated suite**

Run:

```bash
npm test
npm run verify:assets
```

Expected: 14 tests pass, 0 fail; `verified 6 stills and 11 videos`.

- [ ] **Step 2: Verify desktop scroll synchronization**

Serve at `http://localhost:4173`, open a 1440×900 desktop viewport, and inspect the console. At the center of each scene band verify:

- `getState().activeIndex` matches visible copy and active route.
- The visible video's `currentTime` is greater than 0 and less than duration.
- The video's `seekable.end(0)` is greater than 0 after blob loading.
- Hero copy is gone before MarineMax copy reaches full opacity.
- SeaWorld copy and CTA remain interactive at the end.

Record each check in `docs/qa/verndale-scroll-world-draft.md`.

- [ ] **Step 3: Verify all ten seams**

Capture screenshots immediately before and after every dive→connector and connector→dive seam. Confirm no content jump is visible; a short dissolve is allowed. Record the screenshot paths and pass/fail result for all ten seams. If one seam fails, verify its conditioning frames before changing crossfade; regenerate the faulty connector when endpoints differ materially.

- [ ] **Step 4: Verify navigation and CTA behavior**

Click all six route destinations from nonadjacent positions and confirm each lands at the middle of the requested dive band with matching copy and `aria-current`. Verify all five header links and the final contact CTA point to the exact approved URLs.

- [ ] **Step 5: Exercise production fallbacks**

Open `?qaMissingConnector=3` and verify Aspen follows IATA by direct crossfade without console exceptions. Open `?qaMissingVideo=3` and verify IATA keeps its still and copy rather than showing a blank canvas. Record both results.

- [ ] **Step 6: Verify phone and reduced-motion experiences**

At a 390×844 coarse-pointer viewport, verify that no MP4 requests occur, all six posters and case links remain readable, safe-area spacing is respected, and the CTA is reachable. Emulate `prefers-reduced-motion: reduce` at desktop width and verify poster mode, no particles, no video requests, and keyboard-visible focus.

- [ ] **Step 7: Final visual and accessibility pass**

Check at 1440×900 and 1024×768: no overlap between primary header, copy, case rail, and bottom status; text contrast is readable over every scene; headings remain ordered; images with decorative visuals use empty alt text; buttons and links work from keyboard; focus is never clipped.

- [ ] **Step 8: Run final verification and commit QA fixes**

Run:

```bash
npm test
npm run verify:assets
git status --short
```

Expected: all tests and asset checks pass; only intended QA documentation or fixes are uncommitted.

```bash
git add src/scroll-world.js src/styles.css docs/qa/verndale-scroll-world-draft.md
git commit -m "test: verify Verndale Draft scroll world"
```

---

## Completion Criteria

- All six approved case systems are visible in the correct order with exact copy, tags, proof, and source links.
- Desktop scroll controls a blob-seekable chain of six dives and five frame-conditioned connectors.
- The hero prelude, case copy, route rail, status, and CTA agree at every scroll position.
- Phone/coarse-pointer and reduced-motion modes request no video and present all six cases accessibly.
- Every generated still is cohesive and every seam has documented visual QA.
- Unit tests, Bash syntax checks, public asset verification, failure-path checks, and browser QA pass.
- The Draft experience is ready for stakeholder review; Standard 1080p rendering remains a separately authorized phase.
