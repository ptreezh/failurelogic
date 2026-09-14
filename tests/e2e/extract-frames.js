#!/usr/bin/env node
/**
 * tests/e2e/extract-frames.js
 *
 * Walk tests/frames/<scenario>/playthrough.webm and extract one frame per
 * second into tests/frames/<scenario>/keyframe-NNN.jpg using the bundled
 * @ffmpeg-installer/ffmpeg binary (cross-platform; no system ffmpeg needed).
 *
 * Usage:
 *   node tests/e2e/extract-frames.js                 # all scenarios
 *   node tests/e2e/extract-frames.js --fps 0.5       # 1 frame every 2 seconds
 *   node tests/e2e/extract-frames.js --dir myrun/    # custom frames dir
 *
 * Output naming: keyframe-%03d.jpg (zero-padded, ffmpeg %03d pattern).
 * Skip silently if a playthrough.webm is missing (test hasn't run yet).
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const ffmpeg = require('@ffmpeg-installer/ffmpeg');

const args = process.argv.slice(2);
let fps = 1; // frames per second
let framesDir = path.resolve(__dirname, '..', 'frames');
for (let i = 0; i < args.length; i += 2) {
  if (args[i] === '--fps') fps = parseFloat(args[i + 1]);
  else if (args[i] === '--dir') framesDir = path.resolve(args[i + 1]);
}

if (!fs.existsSync(framesDir)) {
  console.error(`Frames directory not found: ${framesDir}`);
  console.error('Run npm run test:deep:frames first to produce playthrough.webm files.');
  process.exit(1);
}

const scenarios = fs.readdirSync(framesDir).filter((name) => {
  const sub = path.join(framesDir, name);
  return fs.statSync(sub).isDirectory() && fs.existsSync(path.join(sub, 'playthrough.webm'));
});

if (scenarios.length === 0) {
  console.error(`No playthrough.webm files found under ${framesDir}`);
  process.exit(1);
}

console.log(`Extracting keyframes at ${fps} fps from ${scenarios.length} scenario video(s):`);
console.log(`  ffmpeg: ${ffmpeg.path} (v${ffmpeg.version})`);
console.log(`  frames dir: ${framesDir}\n`);

let totalFrames = 0;
let failed = 0;

for (const scenario of scenarios) {
  const scenarioDir = path.join(framesDir, scenario);
  const webm = path.join(scenarioDir, 'playthrough.webm');

  // Wipe previous keyframe-*.jpg to avoid stale frame reuse
  for (const f of fs.readdirSync(scenarioDir)) {
    if (/^keyframe-\d+\.jpg$/i.test(f)) fs.unlinkSync(path.join(scenarioDir, f));
  }

  const outPattern = path.join(scenarioDir, 'keyframe-%03d.jpg');
  const result = spawnSync(
    ffmpeg.path,
    [
      '-y',                        // overwrite
      '-i', webm,
      '-vf', `fps=${fps}`,
      '-q:v', '2',                 // high JPEG quality
      outPattern,
    ],
    { stdio: ['ignore', 'pipe', 'pipe'] },
  );

  if (result.status !== 0) {
    console.error(`[FAIL] ${scenario}: ffmpeg exited ${result.status}`);
    console.error(result.stderr?.toString().split('\n').slice(-8).join('\n'));
    failed++;
    continue;
  }

  const extracted = fs.readdirSync(scenarioDir).filter((f) => /^keyframe-\d+\.jpg$/i.test(f));
  totalFrames += extracted.length;
  console.log(`[OK]   ${scenario}: ${extracted.length} keyframes`);
}

console.log(`\nDone. ${totalFrames} keyframes extracted${failed ? `, ${failed} failed` : ''}.`);
console.log(`View with: ls tests/frames/*/keyframe-*.jpg | head -20`);
process.exit(failed ? 1 : 0);
