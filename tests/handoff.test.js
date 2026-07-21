import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { CASES } from '../src/cases.js';
import { buildConnectorPrompt, buildDivePrompt, buildStillPrompt } from '../render/prompts.mjs';
import { writeHandoffPack } from '../scripts/export-handoff.mjs';

const trackedPack = 'asset-generation-pack/verndale-photorealistic-cinematic';

const expectedPromptNames = [
  ...CASES.flatMap(scene => [`still-${scene.id}.txt`, `dive-${scene.id}.txt`]),
  ...CASES.slice(0, -1).map((_, index) => `connector-${index + 1}.txt`),
].sort();

async function readTree(directory, prefix = '') {
  const contents = new Map();
  const entries = await readdir(directory, { withFileTypes: true });
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    const relativePath = prefix ? `${prefix}/${entry.name}` : entry.name;
    const fullPath = join(directory, entry.name);
    if (entry.isDirectory()) {
      for (const [name, bytes] of await readTree(fullPath, relativePath)) contents.set(name, bytes);
    } else {
      contents.set(relativePath, await readFile(fullPath));
    }
  }
  return contents;
}

test('handoff exporter writes exactly the standalone pack contract', async () => {
  const outputDirectory = await mkdtemp(join(tmpdir(), 'verndale-handoff-'));
  try {
    await writeHandoffPack(outputDirectory);
    assert.deepEqual((await readdir(outputDirectory)).sort(), ['README.md', 'generation-manifest.json', 'prompts']);
    assert.deepEqual((await readdir(join(outputDirectory, 'prompts'))).sort(), expectedPromptNames);

    const manifest = JSON.parse(await readFile(join(outputDirectory, 'generation-manifest.json'), 'utf8'));
    assert.equal(manifest.schemaSnapshot.date, '2026-07-21');
    assert.equal(manifest.schemaSnapshot.higgsfieldCliVersion, '1.1.19');
    assert.deepEqual(manifest.costs, {
      currency: 'credits',
      stills: 42,
      dives: 120,
      connectors: 62.5,
      baseTotal: 224.5,
      rerollHeadroomPercent: 15,
      rerollHeadroom: 33.675,
      plannedTotal: 258.175,
      observedBalance: 1.95,
    });
    assert.equal(manifest.jobs.length, 17);

    const expectedOrder = [
      ...CASES.map(scene => `still-${scene.id}`),
      ...CASES.map(scene => `dive-${scene.id}`),
      ...CASES.slice(0, -1).map((_, index) => `connector-${index + 1}`),
    ];
    assert.deepEqual(manifest.jobs.map(job => job.id), expectedOrder);

    for (const scene of CASES) {
      const still = manifest.jobs.find(job => job.id === `still-${scene.id}`);
      assert.deepEqual(still, {
        id: `still-${scene.id}`,
        type: 'still',
        case: scene.id,
        promptFile: `prompts/still-${scene.id}.txt`,
        model: 'gpt_image_2',
        attributes: { aspect_ratio: '16:9', resolution: '2k', quality: 'high' },
        conditioningInputs: {},
        outputFile: `.render/raw/still-${scene.id}.png`,
        quotedCredits: 7,
      });

      const dive = manifest.jobs.find(job => job.id === `dive-${scene.id}`);
      assert.deepEqual(dive, {
        id: `dive-${scene.id}`,
        type: 'dive',
        case: scene.id,
        promptFile: `prompts/dive-${scene.id}.txt`,
        model: 'seedance_2_0_mini',
        attributes: {
          bitrate_mode: 'standard', generate_audio: false, resolution: '720p',
          aspect_ratio: '16:9', duration: 8, genre: 'auto',
        },
        conditioningInputs: { start_image: `.render/raw/still-${scene.id}.png` },
        outputFile: `.render/raw/dive-${scene.id}.mp4`,
        quotedCredits: 20,
      });
    }

    for (let index = 0; index < CASES.length - 1; index += 1) {
      const from = CASES[index].id;
      const to = CASES[index + 1].id;
      const connector = manifest.jobs.find(job => job.id === `connector-${index + 1}`);
      assert.deepEqual(connector, {
        id: `connector-${index + 1}`,
        type: 'connector',
        from,
        to,
        promptFile: `prompts/connector-${index + 1}.txt`,
        model: 'seedance_2_0_mini',
        attributes: {
          bitrate_mode: 'standard', generate_audio: false, resolution: '720p',
          aspect_ratio: '16:9', duration: 5, genre: 'auto',
        },
        conditioningInputs: {
          start_image: `.render/frames/last-${from}.png`,
          end_image: `.render/frames/first-${to}.png`,
        },
        outputFile: `.render/raw/connector-${index + 1}.mp4`,
        quotedCredits: 12.5,
      });
    }
  } finally {
    await rm(outputDirectory, { recursive: true, force: true });
  }
});

test('handoff prompts are UTF-8 and byte-identical to the prompt builders', async () => {
  const outputDirectory = await mkdtemp(join(tmpdir(), 'verndale-handoff-prompts-'));
  try {
    await writeHandoffPack(outputDirectory);
    for (const scene of CASES) {
      assert.equal(await readFile(join(outputDirectory, 'prompts', `still-${scene.id}.txt`), 'utf8'), buildStillPrompt(scene));
      assert.equal(await readFile(join(outputDirectory, 'prompts', `dive-${scene.id}.txt`), 'utf8'), buildDivePrompt(scene));
    }
    for (let index = 0; index < CASES.length - 1; index += 1) {
      assert.equal(
        await readFile(join(outputDirectory, 'prompts', `connector-${index + 1}.txt`), 'utf8'),
        buildConnectorPrompt(CASES[index], CASES[index + 1]),
      );
    }
  } finally {
    await rm(outputDirectory, { recursive: true, force: true });
  }
});

test('tracked handoff pack is byte-identical to a fresh export', async () => {
  const outputDirectory = await mkdtemp(join(tmpdir(), 'verndale-handoff-byte-check-'));
  try {
    await writeHandoffPack(outputDirectory);
    const fresh = await readTree(outputDirectory);
    const tracked = await readTree(trackedPack);
    assert.deepEqual([...fresh.keys()], [...tracked.keys()]);
    for (const [name, bytes] of fresh) assert.deepEqual(bytes, tracked.get(name), name);
  } finally {
    await rm(outputDirectory, { recursive: true, force: true });
  }
});

test('standalone README contains the safe manual generation workflow', async () => {
  const readme = await readFile(`${trackedPack}/README.md`, 'utf8');
  assert.match(readme, /photorealistic cinematic/i);
  assert.match(readme, /run every command from the handoff pack root/i);
  assert.match(readme, /README\.md.*prompts\//is);
  assert.match(readme, /mkdir -p \.render\/raw \.render\/frames/);
  assert.match(readme, /all six stills.*review.*before.*dives/is);
  assert.match(readme, /ffmpeg[\s\S]*-ss 0[\s\S]*\.render\/frames\/first-/);
  assert.match(readme, /ffmpeg[\s\S]*-sseof -0\.15[\s\S]*\.render\/frames\/last-/);
  assert.doesNotMatch(readme, /\.\/scripts\/render\.sh frames/);
  assert.match(readme, /actual boundary frames/i);
  assert.match(readme, /\.\/scripts\/render\.sh encode/);
  assert.match(readme, /\.\/scripts\/render\.sh verify/);
  assert.match(readme, /1\.95 credits/);
  assert.match(readme, /do not batch/i);
  assert.match(readme, /superseded/i);
  assert.match(readme, /17 raw files/i);
  assert.doesNotMatch(readme, /run-all\.sh|generate-all\.sh/);
});
