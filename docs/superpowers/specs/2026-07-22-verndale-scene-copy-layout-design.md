# Verndale Scene Copy Layout Design

**Date:** 2026-07-22  
**Status:** Approved

## Objective

Keep the cinematic footage unobstructed during every connector transition while placing each case-study text block on the requested side of its scene. The opening hero remains on the left.

## Desktop layout map

| State | Copy side |
|---|---|
| Opening hero | Left |
| MarineMax | Right |
| Southeast Toyota Finance | Left |
| IATA | Left |
| Aspen Snowmass | Right |
| Honda Powersports | Right |
| SeaWorld | Left |

The side assignment belongs to each case in the section configuration rather than to CSS child order. Right-side copy uses a safe inset that clears the case-study route rail.

## Copy and overlay behavior

The existing scene-copy opacity remains the source of truth for when text is readable. A single directional gradient scrim follows the same opacity value as the visible hero or case copy:

- Left-side copy uses the existing left-to-transparent gradient.
- Right-side copy uses the mirrored right-to-transparent gradient.
- When copy opacity is zero, scrim opacity is also exactly zero.
- Connector segments show neither case copy nor scrim.
- The scrim may change sides only while hidden or as the matching copy becomes visible, preventing a visible side-swap.

The media-layer dissolve remains unchanged. Removing the persistent scrim must expose more of the footage during transitions without altering video timing, seeking, stacking, or crossfade weights.

## Runtime structure

Each case receives a `copySide` value of `left` or `right`. The scroll-world engine applies that value to the generated copy article and uses one dedicated scrim element inside the copy layer. During each scroll read, the engine computes hero/case opacity once, applies it to the text, and gives the scrim the same effective opacity and side.

The hero continues to use `left`. Poster and reduced-motion rendering remain unchanged because this request concerns the desktop film presentation.

## Accessibility and interaction

- CTA pointer events remain enabled only when its copy is visibly active.
- DOM reading order and heading order do not change.
- Case labels, copy, links, routes, and destinations do not change.
- The route rail remains operable and visually clear beside right-side copy.

## Verification contract

Automated coverage must prove:

1. The six configured side values are exactly `right, left, left, right, right, left`.
2. The hero remains left-aligned.
3. Connector positions produce zero case-copy opacity and therefore zero scrim opacity.
4. The engine creates a dedicated scrim, mirrors its direction for right-side copy, and does not retain the old always-on copy-layer overlay.
5. Existing timeline, media dissolve, CTA, and fallback tests continue to pass.

Desktop browser QA must check the center of all six scene bands and at least one midpoint in every connector. Scene centers must show copy and matching directional scrim; connector midpoints must show unobstructed footage with no text or scrim. The console must remain free of warnings and errors.

## Scope boundaries

This change does not alter generated stills or videos, scene order, case copy, route behavior, media crossfade timing, scroll distances, header layout, mobile mode, or reduced-motion poster mode.
