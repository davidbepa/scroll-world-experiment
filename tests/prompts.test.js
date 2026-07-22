import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { CASES } from '../src/cases.js';
import { STYLE_PREAMBLE, buildStillPrompt, buildDivePrompt, buildConnectorPrompt } from '../render/prompts.mjs';

test('all stills start with the byte-identical photorealistic cinematic style', () => {
  assert.match(STYLE_PREAMBLE, /photorealistic/i);
  assert.match(STYLE_PREAMBLE, /premium commercial film/i);
  assert.match(STYLE_PREAMBLE, /human-scale/i);
  assert.match(STYLE_PREAMBLE, /large-format camera/i);
  assert.match(STYLE_PREAMBLE, /wide 16:9/i);
  assert.match(STYLE_PREAMBLE, /glass/i);
  assert.match(STYLE_PREAMBLE, /metal/i);
  assert.match(STYLE_PREAMBLE, /stone/i);
  assert.match(STYLE_PREAMBLE, /golden hour.*blue hour/i);
  assert.match(STYLE_PREAMBLE, /electric-violet practical lighting/i);
  assert.match(STYLE_PREAMBLE, /amber-gold signal path/i);
  assert.match(STYLE_PREAMBLE, /anamorphic bloom/i);
  assert.match(STYLE_PREAMBLE, /volumetric haze/i);

  for (const scene of CASES) assert.ok(buildStillPrompt(scene).startsWith(STYLE_PREAMBLE));
});

test('all prompts allow physical featured-client identity but reject synthetic branding', () => {
  const prompts = [
    ...CASES.flatMap(scene => [buildStillPrompt(scene), buildDivePrompt(scene)]),
    ...CASES.slice(0, -1).map((scene, index) => buildConnectorPrompt(scene, CASES[index + 1])),
  ];

  for (const prompt of prompts) {
    assert.doesNotMatch(prompt, /glossy systems|vinyl-toy|toy diorama|plastic diorama|collectible model/i);
    assert.match(prompt, /featured client's real identity/i);
    assert.match(prompt, /architectural signage/i);
    assert.match(prompt, /venue identity/i);
    assert.match(prompt, /product or vehicle marque/i);
    assert.match(prompt, /do not add captions/i);
    assert.match(prompt, /typographic overlays/i);
    assert.match(prompt, /synthetic labels/i);
    assert.match(prompt, /watermarks/i);
    assert.match(prompt, /unrelated logos/i);
    assert.match(prompt, /unrelated brand marks/i);
  }
});

test('dives lock the supplied still while making one continuous descent', () => {
  for (const scene of CASES) {
    const prompt = buildDivePrompt(scene);
    assert.match(prompt, /Single continuous cinematic camera move, no cuts/);
    assert.match(prompt, /exact supplied image/i);
    assert.match(prompt, /preserve.*geometry.*materials.*light/i);
    assert.match(prompt, /slow forward descent/i);
    assert.match(prompt, /no morph/i);
    assert.match(prompt, /no objects? appearing/i);
  }
});

test('connectors match exact boundary frames through one physical environment', () => {
  for (let i = 0; i < CASES.length - 1; i += 1) {
    const prompt = buildConnectorPrompt(CASES[i], CASES[i + 1]);
    assert.match(prompt, /pulls up and back/);
    assert.match(prompt, /start exactly.*prior.*last frame/i);
    assert.match(prompt, /end exactly.*next.*first frame/i);
    assert.match(prompt, /physically continuous environment/i);
    assert.match(prompt, /amber-gold signal path/i);
    assert.match(prompt, /no morph/i);
  }
});

test('case subjects describe recognizable real-world environments', () => {
  const subjects = Object.fromEntries(CASES.map(scene => [scene.id, scene.subject.toLowerCase()]));
  assert.match(subjects.marinemax, /real marina.*yacht.*commerce pavilion/);
  assert.match(
    subjects['southeast-toyota-finance'],
    /southeast toyota finance.*toyota vehicle.*client identity/,
  );
  assert.match(subjects.iata, /iata international airport.*client identity/);
  assert.match(subjects['aspen-snowmass'], /real aspen alpine resort/);
  assert.match(
    subjects['honda-powersports'],
    /honda powersports.*honda motorcycle.*client identity/,
  );
  assert.match(subjects.seaworld, /theme-park arrival.*commerce environment/);
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
