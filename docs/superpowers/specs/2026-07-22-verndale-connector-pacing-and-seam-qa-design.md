# Verndale Connector Pacing and Seam QA Design

## Goal

Make all five connector videos feel 33% slower during desktop scroll-scrubbing, and smooth the connector 4 → Honda Powersports handoff without changing media assets or the other nine seams.

## Pacing

Increase the shared connector scroll span from `0.8` to `1.2` viewport heights. Because each connector still traverses its full video duration over that span, it advances at two-thirds of the current rate: 33% less video progress per scroll pixel.

The value remains a single world-level setting so all connectors retain a consistent rhythm. Scene-specific scroll spans do not change.

## Connector 4 Exit Crossfade

Keep the global crossfade at `0.08` viewport heights. Give the incoming Honda Powersports scene a `crossfadeIn: 0.16` override so only the connector 4 → scene 5 boundary uses twice the scroll distance: `115.2px` instead of `57.6px` at a 720px viewport. The other nine media boundaries remain at `0.08` viewport heights.

The engine converts the incoming scene override from viewport units during layout and lets the incoming segment select its own blend band. The outgoing connector remains fully opaque while scene 5 eases over it, preserving full composited coverage throughout the longer fade.

## Transition Behavior

No video is re-encoded, trimmed, retimed, or replaced. Each connector continues to begin and end on its existing source frames. The coverage-preserving blend model remains unchanged: the outgoing layer stays opaque while the incoming layer fades over it, preventing the page atmosphere from showing through.

## Verification

Automated coverage will assert the approved production connector span and run the complete existing test suite. Asset verification will confirm all six scene videos and five connectors remain available and valid.

Desktop browser QA will inspect all ten media boundaries immediately before, within, and immediately after their crossfade bands. Each seam must retain full visual coverage, use the expected adjacent layers, keep copy and overlays hidden during connectors, track scroll position without runtime errors, and show no obvious framing jump between the outgoing and incoming video. Connector 4 → scene 5 must begin blending earlier over its `0.16`-viewport band; adjacent boundaries must retain the global `0.08` band.

Connector playback will also be sampled inside a connector to confirm that its scroll span is `1.2` viewport heights and that video progress advances proportionally across that distance.

## Scope

This change is desktop-only motion pacing and seam blending. It does not alter mobile poster mode, typography, copy placement, navigation, video files, scene timing, or visual styling.
