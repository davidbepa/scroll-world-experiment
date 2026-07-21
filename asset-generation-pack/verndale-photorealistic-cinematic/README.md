# Verndale Photorealistic Cinematic Asset Generation Pack

This pack is the complete, standalone production handoff for Verndale's six-scene photorealistic cinematic scroll experience. The earlier glossy miniature/toy direction is superseded. The existing glossy MarineMax WebP in the project is temporary calibration output, is not approved art, and must be replaced by the new photorealistic still.

## Direction

Create premium commercial-film realism: believable human-scale locations; real glass, metal, stone, wood, water, snow, and landscape materials; late-afternoon golden hour progressing toward blue hour; physically plausible violet practical lights; one restrained amber-gold signal path; subtle anamorphic bloom, volumetric atmosphere, natural large-format perspective, and fine film grain. Use a wide 16:9 composition. Do not introduce toy scale, molded plastic, illustration, floating UI, text, logos, watermarks, cuts, morphing, or changing geometry.

The prompt files in `prompts/` are UTF-8 and are the source text to paste unchanged. `generation-manifest.json` is the machine-readable version of every setting, dependency, filename, and quoted cost below.

## Working directory and folders

Run every command from the handoff pack root: the directory where `README.md`, `generation-manifest.json`, and `prompts/` are visible. Every `prompts/...`, `.render/raw/...`, and `.render/frames/...` path in this guide is relative to this folder. A user with only this folder has everything needed for asset generation and boundary-frame extraction.

Create the local output folders once:

```bash
mkdir -p .render/raw .render/frames .render/jobs
```

## Critical balance warning

The last observed Higgsfield workspace balance was **1.95 credits**. The complete base batch is **224.5 credits**; 15% reroll headroom is **33.675 credits**, making the planned total **258.175 credits**. **Do not batch or submit any jobs until the account has enough credits or its free-trial allowance is confirmed.** Quotes are a snapshot from 2026-07-21 and may change; check the live quote before every submission.

## Exact generation order

1. Generate all six stills in the listed order. Save the original PNG downloads under the exact paths shown.
2. Review all six stills together before generating any dives. Reject any still that breaks realism, continuity, or the quality checks below.
3. Generate all six 8-second dives, each conditioned on its exact approved still. Save the original MP4 downloads under the exact paths shown.
4. After all dives are present under this pack's `.render/raw/` folder, run the direct FFmpeg extraction loop below. It creates all 12 actual first/last boundary PNGs without any repository scripts.
5. Generate the five 5-second connectors in order, using those actual boundary frames as both start and end conditioning images. Never use an imagined or recreated boundary frame.
6. Return the 17 raw files listed at the end. Only after those files are copied back into the repository will we run the repository's `./scripts/render.sh encode` and `./scripts/render.sh verify` commands.

## Higgsfield UI attributes

### Stills (all six)

- Model: `gpt_image_2`
- Aspect ratio: `16:9`
- Resolution: `2k`
- Quality: `high`
- Conditioning image: none
- Quoted cost: 7 credits each; 42 credits total

### Dives (all six)

- Model: `seedance_2_0_mini`
- Bitrate mode: `standard`
- Generate audio: `false`
- Resolution: `720p`
- Aspect ratio: `16:9`
- Duration: `8` seconds
- Genre: `auto`
- Start image: the exact approved PNG listed for that case
- End image: none
- Quoted cost: 20 credits each; 120 credits total

### Connectors (all five)

- Model: `seedance_2_0_mini`
- Bitrate mode: `standard`
- Generate audio: `false`
- Resolution: `720p`
- Aspect ratio: `16:9`
- Duration: `5` seconds
- Genre: `auto`
- Start and end images: the actual extracted boundary frames listed for that transition
- Quoted cost: 12.5 credits each; 62.5 credits total

## Per-job production tables

Use each row's prompt file verbatim and save the downloaded raw output under the exact filename. The tables are also an unambiguous per-job recipe for the Higgsfield UI.

### 1 — Generate and review all stills

| Job | Case | Prompt | Conditioning | Save raw output as | Credits |
|---|---|---|---|---|---:|
| `still-marinemax` | marinemax | `prompts/still-marinemax.txt` | None | `.render/raw/still-marinemax.png` | 7 |
| `still-southeast-toyota-finance` | southeast-toyota-finance | `prompts/still-southeast-toyota-finance.txt` | None | `.render/raw/still-southeast-toyota-finance.png` | 7 |
| `still-iata` | iata | `prompts/still-iata.txt` | None | `.render/raw/still-iata.png` | 7 |
| `still-aspen-snowmass` | aspen-snowmass | `prompts/still-aspen-snowmass.txt` | None | `.render/raw/still-aspen-snowmass.png` | 7 |
| `still-honda-powersports` | honda-powersports | `prompts/still-honda-powersports.txt` | None | `.render/raw/still-honda-powersports.png` | 7 |
| `still-seaworld` | seaworld | `prompts/still-seaworld.txt` | None | `.render/raw/still-seaworld.png` | 7 |

Stop after these six. Compare them side by side and approve the set before spending credits on motion.

### 2 — Generate all dives

| Job | Case | Prompt | Conditioning | Save raw output as | Credits |
|---|---|---|---|---|---:|
| `dive-marinemax` | marinemax | `prompts/dive-marinemax.txt` | start_image=`.render/raw/still-marinemax.png` | `.render/raw/dive-marinemax.mp4` | 20 |
| `dive-southeast-toyota-finance` | southeast-toyota-finance | `prompts/dive-southeast-toyota-finance.txt` | start_image=`.render/raw/still-southeast-toyota-finance.png` | `.render/raw/dive-southeast-toyota-finance.mp4` | 20 |
| `dive-iata` | iata | `prompts/dive-iata.txt` | start_image=`.render/raw/still-iata.png` | `.render/raw/dive-iata.mp4` | 20 |
| `dive-aspen-snowmass` | aspen-snowmass | `prompts/dive-aspen-snowmass.txt` | start_image=`.render/raw/still-aspen-snowmass.png` | `.render/raw/dive-aspen-snowmass.mp4` | 20 |
| `dive-honda-powersports` | honda-powersports | `prompts/dive-honda-powersports.txt` | start_image=`.render/raw/still-honda-powersports.png` | `.render/raw/dive-honda-powersports.mp4` | 20 |
| `dive-seaworld` | seaworld | `prompts/dive-seaworld.txt` | start_image=`.render/raw/still-seaworld.png` | `.render/raw/dive-seaworld.mp4` | 20 |

After all six dive files are saved under this pack root, extract the 12 actual boundary frames directly with FFmpeg:

```bash
for name in marinemax southeast-toyota-finance iata aspen-snowmass honda-powersports seaworld; do
  input=".render/raw/dive-$name.mp4"
  ffmpeg -v error -y -ss 0 -i "$input" -frames:v 1 ".render/frames/first-$name.png"
  ffmpeg -v error -y -sseof -0.15 -i "$input" -frames:v 1 ".render/frames/last-$name.png"
done
```

Confirm that `.render/frames/` now contains `first-<case>.png` and `last-<case>.png` for all six cases before generating a connector.

### 3 — Generate all connectors from actual boundary frames

| Job | Transition | Prompt | Conditioning | Save raw output as | Credits |
|---|---|---|---|---|---:|
| `connector-1` | marinemax → southeast-toyota-finance | `prompts/connector-1.txt` | start_image=`.render/frames/last-marinemax.png`<br>end_image=`.render/frames/first-southeast-toyota-finance.png` | `.render/raw/connector-1.mp4` | 12.5 |
| `connector-2` | southeast-toyota-finance → iata | `prompts/connector-2.txt` | start_image=`.render/frames/last-southeast-toyota-finance.png`<br>end_image=`.render/frames/first-iata.png` | `.render/raw/connector-2.mp4` | 12.5 |
| `connector-3` | iata → aspen-snowmass | `prompts/connector-3.txt` | start_image=`.render/frames/last-iata.png`<br>end_image=`.render/frames/first-aspen-snowmass.png` | `.render/raw/connector-3.mp4` | 12.5 |
| `connector-4` | aspen-snowmass → honda-powersports | `prompts/connector-4.txt` | start_image=`.render/frames/last-aspen-snowmass.png`<br>end_image=`.render/frames/first-honda-powersports.png` | `.render/raw/connector-4.mp4` | 12.5 |
| `connector-5` | honda-powersports → seaworld | `prompts/connector-5.txt` | start_image=`.render/frames/last-honda-powersports.png`<br>end_image=`.render/frames/first-seaworld.png` | `.render/raw/connector-5.mp4` | 12.5 |

## Copy-paste CLI templates (manual, one job at a time)

These templates reflect Higgsfield CLI 1.1.19. Replace each bracketed value from the table, inspect the live quote, and submit only one job at a time. The command returns job JSON; download its `result_url` and save the binary under the table's exact output path. These are documentation templates, not an auto-executing batch script.

Still:

```bash
higgsfield generate create gpt_image_2 --prompt "$(cat [PROMPT_FILE])" --aspect_ratio 16:9 --resolution 2k --quality high --wait --wait-timeout 15m --json
```

Dive:

```bash
higgsfield generate create seedance_2_0_mini --prompt "$(cat [PROMPT_FILE])" --start-image [EXACT_STILL_PNG] --bitrate_mode standard --generate_audio false --resolution 720p --aspect_ratio 16:9 --duration 8 --genre auto --wait --wait-timeout 20m --json
```

Connector:

```bash
higgsfield generate create seedance_2_0_mini --prompt "$(cat [PROMPT_FILE])" --start-image [ACTUAL_LAST_FRAME_PNG] --end-image [ACTUAL_FIRST_FRAME_PNG] --bitrate_mode standard --generate_audio false --resolution 720p --aspect_ratio 16:9 --duration 5 --genre auto --wait --wait-timeout 20m --json
```

### Save one completed result URL under its exact filename

For a single job, redirect the CLI's completed JSON response to `.render/jobs/[JOB_ID].json`. Then use this download-only example, replacing `[JOB_ID]` and `[OUTPUT_FILE]` with that row's values. It does not submit a generation job:

```bash
result_url=$(jq -r '.[0].result_url // empty' ".render/jobs/[JOB_ID].json")
test -n "$result_url" && curl -fsSL "$result_url" -o "[OUTPUT_FILE]"
```

For example, MarineMax's still output path is `.render/raw/still-marinemax.png`. Keep each original download at its table path; do not rename or pre-encode it.

## Quality checks

Before accepting a still or clip, confirm:

- The location looks like a premium live-action commercial, not CGI, illustration, a toy, or a miniature.
- Human scale, optics, depth, reflections, wear, shadows, weather, and material response are physically believable.
- The violet accents behave like real practical lighting; the amber-gold path is subtle and integrated into architecture or paving.
- Lighting progresses coherently from golden hour to blue hour across the six-case sequence.
- The 16:9 frame preserves useful negative space for page copy and keeps the focal subject readable.
- There is no text, signage, logo, watermark, synthetic UI, or accidental brand mark. SeaWorld has no people or figures.
- Every dive starts on its exact still, uses one smooth forward descent, preserves scene geometry, and contains no cut, morph, pop-in, or disappearance.
- Every connector starts on the prior dive's actual last frame, ends on the next dive's actual first frame, and maintains one physically continuous move without a cut or geometry change.
- Videos are silent 720p 16:9 and have the requested duration. Keep the original downloaded files; do not pre-encode them.

## Return exactly these 17 raw files

Preserve the directories and filenames exactly:

- `.render/raw/still-marinemax.png`
- `.render/raw/still-southeast-toyota-finance.png`
- `.render/raw/still-iata.png`
- `.render/raw/still-aspen-snowmass.png`
- `.render/raw/still-honda-powersports.png`
- `.render/raw/still-seaworld.png`
- `.render/raw/dive-marinemax.mp4`
- `.render/raw/dive-southeast-toyota-finance.mp4`
- `.render/raw/dive-iata.mp4`
- `.render/raw/dive-aspen-snowmass.mp4`
- `.render/raw/dive-honda-powersports.mp4`
- `.render/raw/dive-seaworld.mp4`
- `.render/raw/connector-1.mp4`
- `.render/raw/connector-2.mp4`
- `.render/raw/connector-3.mp4`
- `.render/raw/connector-4.mp4`
- `.render/raw/connector-5.mp4`

Once these files are returned to the project, we will produce public WebP/H.264 assets with `./scripts/render.sh encode` and validate the complete delivery with `./scripts/render.sh verify`.
