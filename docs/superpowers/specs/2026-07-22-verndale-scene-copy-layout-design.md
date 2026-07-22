# Verndale Scene Copy Layout Design

**Date:** 2026-07-22  
**Status:** Approved

## Objective

Keep the cinematic footage unobstructed during every connector transition while placing and aligning the hero and case-study text on their requested sides.

## Desktop layout map

| State | Copy side |
|---|---|
| Opening hero | Right |
| MarineMax | Right |
| Southeast Toyota Finance | Left |
| IATA | Left |
| Aspen Snowmass | Right |
| Honda Powersports | Right |
| SeaWorld | Left |

The side assignment belongs to the hero and each case in configuration rather than to CSS child order. Left and right columns use symmetrical edge spacing. The Verndale skin removes the vertical case-study route rail, eliminating its collision with right-side copy; the bottom `01 / 06 · Scroll to explore` status pill remains.

Right-side panels use right-aligned number, eyebrow, heading, body, tag row, and CTA. Left-side panels remain left-aligned. Text alignment follows `copySide`, including the opening hero.

## Copy and overlay behavior

The existing scene-copy opacity remains the source of truth for when text is readable. A single directional gradient scrim follows the same opacity value as the visible hero or case copy:

- Left-side copy uses the existing left-to-transparent gradient.
- Right-side copy uses the mirrored right-to-transparent gradient.
- When copy opacity is zero, scrim opacity is also exactly zero.
- Connector segments show neither case copy nor scrim.
- The scrim may change sides only while hidden or as the matching copy becomes visible, preventing a visible side-swap.

## Coverage-preserving media dissolve

The crossfade band keeps its current duration, location, easing, and stable segment stacking, but its opacity model changes. The current complementary values (`0.5` outgoing and `0.5` incoming at the midpoint) provide only `0.75` effective alpha coverage when composited, exposing the lavender particle background.

Within each seam band, the earlier/lower media layer stays at opacity `1` while the later/upper media layer eases from `0` to `1`. At the midpoint the layer opacities are therefore `1` and `0.5`, producing effective coverage `0.5 + 1 × (1 - 0.5) = 1`. Immediately after the band, the upper layer remains at `1` and the lower layer becomes `0`. Reverse scrolling naturally fades the upper layer back out over the still-opaque lower layer.

Outside a seam band, exactly one segment remains opaque. The change must not alter segment timing, video seeking, scroll distances, DOM stacking order, or boundary-frame selection.

## Runtime structure

The hero and each case receive a `copySide` value of `left` or `right`. The scroll-world engine applies that value to the generated copy article and uses one dedicated scrim element inside the copy layer. During each scroll read, the engine computes hero/case opacity once, applies it to the text, and gives the scrim the same effective opacity and side.

The hero uses `right`. Poster and reduced-motion rendering remain unchanged because this request concerns the desktop film presentation. The generic engine retains its route component; only the Verndale desktop skin hides it.

## Accessibility and interaction

- CTA pointer events remain enabled only when its copy is visibly active.
- DOM reading order and heading order do not change.
- Case copy, links, and destinations do not change.
- The hidden route rail is removed from layout and the accessibility tree with `display:none`.
- The bottom progress/status pill remains visible.

## Verification contract

Automated coverage must prove:

1. The six configured side values are exactly `right, left, left, right, right, left`.
2. The hero is configured on the right.
3. Connector positions produce zero case-copy opacity and therefore zero scrim opacity.
4. The engine creates a dedicated scrim, mirrors its direction for right-side copy, and does not retain the old always-on copy-layer overlay.
5. Right-side hero/case panels right-align text, tags, and CTAs; left-side panels remain left-aligned.
6. The Verndale skin hides `.sw-route` while preserving `.sw-status`.
7. Every seam keeps its lower layer at `1` while the upper layer eases from `0` to `1`; calculated composited coverage remains exactly `1` across the full band.
8. Stable media stacking order is preserved in both scroll directions.
9. Existing timeline, CTA, and fallback tests continue to pass.

Desktop browser QA must check the hero, the center of all six scene bands, at least one midpoint in every connector, and both sides plus the midpoint of every media seam. The hero and all right-side scene centers must show a right-positioned, right-aligned panel and matching scrim; left-side scenes must remain left-positioned and left-aligned. Connector midpoints must show unobstructed footage with no text or scrim. At seam midpoints the two active media opacities must be `1` and `0.5`, effective composited coverage must equal `1`, and no lavender background or particles may show through. The vertical route rail must be absent, the bottom status pill must remain visible, and the console must remain free of warnings and errors.

## Scope boundaries

This change does not alter generated stills or videos, scene order, case copy, generic route behavior, media crossfade timing, scroll distances, header layout, mobile mode, or reduced-motion poster mode. The only route change is hiding the vertical rail in the Verndale desktop skin. Media opacity math changes only inside seam bands to guarantee full composited coverage.
