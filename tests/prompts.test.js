import test from 'node:test';
import assert from 'node:assert/strict';
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
  }
  for (let i = 0; i < CASES.length - 1; i += 1) {
    const prompt = buildConnectorPrompt(CASES[i], CASES[i + 1]);
    assert.match(prompt, /pulls up and back/);
    assert.match(prompt, /seamless flowing transition/);
  }
});

test('SeaWorld wording avoids known filter triggers', () => {
  const seaworld = buildStillPrompt(CASES.at(-1)).toLowerCase();
  for (const word of ['pool', 'waterfall', 'swim', 'wine', 'bed']) assert.doesNotMatch(seaworld, new RegExp(`\\b${word}\\b`));
  assert.match(seaworld, /no people, no figures/);
});
