# Verndale Full-Bleed Still Posters Design

## Goal

Make every `.sw-scene__still` poster touch both viewport edges at all desktop scroll positions while preserving the existing subtle zoom, focal positioning, video behavior, and mobile layout.

## Root Cause

The scene and stage already fill the viewport. On desktop, the runtime applies `translateX(2vw) scale(1.03)` to a waiting poster. At 1280px wide, the translation moves the poster 25.6px right while the scale adds only 19.2px of coverage per edge, leaving a measured 6.4px strip on the left. Video layers do not use this translation and remain full-bleed.

## Correction

Remove horizontal translation from the poster transform and retain only the existing scale progression. The transform remains centered through the default `transform-origin`, so the initial `scale(1.03)` extends beyond both viewport edges and the existing zoom continues as the scene progresses.

Remove the now-unused desktop `stageX` state rather than retaining dead compensation logic. Do not change `.sw-scene__video`, `object-fit: cover`, `object-position`, scene opacity, crossfade behavior, or media loading.

## Verification

Add a runtime regression test that mounts the scroll world at desktop width and asserts that poster transforms contain the expected scale without horizontal translation. Run the complete test and asset suites.

In a 1280×720 browser, inspect the poster bounding rectangle at the initial hero and representative unloaded/fallback scene positions. Each visible poster must have `left <= 0` and `right >= 1280`, with no exposed page-background strip. Verify video layers, seams, copy placement, mobile rules, and browser diagnostics remain unchanged.

## Scope

This is a poster-only layout fix. It does not alter video assets, connector pacing, scene timing, copy, navigation, crossfades, mobile composition, or visual styling beyond removing the unintended horizontal poster offset.
