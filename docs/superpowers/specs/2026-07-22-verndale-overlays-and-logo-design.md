# Verndale Overlays and Logo Design

## Goal

Make the scene copy backdrop read as an intentional directional gradient, change the desktop header wash from lavender to white, and replace the generated header mark/text with the supplied official Verndale SVG wordmark.

## Scene Copy Gradient

Keep the single `.sw-copy-backdrop` layer and its existing left/right direction switching. Replace the nearly solid lavender wash with a visibly progressive lavender-to-transparent gradient:

```css
linear-gradient(
  90deg,
  color-mix(in srgb, var(--lavender) 96%, transparent) 0%,
  color-mix(in srgb, var(--lavender) 80%, transparent) 28%,
  color-mix(in srgb, var(--lavender) 38%, transparent) 56%,
  transparent 78%
)
```

The backdrop still flips horizontally when copy is on the right. Its size, opacity animation, copy timing, and connector clearing remain unchanged. Mobile keeps the engine’s existing bottom-up gradient.

## Header Gradient

Use an independent white-to-transparent vertical gradient on the desktop `.site-header`:

```css
linear-gradient(
  180deg,
  color-mix(in srgb, var(--white) 96%, transparent) 0%,
  color-mix(in srgb, var(--white) 76%, transparent) 55%,
  transparent 100%
)
```

The header gradient must contain no lavender or purple color source. Header layout, navigation, contact CTA, positioning, and focus treatments remain unchanged.

## Official Logo

Copy the supplied `/Users/david.bergmann/Desktop/logo.svg` into the project at `public/assets/brand/verndale-logo.svg`; do not modify the source file. The SVG is a 390.35×81.36 Verndale wordmark with a yellow brand accent and dark wordmark paths.

Replace the generated colored square and text inside `.site-brand` with an image referencing the project asset. Keep the existing home URL and `aria-label="Verndale home"`; use an empty image alt because the link already has an accessible name.

Render the logo with intrinsic proportions at `width: clamp(142px, 12.5vw, 180px)` and `height: auto`. Remove the obsolete `.site-brand span` styling.

## Verification

Add stylesheet tests that lock the four-stop lavender scene gradient, the three-stop white header gradient, and the absence of lavender/purple in the desktop header rule. Add markup/asset assertions for the official logo path, accessible link, and removal of the generated mark.

Run the complete test and asset suites. In a 1280×720 browser, inspect left- and right-aligned copy scenes, the initial header, logo proportions, link accessibility, connector overlay clearing, and current-origin console diagnostics.

## Scope

Do not change videos, stills, copy, connector pacing, scroll timing, seams, buttons, navigation destinations, mobile poster mode, or the supplied SVG artwork.
