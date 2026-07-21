# Verndale Scroll-World Landing Page Design

Date: 2026-07-21  
Status: Approved design; awaiting written-spec review

## 1. Objective

Create a new standalone Verndale landing page that presents the agency as a connected growth partner and proves that promise through six recognizable success stories. Scrolling drives a continuous cinematic journey through glossy modular client systems. The page must make Verndale's capabilities clear, foreground measurable outcomes, and end with a direct conversation CTA.

Primary audience: marketing, digital, commerce, and technology leaders evaluating an agency or implementation partner.

Primary CTA: **Build what's next** → <https://www.verndale.com/contact-us>  
Secondary CTA: **Explore the work** → begins the scroll journey.

## 2. Approved Creative Direction

### Brand foundation

- Display name: Verndale
- Tone: premium, precise, inventive
- Sun yellow: `#FFB800`
- Electric purple: `#6A2FF3`
- Lavender: `#E1D5FD`
- Ink: `#1C1C1C`
- White: `#FFFFFF`
- Display typography: Titillium Web
- Body typography: Open Sans

These values reflect Verndale's current public site. Yellow carries the connecting signal and primary actions; purple identifies the active system; lavender and white provide atmospheric space; ink carries copy and navigation.

### Art direction: Glossy Systems

Each client becomes a polished modular system built from smooth, collectible product-like objects. Industry-specific props make the case recognizable while a luminous yellow signal path connects every system into one Verndale ecosystem.

The following style preamble must be copied byte-for-byte into every scene-still prompt:

> Isometric glossy vinyl-toy diorama floating as a precise modular system on a plain solid #E1D5FD background with a soft contact shadow beneath it. Smooth polished plastic shading, subtle translucent acrylic details, soft studio rim light, refined collectible product-film look, gentle depth of field. Cohesive color palette of sun yellow #FFB800, electric purple #6A2FF3, lavender #E1D5FD, ink #1C1C1C, and white #FFFFFF. Premium, precise, inventive, highly detailed, centered composition, generous headroom, absolutely no text, no letters, no numbers, no logos.

## 3. Narrative and Copy

The first rendered scene doubles as the visual hero, but the hero has its own short introductory scroll band. It fades into the MarineMax case copy without adding a seventh render.

### Hero state

- Eyebrow: Connected experiences · measurable growth
- Title: Experience is your growth system.
- Body: We connect strategy, design, technology, data, AI and marketing to create digital experiences that perform.
- CTA: Explore the work

### Scene 1 — MarineMax

- Label: MarineMax
- Subject: A premium digital boat-buying system with a sculptural yacht on a rotating platform, a financing-calculator dial, mobile product-detail panels, comparison modules, and a clear golden customer path connecting discovery to action.
- Eyebrow: Commerce that moves
- Title: Turn inspiration into action.
- Body: We transformed premium boat discovery into a clearer, mobile-first path from browsing to buying.
- Tags: Strategy; UX; Commerce
- Proof: 104% increase in product-detail-page engagement
- Source: <https://www.verndale.com/our-work/marinemax>

### Scene 2 — Southeast Toyota Finance

- Label: Southeast Toyota Finance
- Subject: A refined automotive-finance cockpit with a sculptural vehicle, branching personalized journey tracks, payment milestone modules, customer-profile orbs, and a central DXP decision engine.
- Eyebrow: Personalization at scale
- Title: Make every next step personal.
- Body: A guided digital experience responds to each customer's context, simplifying service and payment journeys.
- Tags: DXP; Personalization; UX
- Proof: 700% increase in seven-day promises to pay
- Source: <https://www.verndale.com/our-work/southeast-toyota-finance>

### Scene 3 — IATA

- Label: IATA
- Subject: A global aviation content hub with a central control tower, orbiting aircraft forms, fragmented content blocks flowing into a clean unified taxonomy, governance gates, and a bright global route network.
- Eyebrow: Complexity, cleared
- Title: Move complexity at global scale.
- Body: A rapid CMS migration unified operations, improved performance, and returned thousands of hours to the team.
- Tags: Optimizely; Migration; Governance
- Proof: Approximately 5,000 hours saved
- Source: <https://www.verndale.com/our-work/iata>

### Scene 4 — Aspen Snowmass

- Label: Aspen Snowmass
- Subject: A glossy mountain-resort planning system with four stylized peaks, a cable car, lodge and trail modules, immersive media panels, accessible wayfinding, and a golden booking route moving through the landscape.
- Eyebrow: Digital as destination
- Title: Make planning feel like arriving.
- Body: An immersive, accessible experience turns trip planning into the first memorable part of the visit.
- Tags: Experience Design; Accessibility; DXP
- Proof: 58% conversion growth
- Source: <https://www.verndale.com/our-work/aspen-snowmass>

### Scene 5 — Honda Powersports

- Label: Honda Powersports
- Subject: A high-performance product platform with a sculptural motorcycle, responsive device panels, integration conduits, product-data modules, performance gauges, and a rapid golden signal passing through the system.
- Eyebrow: Performance by design
- Title: Build for speed. Stay built to scale.
- Body: Platform engineering and integrations gave a global product experience the speed and stability it needed.
- Tags: Performance; Sitecore; Integrations
- Proof: Average CPU usage reduced from 30% to 6%
- Source: <https://www.verndale.com/fr/our-work/honda-powersports>

### Scene 6 — SeaWorld

- Label: SeaWorld
- Subject: A polished family theme-park commerce system with a ticket portal, attraction modules, itinerary paths, checkout gates, analytics blocks, and a golden journey connecting inspiration to purchase. No people, no figures, no water features.
- Eyebrow: Experiences that evolve
- Title: Make every visit begin online.
- Body: A flexible commerce platform, analytics, and continuous optimization connect inspiration to checkout.
- Tags: Commerce; Analytics; Optimization
- Proof: Checkout success improved by 13%
- Source: <https://www.verndale.com/our-work/seaworld>
- CTA: Build what's next

## 4. Experience and Layout

The page is one pinned, full-viewport cinematic canvas. The rendered world fills the viewport while interface elements stay restrained and legible.

- A quiet persistent header contains the Verndale mark and these exact routes: Expertise → `/expertise`, Work → `/our-work/our-work-listing`, Insights → `/insights`, About → `/about-us`, and Let's Talk → `/contact-us`.
- Hero and case copy sit on the left in a responsive reading column.
- The rendered system occupies the center-right with enough negative space for copy.
- A six-stop route rail sits at the right edge, shows the active case, and permits direct jumps.
- A small bottom progress indicator shows the active position and reinforces the scroll instruction.
- Copy crossfades only after the incoming scene is visually established.
- The first hero state transitions into MarineMax copy over the same first scene.
- The SeaWorld finale holds long enough for the CTA to remain actionable.

Desktop pacing targets:

| Band | Scroll distance | Linger |
|---|---:|---:|
| Hero intro | 0.65 viewport | 0.30 |
| MarineMax | 1.50 viewports | 0.35 |
| Southeast Toyota Finance | 1.25 viewports | 0.20 |
| IATA | 1.25 viewports | 0.20 |
| Aspen Snowmass | 1.40 viewports | 0.35 |
| Honda Powersports | 1.25 viewports | 0.20 |
| SeaWorld | 1.70 viewports | 0.45 |
| Each connector | 0.80 viewport | n/a |

## 5. Motion Architecture

Approved architecture: **Modular Orbit**, the diorama-specific dive-and-connector chain.

- Six dive clips begin outside each glossy system, move forward and descend, and reveal its working modules.
- Five connector clips pull up to the ecosystem view, follow the yellow signal path, and descend toward the next system.
- The pull-out reversal is intentional and reads as returning to a modular system map, not rewinding a grounded walkthrough.
- Every connector uses the previous dive's actual rendered last frame as its start image and the next dive's actual rendered first frame as its end image.
- A short crossfade of approximately 0.08 seconds provides insurance without concealing mismatched frames.
- All chained clips in a render pass use the same model.

## 6. Render Plan and Budget Gate

### Phase 1: approved Draft/previz

- Still model: Higgsfield `gpt_image_2`, 3:2, 2k, high quality
- Video model: `seedance_2_0_mini`, 720p
- Desktop only: six stills, six dives, five connectors
- Base generations: 17
- Planned headroom: approximately 15% for individual rerolls
- No native 9:16 chain and no center-crop mobile version

The CLI currently reports 10 credits in the Private Plus workspace; the user also has a free-trial allowance that is not represented in that balance. Before batching:

1. Record the workspace balance.
2. Generate one representative still and one Draft dive.
3. Record the balance again and identify whether the free trial or credits paid for the jobs.
4. Extrapolate the actual full-chain cost.
5. Pause for confirmation if the projected spend exceeds 70% of the available allowance or if the allowance cannot be verified.

Phase 2, re-rendering the approved chain with Standard `seedance_2_0` at 1080p, is not automatically authorized. It requires a separate cost estimate and user approval after the Draft chain is reviewed.

## 7. Technical Architecture

The workspace is empty, so this is a new standalone implementation:

- `index.html`: semantic page shell and mount point
- `styles.css`: Verndale tokens, header, layout, responsive states, and non-video fallbacks
- `scroll-world.js`: adapted portable scrub engine and configuration
- `assets/stills/`: six approved posters
- `assets/video/`: six encoded dives and five encoded connectors
- `prompts/`: versioned still, dive, and connector prompts
- `scripts/`: Bash 3.2-safe generation, frame extraction, encoding, and QA helpers

The section configuration is the single source of truth for copy, assets, pacing, accent, proof point, tags, and CTA. It drives the pinned copy, progress indicator, route rail, poster selection, and video chain.

### Loading and playback

- Fetch clips as blobs so `currentTime` remains seekable even on hosts without byte-range support.
- Lazy-load the current clip and its nearest neighbors.
- Keep the still poster visible until the video paints its first frame.
- Coalesce seek requests to prevent a fast scroll from queuing decoder work.
- Encode desktop clips at their native Draft resolution, H.264, CRF 20, GOP 8, no audio, faststart, with light sharpening.

### Responsive and accessibility behavior

- This build is desktop-film only.
- On phone-sized or coarse-pointer viewports, do not load the desktop film; use a responsive poster-led presentation rather than claiming a cropped film is a mobile edition.
- `prefers-reduced-motion` receives an accessible static sequence of case-study posters and copy.
- Navigation, route rail, CTA, and controls remain keyboard accessible.
- Copy contrast, focus styles, landmarks, heading order, and alternative text target WCAG AA conformance.

## 8. Failure Handling

- If a clip fails to download or decode, retain its still and copy rather than showing a blank canvas.
- If a connector fails after allowed rerolls, set that connector slot to `null` and directly crossfade the adjacent scenes.
- If one still drifts from the approved style, regenerate only that still before any related video is rendered.
- If a clip's last frame does not produce a clean handoff, rerender that clip before spending on its connector.
- Treat transient 503 responses as individual rerolls, not reasons to restart the batch.
- Do not mix video models except for the documented single-clip content-filter fallback.

## 9. Verification

Before completion:

1. Inspect all six stills together for matching camera angle, materials, palette, lighting, and scale.
2. Extract and compare the frame on both sides of every dive/connector seam.
3. Capture browser screenshots immediately before and after all ten seams and check for visible pops.
4. Confirm every blob reports a seekable range greater than zero.
5. Verify that video `currentTime`, active copy, route state, and progress indicator track the same scroll band.
6. Test direct jumps from all six route-rail items.
7. Simulate missing video and missing connector assets and verify the poster/crossfade fallbacks.
8. Check the browser console for errors.
9. Verify the static reduced-motion experience.
10. Sanity-check a phone viewport for readable posters, safe spacing, and no overlap.

## 10. Out of Scope

- Native 9:16 mobile renders
- A center-cropped mobile film presented as a true mobile version
- Standard 1080p final renders before Draft approval
- CMS integration, form processing, analytics-provider setup, hosting, or deployment
- Changes to the existing production Verndale website
