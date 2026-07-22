# Verndale Connector Pacing and Seam QA Design

## Goal

Make all five connector videos feel 33% slower during desktop scroll-scrubbing, and smooth the connector 4 → Honda Powersports handoff without changing media assets or the other nine seams.

## Pacing

Increase the shared connector scroll span from `0.8` to `1.2` viewport heights. Because each connector still traverses its full video duration over that span, it advances at two-thirds of the current rate: 33% less video progress per scroll pixel.

The value remains a single world-level setting so all connectors retain a consistent rhythm. Scene-specific scroll spans do not change.

## Connector 4 Exit Crossfade

Keep the global crossfade at `0.08` viewport heights. Give the incoming Honda Powersports scene `crossfadeIn: 0.16` and `crossfadeAfter: true` so only the connector 4 → scene 5 boundary uses a `115.2px` post-boundary fade at a 720px viewport. The other nine media boundaries retain their centered `0.08`-viewport bands.

The engine converts the incoming scene override from viewport units during layout and lets the incoming segment select its own blend alignment. During the final `0.16` viewport heights before the boundary, connector 4 bypasses temporal scrub easing and tracks the requested scroll frame directly. At and after the boundary, scene 5 opacity is gated on the connector's decoded final frame and the scene's decoded first frame rather than on scroll targets alone.

Scene 5 holds video frame zero for the full post-boundary fade. Its camera movement and copy begin only after `11.01vh`, when the dissolve has completed. A short `160ms` opacity interpolation prevents a fast wheel gesture from releasing the decoded-frame gate as a one-frame partial dissolve; connector 4 remains fully opaque underneath until that visual interpolation finishes. In reverse, connector 4 stays on its endpoint until scene 5 is fully hidden, then resumes reverse scrubbing.

## Transition Behavior

No video is re-encoded, trimmed, retimed, or replaced. Each connector continues to begin and end on its existing source frames. The coverage-preserving blend model remains unchanged: the outgoing layer stays opaque while the incoming layer fades over it, preventing the page atmosphere from showing through.

## Verification

Automated coverage will assert the approved production connector span and run the complete existing test suite. Asset verification will confirm all six scene videos and five connectors remain available and valid.

Desktop browser QA will inspect all ten media boundaries immediately before, within, and immediately after their crossfade bands. Each seam must retain full visual coverage, use the expected adjacent layers, keep copy and overlays hidden during connectors, track scroll position without runtime errors, and show no obvious framing jump between the outgoing and incoming video. Connector 4 → scene 5 must show connector 4 alone until its decoded endpoint is ready, fade only Honda frame zero through `11.01vh`, and keep its copy/backdrop at zero opacity during that dissolve; adjacent boundaries retain the global centered `0.08` band.

Connector playback will also be sampled inside a connector to confirm that its scroll span is `1.2` viewport heights and that video progress advances proportionally across that distance.

## Scope

This change is desktop-only motion pacing and seam blending. It does not alter mobile poster mode, typography, copy placement, navigation, video files, or the other scene timings. Scene 5 intentionally defers its video and copy start until its post-boundary dissolve completes.
