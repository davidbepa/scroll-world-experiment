import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('render pipeline is Bash 3.2-safe and uses the approved Draft model', async () => {
  const common = await readFile('scripts/render-common.sh', 'utf8');
  const runner = await readFile('scripts/render.sh', 'utf8');
  assert.match(common, /^#!\/bin\/bash/);
  assert.match(runner, /^#!\/bin\/bash/);
  assert.doesNotMatch(common + runner, /declare\s+-A/);
  assert.match(common, /seedance_2_0_mini/);
  assert.match(common, /--resolution 720p/);
  assert.match(common, /--start-image/);
  assert.match(common, /--end-image/);
  assert.match(common, /-c:v libx264/);
  assert.match(common, /-crf 20/);
  assert.match(common, /-g 8/);
  assert.match(common, /-keyint_min 8/);
  assert.match(common, /-an/);
  assert.match(common, /-movflags \+faststart/);
  assert.match(runner, /last-\$prev\.png/);
  assert.match(runner, /first-\$name\.png/);
});

test('Seedance Mini options match the live Higgsfield CLI schema', async () => {
  const common = await readFile('scripts/render-common.sh', 'utf8');
  assert.match(common, /--bitrate_mode standard/);
  assert.match(common, /--generate_audio false/);
  assert.match(common, /--resolution 720p/);
  assert.doesNotMatch(common, /--mode(?:\s|=)/);
});

test('still generation uses the approved wide 16:9 frame', async () => {
  const common = await readFile('scripts/render-common.sh', 'utf8');
  assert.match(common, /gpt_image_2[\s\S]*--aspect_ratio 16:9/);
  assert.doesNotMatch(common, /--aspect_ratio 3:2/);
});

test('render runner exposes every approved noninteractive stage and encoding flag', async () => {
  const runner = await readFile('scripts/render.sh', 'utf8');
  for (const stage of ['calibrate', 'stills', 'contact-sheet', 'dives', 'frames', 'connectors', 'encode', 'verify']) {
    assert.match(runner, new RegExp(`^\\s*${stage}\\)`, 'm'));
  }
  assert.match(runner, /cwebp -quiet -q 84 -resize 1800 0/);
  assert.match(runner, /scale=768:512/);
  assert.match(runner, /-ss 0/);
  assert.match(runner, /-sseof -0\.15/);
  assert.match(runner, /exit 2/);
});

test('asset verifier locks the public filenames and native video contract', async () => {
  const verifier = await readFile('scripts/verify-assets.mjs', 'utf8');
  for (const name of ['marinemax', 'southeast-toyota-finance', 'iata', 'aspen-snowmass', 'honda-powersports', 'seaworld']) {
    assert.match(verifier, new RegExp(`${name}\\.webp`));
    assert.match(verifier, new RegExp(`${name}\\.mp4`));
  }
  for (let index = 1; index <= 5; index += 1) assert.match(verifier, new RegExp(`connector-${index}\\.mp4`));
  assert.match(verifier, /ffprobe/);
  assert.match(verifier, /stream=codec_name,width,height/);
  assert.match(verifier, /format=duration/);
  assert.match(verifier, /codec_name.*h264|h264.*codec_name/s);
  assert.match(verifier, /width.*1280|1280.*width/s);
  assert.match(verifier, /height.*720|720.*height/s);
  assert.match(verifier, /duration.*4|4.*duration/s);
  assert.match(verifier, /audio/);
  assert.match(verifier, /verified 6 stills and 11 videos/);
});
