import { mkdir, readdir, rename, unlink, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CASES } from '../src/cases.js';
import { buildConnectorPrompt, buildDivePrompt, buildStillPrompt } from '../render/prompts.mjs';

const PACK_NAME = 'Verndale Photorealistic Cinematic Asset Generation Pack';

const promptFiles = [
  ...CASES.flatMap(scene => [
    [`still-${scene.id}.txt`, buildStillPrompt(scene)],
    [`dive-${scene.id}.txt`, buildDivePrompt(scene)],
  ]),
  ...CASES.slice(0, -1).map((scene, index) => [
    `connector-${index + 1}.txt`,
    buildConnectorPrompt(scene, CASES[index + 1]),
  ]),
];

const stillJobs = CASES.map(scene => ({
  id: `still-${scene.id}`,
  type: 'still',
  case: scene.id,
  promptFile: `prompts/still-${scene.id}.txt`,
  model: 'gpt_image_2',
  attributes: { aspect_ratio: '16:9', resolution: '2k', quality: 'high' },
  conditioningInputs: {},
  outputFile: `.render/raw/still-${scene.id}.png`,
  quotedCredits: 7,
}));

const diveJobs = CASES.map(scene => ({
  id: `dive-${scene.id}`,
  type: 'dive',
  case: scene.id,
  promptFile: `prompts/dive-${scene.id}.txt`,
  model: 'seedance_2_0_mini',
  attributes: {
    bitrate_mode: 'standard',
    generate_audio: false,
    resolution: '720p',
    aspect_ratio: '16:9',
    duration: 8,
    genre: 'auto',
  },
  conditioningInputs: { start_image: `.render/raw/still-${scene.id}.png` },
  outputFile: `.render/raw/dive-${scene.id}.mp4`,
  quotedCredits: 20,
}));

const connectorJobs = CASES.slice(0, -1).map((scene, index) => {
  const next = CASES[index + 1];
  return {
    id: `connector-${index + 1}`,
    type: 'connector',
    from: scene.id,
    to: next.id,
    promptFile: `prompts/connector-${index + 1}.txt`,
    model: 'seedance_2_0_mini',
    attributes: {
      bitrate_mode: 'standard',
      generate_audio: false,
      resolution: '720p',
      aspect_ratio: '16:9',
      duration: 5,
      genre: 'auto',
    },
    conditioningInputs: {
      start_image: `.render/frames/last-${scene.id}.png`,
      end_image: `.render/frames/first-${next.id}.png`,
    },
    outputFile: `.render/raw/connector-${index + 1}.mp4`,
    quotedCredits: 12.5,
  };
});

const jobs = [...stillJobs, ...diveJobs, ...connectorJobs];

const manifest = {
  name: PACK_NAME,
  schemaSnapshot: { date: '2026-07-21', higgsfieldCliVersion: '1.1.19' },
  direction: 'Photorealistic premium commercial-film realism across six connected, human-scale environments.',
  costs: {
    currency: 'credits',
    stills: 42,
    dives: 120,
    connectors: 62.5,
    baseTotal: 224.5,
    rerollHeadroomPercent: 15,
    rerollHeadroom: 33.675,
    plannedTotal: 258.175,
    observedBalance: 1.95,
  },
  jobs,
};

function tableRows(selectedJobs) {
  return selectedJobs.map(job => {
    const identity = job.type === 'connector' ? `${job.from} → ${job.to}` : job.case;
    const conditioning = Object.entries(job.conditioningInputs)
      .map(([key, value]) => `${key}=\`${value}\``)
      .join('<br>') || 'None';
    return `| \`${job.id}\` | ${identity} | \`${job.promptFile}\` | ${conditioning} | \`${job.outputFile}\` | ${job.quotedCredits} |`;
  }).join('\n');
}

function returnFileList() {
  return jobs.map(job => `- \`${job.outputFile}\``).join('\n');
}

function readmeText() {
  return `# ${PACK_NAME}

This pack is the complete, standalone production handoff for Verndale's six-scene photorealistic cinematic scroll experience. The earlier glossy miniature/toy direction is superseded. The existing glossy MarineMax WebP in the project is temporary calibration output, is not approved art, and must be replaced by the new photorealistic still.

## Direction

Create premium commercial-film realism: believable human-scale locations; real glass, metal, stone, wood, water, snow, and landscape materials; late-afternoon golden hour progressing toward blue hour; physically plausible violet practical lights; one restrained amber-gold signal path; subtle anamorphic bloom, volumetric atmosphere, natural large-format perspective, and fine film grain. Use a wide 16:9 composition. Do not introduce toy scale, molded plastic, illustration, floating UI, text, logos, watermarks, cuts, morphing, or changing geometry.

The prompt files in \`prompts/\` are UTF-8 and are the source text to paste unchanged. \`generation-manifest.json\` is the machine-readable version of every setting, dependency, filename, and quoted cost below.

## Working directory and folders

Run every command from the handoff pack root: the directory where \`README.md\`, \`generation-manifest.json\`, and \`prompts/\` are visible. Every \`prompts/...\`, \`.render/raw/...\`, and \`.render/frames/...\` path in this guide is relative to this folder. A user with only this folder has everything needed for asset generation and boundary-frame extraction.

Create the local output folders once:

\`\`\`bash
mkdir -p .render/raw .render/frames .render/jobs
\`\`\`

## Critical balance warning

The last observed Higgsfield workspace balance was **1.95 credits**. The complete base batch is **224.5 credits**; 15% reroll headroom is **33.675 credits**, making the planned total **258.175 credits**. **Do not batch or submit any jobs until the account has enough credits or its free-trial allowance is confirmed.** Quotes are a snapshot from 2026-07-21 and may change; check the live quote before every submission.

## Exact generation order

1. Generate all six stills in the listed order. Save the original PNG downloads under the exact paths shown.
2. Review all six stills together before generating any dives. Reject any still that breaks realism, continuity, or the quality checks below.
3. Generate all six 8-second dives, each conditioned on its exact approved still. Save the original MP4 downloads under the exact paths shown.
4. After all dives are present under this pack's \`.render/raw/\` folder, run the direct FFmpeg extraction loop below. It creates all 12 actual first/last boundary PNGs without any repository scripts.
5. Generate the five 5-second connectors in order, using those actual boundary frames as both start and end conditioning images. Never use an imagined or recreated boundary frame.
6. Return the 17 raw files listed at the end. Only after those files are copied back into the repository will we run the repository's \`./scripts/render.sh encode\` and \`./scripts/render.sh verify\` commands.

## Higgsfield UI attributes

### Stills (all six)

- Model: \`gpt_image_2\`
- Aspect ratio: \`16:9\`
- Resolution: \`2k\`
- Quality: \`high\`
- Conditioning image: none
- Quoted cost: 7 credits each; 42 credits total

### Dives (all six)

- Model: \`seedance_2_0_mini\`
- Bitrate mode: \`standard\`
- Generate audio: \`false\`
- Resolution: \`720p\`
- Aspect ratio: \`16:9\`
- Duration: \`8\` seconds
- Genre: \`auto\`
- Start image: the exact approved PNG listed for that case
- End image: none
- Quoted cost: 20 credits each; 120 credits total

### Connectors (all five)

- Model: \`seedance_2_0_mini\`
- Bitrate mode: \`standard\`
- Generate audio: \`false\`
- Resolution: \`720p\`
- Aspect ratio: \`16:9\`
- Duration: \`5\` seconds
- Genre: \`auto\`
- Start and end images: the actual extracted boundary frames listed for that transition
- Quoted cost: 12.5 credits each; 62.5 credits total

## Per-job production tables

Use each row's prompt file verbatim and save the downloaded raw output under the exact filename. The tables are also an unambiguous per-job recipe for the Higgsfield UI.

### 1 — Generate and review all stills

| Job | Case | Prompt | Conditioning | Save raw output as | Credits |
|---|---|---|---|---|---:|
${tableRows(stillJobs)}

Stop after these six. Compare them side by side and approve the set before spending credits on motion.

### 2 — Generate all dives

| Job | Case | Prompt | Conditioning | Save raw output as | Credits |
|---|---|---|---|---|---:|
${tableRows(diveJobs)}

After all six dive files are saved under this pack root, extract the 12 actual boundary frames directly with FFmpeg:

\`\`\`bash
for name in marinemax southeast-toyota-finance iata aspen-snowmass honda-powersports seaworld; do
  input=".render/raw/dive-$name.mp4"
  ffmpeg -v error -y -ss 0 -i "$input" -frames:v 1 ".render/frames/first-$name.png"
  ffmpeg -v error -y -sseof -0.15 -i "$input" -frames:v 1 ".render/frames/last-$name.png"
done
\`\`\`

Confirm that \`.render/frames/\` now contains \`first-<case>.png\` and \`last-<case>.png\` for all six cases before generating a connector.

### 3 — Generate all connectors from actual boundary frames

| Job | Transition | Prompt | Conditioning | Save raw output as | Credits |
|---|---|---|---|---|---:|
${tableRows(connectorJobs)}

## Copy-paste CLI templates (manual, one job at a time)

These templates reflect Higgsfield CLI 1.1.19. Replace each bracketed value from the table, inspect the live quote, and submit only one job at a time. The command returns job JSON; download its \`result_url\` and save the binary under the table's exact output path. These are documentation templates, not an auto-executing batch script.

Still:

\`\`\`bash
higgsfield generate create gpt_image_2 --prompt "$(cat [PROMPT_FILE])" --aspect_ratio 16:9 --resolution 2k --quality high --wait --wait-timeout 15m --json
\`\`\`

Dive:

\`\`\`bash
higgsfield generate create seedance_2_0_mini --prompt "$(cat [PROMPT_FILE])" --start-image [EXACT_STILL_PNG] --bitrate_mode standard --generate_audio false --resolution 720p --aspect_ratio 16:9 --duration 8 --genre auto --wait --wait-timeout 20m --json
\`\`\`

Connector:

\`\`\`bash
higgsfield generate create seedance_2_0_mini --prompt "$(cat [PROMPT_FILE])" --start-image [ACTUAL_LAST_FRAME_PNG] --end-image [ACTUAL_FIRST_FRAME_PNG] --bitrate_mode standard --generate_audio false --resolution 720p --aspect_ratio 16:9 --duration 5 --genre auto --wait --wait-timeout 20m --json
\`\`\`

### Save one completed result URL under its exact filename

For a single job, redirect the CLI's completed JSON response to \`.render/jobs/[JOB_ID].json\`. Then use this download-only example, replacing \`[JOB_ID]\` and \`[OUTPUT_FILE]\` with that row's values. It does not submit a generation job:

\`\`\`bash
result_url=$(jq -r '.[0].result_url // empty' ".render/jobs/[JOB_ID].json")
test -n "$result_url" && curl -fsSL "$result_url" -o "[OUTPUT_FILE]"
\`\`\`

For example, MarineMax's still output path is \`.render/raw/still-marinemax.png\`. Keep each original download at its table path; do not rename or pre-encode it.

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

${returnFileList()}

Once these files are returned to the project, we will produce public WebP/H.264 assets with \`./scripts/render.sh encode\` and validate the complete delivery with \`./scripts/render.sh verify\`.
`;
}

async function atomicWrite(filename, contents) {
  await mkdir(dirname(filename), { recursive: true });
  const temporary = `${filename}.handoff-tmp`;
  await writeFile(temporary, contents);
  await rename(temporary, filename);
}

export async function writeHandoffPack(outputDirectory) {
  const root = outputDirectory instanceof URL ? fileURLToPath(outputDirectory) : resolve(outputDirectory);
  const promptsDirectory = join(root, 'prompts');
  await mkdir(promptsDirectory, { recursive: true });

  const promptEntries = await readdir(promptsDirectory, { withFileTypes: true });
  await Promise.all(promptEntries
    .filter(entry => entry.isFile() && entry.name.endsWith('.txt'))
    .map(entry => unlink(join(promptsDirectory, entry.name))));

  await Promise.all(promptFiles.map(([name, prompt]) => atomicWrite(join(promptsDirectory, name), prompt)));
  await atomicWrite(join(root, 'generation-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  await atomicWrite(join(root, 'README.md'), readmeText());

  const actualPrompts = (await readdir(promptsDirectory, { withFileTypes: true }))
    .filter(entry => entry.isFile() && entry.name.endsWith('.txt'))
    .map(entry => entry.name)
    .sort();
  const expectedPrompts = promptFiles.map(([name]) => name).sort();
  if (actualPrompts.length !== 17 || actualPrompts.join('\n') !== expectedPrompts.join('\n')) {
    throw new Error(`expected exactly 17 prompt files, got ${actualPrompts.length}`);
  }
}

const defaultOutputDirectory = new URL('../asset-generation-pack/verndale-photorealistic-cinematic/', import.meta.url);

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await writeHandoffPack(defaultOutputDirectory);
  console.log('wrote Verndale photorealistic cinematic handoff: 17 prompts, manifest, README');
}
