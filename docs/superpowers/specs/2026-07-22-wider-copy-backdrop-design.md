# Wider Hero Backdrop Design

## Goal

Make the desktop hero's `sw-copy-backdrop` gradient extend slightly farther across the viewport so the opening copy has a broader readable area without changing any case-study backdrop.

## Design

The scroll-world engine uses one shared backdrop for both the hero and case-study copy. Mark that backdrop with a hero/scene context while choosing the currently dominant copy. Keep the existing desktop scene width at `width:min(76vw,1040px)` and add a hero-only override of `width:min(82vw,1120px)`.

Keep the existing gradient colors and stops unchanged, so this is a width adjustment rather than a change in opacity or softness. The hero remains right-aligned and mirrored by the scroll-world engine. Mobile remains unchanged at its existing full-width bottom gradient.

## Verification

Add runtime coverage that the shared backdrop reports hero context when the hero is dominant and scene context when a case study is dominant. Add a style regression requiring `min(82vw,1120px)` only for hero context while retaining `min(76vw,1040px)` for scenes. Confirm the new tests fail before implementation, then run the focused tests and full suite.

## Scope

No changes to case-study backdrop width, copy positioning, typography, video media, transitions, loading behavior, gradient stops, colors, or mobile styles.
