import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readdir, stat } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const stillDirectory = join(projectRoot, 'public/assets/stills');
const videoDirectory = join(projectRoot, 'public/assets/video');

const stillNames = [
  'marinemax.webp',
  'southeast-toyota-finance.webp',
  'iata.webp',
  'aspen-snowmass.webp',
  'honda-powersports.webp',
  'seaworld.webp',
].sort();

const videoNames = [
  'marinemax.mp4',
  'southeast-toyota-finance.mp4',
  'iata.mp4',
  'aspen-snowmass.mp4',
  'honda-powersports.mp4',
  'seaworld.mp4',
  'connector-1.mp4',
  'connector-2.mp4',
  'connector-3.mp4',
  'connector-4.mp4',
  'connector-5.mp4',
].sort();

function ffprobe(path, extraArguments = []) {
  const output = execFileSync('ffprobe', [
    '-v', 'error',
    ...extraArguments,
    '-show_entries', 'stream=codec_name,width,height',
    '-show_entries', 'format=duration',
    '-of', 'json',
    path,
  ], { encoding: 'utf8' });
  return JSON.parse(output);
}

async function assertExactFiles(directory, expectedNames, extension) {
  const actualNames = (await readdir(directory, { withFileTypes: true }))
    .filter(entry => entry.isFile() && entry.name.endsWith(extension))
    .map(entry => entry.name)
    .sort();
  assert.deepEqual(actualNames, expectedNames, `${directory} must contain the exact ${extension} filename set`);
  for (const name of expectedNames) {
    const details = await stat(join(directory, name));
    assert.ok(details.size > 0, `${name} is empty`);
  }
}

await assertExactFiles(stillDirectory, stillNames, '.webp');
await assertExactFiles(videoDirectory, videoNames, '.mp4');

for (const name of videoNames) {
  const path = join(videoDirectory, name);
  const metadata = ffprobe(path);
  const video = metadata.streams.find(stream => Number(stream.width) > 0 && Number(stream.height) > 0);
  assert.ok(video, `${name} has no video stream`);
  assert.equal(video.codec_name, 'h264', `${name} is not H.264`);
  assert.ok(Number(video.width) >= 1280, `${name} width is below 1280`);
  assert.ok(Number(video.height) >= 720, `${name} height is below 720`);
  assert.ok(Number(metadata.format.duration) > 4, `${name} duration is not greater than 4 seconds`);

  const audio = ffprobe(path, ['-select_streams', 'a']);
  assert.equal((audio.streams ?? []).length, 0, `${name} contains an audio stream`);
}

console.log('verified 6 stills and 11 videos');
