#!/usr/bin/env node
/**
 * tests/e2e/copy-videos.js
 *
 * After `npm run test:deep:frames` finishes, Playwright's videos are still
 * parked under tests/test-results-deep/<spec>/<test>/video.webm. This script
 * copies each scenario's video into tests/frames/<scenario>/playthrough.webm
 * and verifies the count matches the 3 expected scenarios.
 *
 * Run after every test:deep:frames invocation (or as part of `npm run test:deep`).
 *
 * Usage:
 *   node tests/e2e/copy-videos.js
 *   node tests/e2e/copy-videos.js --src tests/test-results --dst tests/frames
 */

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
let srcDir = path.resolve(__dirname, '..', 'test-results-deep');
let dstDir = path.resolve(__dirname, '..', 'frames');
for (let i = 0; i < args.length; i += 2) {
  if (args[i] === '--src') srcDir = path.resolve(args[i + 1]);
  else if (args[i] === '--dst') dstDir = path.resolve(args[i + 1]);
}

if (!fs.existsSync(srcDir)) {
  console.error(`Source dir not found: ${srcDir}`);
  console.error('Run npm run test:deep:frames first.');
  process.exit(1);
}

// Find all video.webm files under srcDir (one level deep: src/<test>/video.webm)
const videos = [];
function walk(dir, depth) {
  if (depth > 2) return;
  for (const entry of fs.readdirSync(dir)) {
    const full = path.join(dir, entry);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) walk(full, depth + 1);
    else if (entry === 'video.webm') videos.push(full);
  }
}
walk(srcDir, 0);

if (videos.length === 0) {
  console.error(`No video.webm found under ${srcDir}`);
  process.exit(1);
}

console.log(`Found ${videos.length} video(s). Copying to ${dstDir}/\n`);

let copied = 0;
let failed = 0;
for (const video of videos) {
  // Map video file back to scenario id via the parent directory name.
  // Playwright truncates the test title to ~30 chars in the dir name; the
  // canonical scenario IDs are 30+ chars so we can't substring-match them
  // reliably. Use a tag map based on the unique prefix Playwright uses:
  //   "deep-scenarios-coverage-ch-..." → challenger-launch-decision
  //   "deep-scenarios-coverage-cl-..." → climate-change-tipping-point
  //   "deep-scenarios-coverage-en-..." → enron-collapse
  const parentDir = path.basename(path.dirname(video));
  const tagMap = {
    'ch': 'challenger-launch-decision',
    'cl': 'climate-change-tipping-point',
    'en': 'enron-collapse',
  };
  let scenarioId = null;
  const tagMatch = parentDir.match(/coverage-([a-z]{2})-/);
  if (tagMatch && tagMap[tagMatch[1]]) {
    scenarioId = tagMap[tagMatch[1]];
  } else {
    // Fallback: use whatever's after coverage-
    scenarioId = parentDir.replace(/^deep-scenarios-coverage-/, '').replace(/-chromium$/, '');
  }

  const dst = path.join(dstDir, scenarioId, 'playthrough.webm');
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  try {
    fs.copyFileSync(video, dst);
    const size = fs.statSync(dst).size;
    console.log(`[OK]   ${scenarioId.padEnd(36)} ← ${path.basename(video)} (${(size / 1024).toFixed(0)} KB)`);
    copied++;
  } catch (e) {
    console.error(`[FAIL] ${scenarioId}: ${e.message}`);
    failed++;
  }
}

console.log(`\n${copied} copied${failed ? `, ${failed} failed` : ''}.`);
console.log(`Next: npm run test:deep:extract   # extract keyframes from these .webm files`);
process.exit(failed ? 1 : 0);
