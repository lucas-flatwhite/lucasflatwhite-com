/** Run against a built preview with node scripts/check-terrarium.mjs [url]. */
import assert from 'node:assert/strict';
import { chromium } from 'playwright-core';

const browser = await chromium.launch({ channel: 'chrome' });
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: 'no-preference' });
  await page.goto(process.argv[2] ?? 'http://localhost:4322');
  const monitor = page.locator('.monitor');
  await monitor.scrollIntoViewIfNeeded();
  await page.waitForSelector('.monitor[data-motion="running"]');

  // Seek the actual CSS tracks together so the wrap can be sampled without clock jitter.
  const samples = await monitor.evaluate((element) => {
    const tracks = element.getAnimations({ subtree: true });
    const sample = (time, scene) => {
      for (const track of tracks) track.currentTime = time;
      const group = element.querySelector('.terr-' + scene);
      return [Number(getComputedStyle(group).opacity), Number(getComputedStyle(group.querySelector('.terr-output')).opacity)];
    };
    return {
      claudeResult: sample(2000, 'claude'),
      codexStart: sample(4400, 'codex'),
      codexResult: sample(6000, 'codex'),
      claudeReturning: sample(7900, 'claude'),
      claudeRestarted: sample(8100, 'claude'),
    };
  });
  assert.ok(samples.claudeReturning[0] > 0 && samples.claudeReturning[0] < 1);
  assert.equal(samples.claudeReturning[1], 0, 'the old read result flashed during the fade-in');
  assert.deepEqual(samples.claudeRestarted, [1, 0]);
  assert.deepEqual(samples.claudeResult, [1, 1]);
  assert.deepEqual(samples.codexStart, [1, 0]);
  assert.deepEqual(samples.codexResult, [1, 1]);

  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await page.waitForSelector('.monitor[data-motion="paused"]');
  const states = () => monitor.evaluate(el => el.getAnimations({ subtree: true }).map(track => track.playState));
  const paused = await states();
  assert.ok(paused.length > 0 && paused.every(state => state === 'paused'));
  await monitor.scrollIntoViewIfNeeded();
  await page.waitForSelector('.monitor[data-motion="running"]');
  assert.ok((await states()).every(state => state === 'running'));
  await page.emulateMedia({ reducedMotion: 'reduce' });
  assert.deepEqual(await states(), []);
  console.log('terrarium loop, pause, resume and reduced motion passed');
} finally {
  await browser.close();
}
