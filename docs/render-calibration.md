# Higgsfield Render Calibration

- Date: 2026-07-21
- Workspace: `d90d0788-00b2-4b22-a7ef-1872334d7c65` (`Private`, Plus)
- Draft video model: `seedance_2_0_mini`, standard bitrate, 720p, audio disabled
- Decision timestamp: `2026-07-21T18:51:01Z`

## Result

The MarineMax still was generated and accepted. The calibration dive was not submitted: Higgsfield quoted 20 credits for the approved 8-second Mini render while the selected workspace showed only 1.95 visible credits remaining. The free-trial allowance is not shown separately by the CLI, so it cannot be quantified safely.

**Batch authorized: no**

Reason: the verified visible allowance cannot fund the calibration dive, the separate free-trial allowance cannot be quantified, and the projected Draft chain is far above the verified allowance. No dive, connector, or batch generation was submitted after this gate.

## Before

Captured before any render request on 2026-07-21:

```text
ID                                    NAME     PLAN  CREDITS  SELECTED
d90d0788-00b2-4b22-a7ef-1872334d7c65  Private  plus  8.95     ✓
```

The selected model capability output was:

```text
Seedance 2.0 Mini (seedance_2_0_mini, video)

PARAM             TYPE                                       DEFAULT   REQUIRED  CLI
aspect_ratio      auto,16:9,9:16,4:3,3:4,1:1,21:9            16:9
audio_references  array                                      —                   use repeated --audio-references (or --audio)
bitrate_mode      standard,high                              standard
duration          integer                                    5
end_image         object|null                                —                   use --end-image <path-or-id>
generate_audio    boolean                                    true
genre             auto,action,horror,comedy,noir,drama,epic  auto
image_references  array                                      —                   use repeated --image-references (or --image)
prompt            string                                     —         yes
resolution        480p,720p                                  720p
start_image       object|null                                —                   use --start-image <path-or-id>
video_references  array                                      —                   use repeated --video-references (or --video)

CONSTRAINTS
- at most 9 image references are allowed (counting start_image and end_image)
- at most 3 video_references are allowed
- at most 3 audio_references are allowed
- at most 12 reference files are allowed in total across images, videos, and audios (including start_image and end_image)
- audio_references require at least one image, video, start_image, or end_image
```

This confirms that Mini accepts both start and end images. Its live schema uses `bitrate_mode=standard`; it does not expose the older `mode` parameter.

`npm run prompts` completed with `wrote 17 prompt files` before generation.

## Jobs and outputs

### Failed zero-cost preflight request

- Job: `9c630ca7-0b62-48c1-8976-2ae9729e23dd`
- Created: `2026-07-21T18:47:16.165816Z`
- Status: `failed`
- Cause: sourcing `render-common.sh` under `bash -lc` made its `$0`-based project root resolve one directory too high, so an empty prompt was submitted before the command was interrupted.
- Result URL: none
- Balance after failure: unchanged at 8.95 credits

This request produced no asset and incurred no visible charge. The corrected invocation set `$0` to the project render script; preflight then verified the project root, prompt directory, and non-empty 800-byte MarineMax prompt.

### MarineMax still

- Job: `eaacec43-2701-4240-8002-a11603aad317`
- Created: `2026-07-21T18:47:55.753651Z`
- Model: `gpt_image_2`, 3:2, 2k, high quality
- Status: `completed`
- Raw output: `.render/raw/still-marinemax.png`
- Shipped poster: `public/assets/stills/marinemax.webp`

The CLI's wait request ended with HTTP 403 and wrote an empty result array, but `higgsfield generate list --json` showed the job completed with a result URL. The completed result was downloaded directly and converted to WebP.

Visual decision: **accepted**. The image has glossy vinyl/plastic materials, a centered modular composition, lavender/purple/yellow/ink/white Verndale colors, a clear hero yacht, and an understandable connected discovery/commerce system. No legible text or brand logo is present.

### MarineMax dive

- Intended model: `seedance_2_0_mini`
- Intended settings: standard bitrate, 720p, 16:9, 8 seconds, audio disabled, MarineMax still as start image
- Cost quote at `2026-07-21T18:51:01Z`: 20 credits
- Status: **not submitted**
- First/midpoint/last frame inspection: unavailable because the allowance gate prevented generation

## After still and allowance gate

```text
ID                                    NAME     PLAN  CREDITS  SELECTED
d90d0788-00b2-4b22-a7ef-1872334d7c65  Private  plus  1.95     ✓
```

The visible balance fell by exactly 7 credits, which matches the independent `higgsfield generate cost gpt_image_2 ...` quote. Other jobs appeared in the shared recent-job list during calibration, so the independent cost quote is the stronger attribution evidence. Higgsfield did not expose a separate free-trial balance or limit.

## Cost math

Verified/quoted unit costs:

```text
still_cost = 8.95 - 1.95 = 7 credits
dive_cost = quoted, not spent = 20 credits
connector_cost_estimate = 20 × (5 / 8) = 12.5 credits
```

Applying the approved post-calibration projection formula:

```text
remaining_draft_cost = 5 × 7 + 5 × 20 + 5 × 12.5
                     = 197.5 credits
headroom = 197.5 × 0.15
         = 29.625 credits
projected_remaining_with_headroom = 227.125 credits
projected_full_draft = calibration still 7 + calibration dive 20
                     + remaining 197.5 + headroom 29.625
                     = 254.125 credits
```

The projected full Draft chain is `254.125 / 8.95 = 2,839.4%` of the verified starting allowance. The remaining projection alone is `227.125 / 1.95 = 11,647.4%` of the currently visible balance. Both are far above the 70% warning threshold.

Because the dive was blocked before submission, its 20-credit value is a live CLI quote rather than a measured balance delta. Batching remains unauthorized unless the user adds a verifiable allowance or explicitly changes the scope/model after a new cost check.
