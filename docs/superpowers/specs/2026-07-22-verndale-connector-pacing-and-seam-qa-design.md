# Verndale Connector Pacing and Seam QA Design

## Goal

Make all five connector videos feel 33% slower during desktop scroll-scrubbing, while preserving every existing scene duration, connector endpoint, crossfade, copy treatment, and media asset.

## Pacing

Increase the shared connector scroll span from `0.8` to `1.2` viewport heights. Because each connector still traverses its full video duration over that span, it advances at two-thirds of the current rate: 33% less video progress per scroll pixel.

The value remains a single world-level setting so all connectors retain a consistent rhythm. Scene-specific scroll spans and the `0.08`-viewport crossfade band do not change.

## Transition Behavior

No video is re-encoded, trimmed, retimed, or replaced. Each connector continues to begin and end on its existing source frames. The current coverage-preserving crossfade remains unchanged: the outgoing layer stays opaque while the incoming layer fades over it, preventing the page atmosphere from showing through.

## Verification

Automated coverage will assert the approved production connector span and run the complete existing test suite. Asset verification will confirm all six scene videos and five connectors remain available and valid.

Desktop browser QA will inspect all ten media boundaries immediately before, within, and immediately after their crossfade bands. Each seam must retain full visual coverage, use the expected adjacent layers, keep copy and overlays hidden during connectors, track scroll position without runtime errors, and show no obvious framing jump between the outgoing and incoming video.

Connector playback will also be sampled inside a connector to confirm that its scroll span is `1.2` viewport heights and that video progress advances proportionally across that distance.

## Scope

This change is desktop-only motion pacing. It does not alter mobile poster mode, typography, copy placement, navigation, video files, scene timing, or visual styling.
