import { mkdir, readdir, unlink, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CASES } from '../src/cases.js';
import { buildConnectorPrompt, buildDivePrompt, buildStillPrompt } from '../render/prompts.mjs';

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

const expectedNames = promptFiles.map(([name]) => name).sort();

export async function writePromptFiles(outputDirectory) {
  await mkdir(outputDirectory, { recursive: true });
  const existingEntries = await readdir(outputDirectory, { withFileTypes: true });
  await Promise.all(existingEntries
    .filter(entry => entry.isFile() && entry.name.endsWith('.txt'))
    .map(entry => unlink(new URL(entry.name, new URL(`${outputDirectory}/`, 'file:')))));
  await Promise.all(promptFiles.map(([name, prompt]) => writeFile(new URL(name, new URL(`${outputDirectory}/`, 'file:')), prompt, 'utf8')));

  const actualNames = (await readdir(outputDirectory, { withFileTypes: true }))
    .filter(entry => entry.isFile() && entry.name.endsWith('.txt'))
    .map(entry => entry.name)
    .sort();

  if (actualNames.length !== 17 || actualNames.join('\n') !== expectedNames.join('\n')) {
    throw new Error(`expected exactly 17 prompt files, got ${actualNames.length}`);
  }
}

const outputDirectory = new URL('../.render/prompts/', import.meta.url);

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await writePromptFiles(outputDirectory);
  console.log('wrote 17 prompt files');
}
