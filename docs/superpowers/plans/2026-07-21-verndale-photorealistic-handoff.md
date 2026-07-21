# Verndale Photorealistic Asset Handoff Plan

**Goal:** Replace the superseded glossy-toy art direction with a cohesive photorealistic cinematic world and export a self-contained Higgsfield generation pack the user can run outside this workspace.

**Approved direction:** Premium commercial-film realism. Six believable, human-scale environments share late-afternoon-to-blue-hour light, physically plausible violet practical lighting, a restrained amber signal path, real glass/metal/stone/landscape materials, subtle anamorphic bloom, volumetric atmosphere, and a wide 16:9 large-format camera language. No toy, vinyl, plastic-diorama, illustration, text, logos, watermarks, abrupt cuts, geometry morphing, or synthetic floating UI.

**Authoritative live schemas (Higgsfield CLI 1.1.19, checked 2026-07-21):**

- Stills: `gpt_image_2`; `aspect_ratio=16:9`; `resolution=2k`; `quality=high`; current quote 7 credits each.
- Dives: `seedance_2_0_mini`; `bitrate_mode=standard`; `generate_audio=false`; `resolution=720p`; `aspect_ratio=16:9`; `duration=8`; `genre=auto`; exact generated still as `start_image`; current quote 20 credits each.
- Connectors: same Mini attributes, `duration=5`, prior dive's actual last frame as `start_image`, next dive's actual first frame as `end_image`; current quote 12.5 credits each.
- Estimated base total: `6×7 + 6×20 + 5×12.5 = 224.5` credits. With 15% reroll headroom: 258.175 credits. Do not submit jobs from this task.

## Task 1: Rewrite the visual contract test-first

**Files:** `tests/prompts.test.js`, `tests/render-contract.test.js`, `render/prompts.mjs`, `src/cases.js`, `scripts/render-common.sh`, and the original design spec.

1. Add focused failing tests proving the new prompt contract: shared photorealistic cinematic preamble; real-world materials; large-format 16:9 camera language; old glossy-toy positive direction absent; no text/logos; dives preserve supplied geometry with no cuts/morphing; connectors match supplied boundary frames.
2. Add a failing render-contract assertion for 16:9 still generation.
3. Run the targeted tests and record the expected RED.
4. Rewrite the shared style preamble/tail, six case subjects, dive/connector language, and still aspect ratio minimally to pass.
5. Update the design spec so the source of truth no longer calls the direction Glossy Systems or the scenes dioramas.
6. Run targeted and full tests.

## Task 2: Export the self-contained generation pack test-first

**Files:** `tests/handoff.test.js`, `scripts/export-handoff.mjs`, `package.json`, and `asset-generation-pack/verndale-photorealistic-cinematic/**`.

1. Add a failing exporter test that requires exactly 17 UTF-8 prompt files plus a JSON manifest and README.
2. Implement an exporter that derives every prompt from `render/prompts.mjs` and every job from `src/cases.js` so the handoff cannot drift from the application.
3. The manifest must enumerate all six stills, six dives, and five connectors with model, attributes, prompt filename, conditioning inputs, and required output filename.
4. The README must give the exact generation order, UI settings, copy-paste CLI templates, frame-extraction/encoding commands, cost snapshot, quality checklist, and the exact 17 raw files to return.
5. Add `npm run handoff`, export the tracked pack, and verify tracked files match a fresh temporary export byte-for-byte.
6. Run `npm test`, `npm run prompts`, `npm run handoff`, `git diff --check`, and JSON parsing.

## Acceptance

- The glossy MarineMax calibration WebP remains explicitly temporary and is not included as approved art.
- No Higgsfield generation occurs and no credits are spent.
- A user can open the pack without reading project source, generate all 17 assets in dependency order, and return files with unambiguous names.
- All automated tests pass; asset verification is expected to remain blocked until the user returns the 17 raw assets.
