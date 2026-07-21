import { mkdir, writeFile } from 'node:fs/promises';
import { CASES } from '../src/cases.js';
import { buildConnectorPrompt, buildDivePrompt, buildStillPrompt } from '../render/prompts.mjs';

const outputDirectory = new URL('../.render/prompts/', import.meta.url);
const files = [
  ...CASES.flatMap(scene => [
    [`still-${scene.id}.txt`, buildStillPrompt(scene)],
    [`dive-${scene.id}.txt`, buildDivePrompt(scene)],
  ]),
  ...CASES.slice(0, -1).map((scene, index) => [
    `connector-${index + 1}.txt`,
    buildConnectorPrompt(scene, CASES[index + 1]),
  ]),
];

await mkdir(outputDirectory, { recursive: true });
await Promise.all(files.map(([name, prompt]) => writeFile(new URL(name, outputDirectory), prompt, 'utf8')));

if (files.length !== 17) {
  console.error(`expected 17 prompt files, got ${files.length}`);
  process.exitCode = 1;
} else {
  console.log('wrote 17 prompt files');
}
