# Verndale Progressive Video Preloading Design

## Goal

Prevent static poster images from flashing during the desktop scroll-film experience while avoiding a full 75 MB upfront download. Add a branded initial loading state, reveal the experience once the first playable window is decoded, and continue loading the remaining chain in the background.

Video sources, encoding settings, resolution, compression, scene timing, and connector pacing remain unchanged.

## Loading Strategy

The desktop film starts behind a full-viewport Verndale loading overlay. On a normal top-of-page entry, the initial priority window is the first scene, connector 1, and scene 2. If the browser restores a deeper scroll position, the priority window shifts to the currently visible segment and its immediate neighbors so the restored view does not reveal a poster.

The priority clips load in parallel. A clip counts as playable only after its blob has downloaded, metadata is available, and its first frame has decoded. The loader reports progress by completed priority clips rather than presenting misleading byte precision.

Once the priority window is playable, the overlay dissolves and scrolling is enabled. The remaining clips enter an ordered background queue with at most two active downloads. Forward clips load first, followed by any earlier clips not already available. The existing blob-backed media model remains in place so every downloaded video remains reliably seekable.

## Readiness Guard

Progressive loading cannot assume that every visitor scrolls more slowly than the network. Before crossing into a configured video segment, the engine checks that the incoming clip is decoded and paintable.

If the visitor reaches an unready segment, the engine keeps the last decoded video frame visible and shows a small `Loading next chapter` indicator. It does not crossfade to the incoming poster. When the required clip becomes playable, the readiness guard releases and the normal frame-locked crossfade continues from the same scroll position.

The guard applies to route and header navigation as well as wheel scrolling. A navigation jump may update the requested destination immediately, but its visual handoff waits at the last playable frame until the destination window is ready. Existing connector endpoint locks and the special connector 4 → Honda transition remain authoritative and must not be weakened.

## Loader Presentation

The initial loader uses the supplied Verndale logo, a restrained light background consistent with the white header, a short `Preparing the experience` label, and a single horizontal progress bar. The loading UI stays visually quiet so the cinematic footage remains the reveal.

During initial loading, the page preserves its current scroll position but prevents wheel, touch, and keyboard scrolling. The exact pre-existing overflow state is restored when the loader exits or the scroll world is destroyed. The overlay fades out only after the priority window is playable.

The smaller chapter-loading indicator sits above the existing status control and does not obscure scene copy. It appears only when a visitor outruns the background queue.

## Failure Behavior

An unavailable or invalid video must not trap the experience behind a loader. If a priority clip fails, the loader records that clip as settled, allows the existing still image fallback for that segment, and continues. If a background clip fails, the readiness guard releases for that segment and intentionally permits its poster fallback.

The initial loader therefore waits for every priority clip to become either playable or failed, never indefinitely. Destroying the world cancels pending fetches, removes both loading interfaces, restores scrolling, revokes object URLs, and prevents late media callbacks from mutating the removed experience.

## Architecture

`loadClip` becomes an idempotent promise-returning operation. It exposes settled and playable state without starting duplicate downloads. An initial coordinator selects the priority window and waits for it to settle. A background queue reuses the same operation with a concurrency limit of two.

Media readiness remains separate from media visibility:

- `loading`: a fetch or decode operation is in progress.
- `ready`: metadata is available.
- `painted`: a decoded frame can be displayed.
- `failed`: the video is unavailable and the poster is the intentional fallback.

Pure timeline logic receives a segment-playability predicate so readiness holds can be regression-tested without network or timing dependencies. DOM code owns fetches, loader presentation, scroll locking, cancellation, and transition events.

## Verification

Automated coverage will verify:

- the initial loader remains until all priority clips settle;
- successful priority clips are decoded before reveal;
- the remaining queue preserves forward order and never exceeds two concurrent downloads;
- an unready future segment holds the last playable video instead of exposing a poster;
- a newly playable segment releases the hold and resumes normal crossfading;
- failed clips release all loaders and retain the existing poster fallback;
- destroying the world cancels pending work and restores the previous scroll-lock state;
- connector 4 → Honda and Honda → connector 5 → SeaWorld reachability remain unchanged.

Desktop browser QA will load the page with an empty cache, confirm the branded loader appears, and verify that the first scene is video-backed when the overlay clears. Network throttling and a fast scroll to later sections will confirm that the chapter indicator covers any readiness wait and that no static poster flashes. A normal-speed complete pass and a reverse/forward pass will recheck all ten seams, the final SeaWorld scene, and runtime errors.

## Scope

This change affects desktop film loading only. It does not change video files, compression, visual quality, mobile poster mode, reduced-motion behavior, copy, navigation styling, section order, scroll distances, or crossfade durations.
