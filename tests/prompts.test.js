import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { CASES } from '../src/cases.js';
import { STYLE_PREAMBLE, buildStillPrompt, buildDivePrompt, buildConnectorPrompt } from '../render/prompts.mjs';

test('all stills start with the byte-identical approved style', () => {
  for (const scene of CASES) assert.ok(buildStillPrompt(scene).startsWith(STYLE_PREAMBLE));
});

test('dives and connectors contain continuous-camera and no-text constraints', () => {
  for (const scene of CASES) {
    const prompt = buildDivePrompt(scene);
    assert.match(prompt, /Single continuous cinematic camera move, no cuts/);
    assert.match(prompt, /No text, no captions/);
    assert.match(prompt, /No logos/);
  }
  for (let i = 0; i < CASES.length - 1; i += 1) {
    const prompt = buildConnectorPrompt(CASES[i], CASES[i + 1]);
    assert.match(prompt, /pulls up and back/);
    assert.match(prompt, /seamless flowing transition/);
    assert.match(prompt, /No logos/);
  }
});

test('SeaWorld wording avoids known filter triggers', () => {
  const seaworld = buildStillPrompt(CASES.at(-1)).toLowerCase();
  for (const word of ['pool', 'waterfall', 'swim', 'wine', 'bed']) assert.doesNotMatch(seaworld, new RegExp(`\\b${word}\\b`));
  assert.match(seaworld, /no people, no figures/);
});

test('writer replaces stale prompt files with the exact required filename set', async () => {
  const outputDirectory = await mkdtemp(join(tmpdir(), 'verndale-prompts-'));
  const expectedNames = [
    ...CASES.flatMap(scene => [`still-${scene.id}.txt`, `dive-${scene.id}.txt`]),
    ...CASES.slice(0, -1).map((_, index) => `connector-${index + 1}.txt`),
  ].sort();

  try {
    await writeFile(join(outputDirectory, 'stale-prompt.txt'), 'stale', 'utf8');
    const { writePromptFiles } = await import('../scripts/write-prompts.mjs');
    await writePromptFiles(outputDirectory);

    assert.deepEqual((await readdir(outputDirectory)).sort(), expectedNames);
  } finally {
    await rm(outputDirectory, { recursive: true, force: true });
  }
});
