/** Browser regression checks. Run against `npm run preview -- --port 4322`. */
import assert from 'node:assert/strict';
import { chromium } from 'playwright-core';

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const origin = process.env.WORK_LETTER_URL || 'http://localhost:4322';
let cases = 0;
try {
  for (const locale of ['ko-KR', 'en-US', 'ja-JP']) {
    for (const mobile of [false, true]) {
      for (const reducedMotion of ['no-preference', 'reduce']) {
        const context = await browser.newContext({
          locale, reducedMotion, viewport: mobile ? { width: 390, height: 844 } : { width: 1280, height: 1000 },
        });
        const page = await context.newPage();
        const errors = [];
        page.on('pageerror', (error) => errors.push(error.message));
        await page.goto(origin);
        await page.locator('[data-work-open]').click();
        const dialog = page.locator('[data-work-letter]');
        await dialog.waitFor({ state: 'visible' });
        await page.evaluate(() => document.fonts.ready);
        await dialog.evaluate((el) => Promise.all(el.getAnimations().map((animation) => animation.finished)));
        const expected = locale === 'ko-KR' ? 'ko' : 'en';
        assert.equal(await dialog.getAttribute('lang'), expected);
        const visiblePanel = dialog.locator('[data-work-language-panel]:not([hidden])');
        assert.equal(await visiblePanel.count(), 1);
        assert.equal(await visiblePanel.locator('.work-letter-a').count(), 3);
        const bounds = await dialog.boundingBox();
        await page.waitForTimeout(1400);
        assert.deepEqual(await dialog.boundingBox(), bounds, 'highlighting must not resize or move the dialog');
        assert.equal(await dialog.locator('[data-work-letter-sheet]').evaluate((el) => el.scrollTop), 0);
        for (const language of ['ko', 'en', 'ko']) {
          await dialog.locator(`[data-work-language="${language}"]`).click();
          assert.equal(await dialog.getAttribute('lang'), language);
          assert.equal(await dialog.locator(`[data-work-language="${language}"]`).getAttribute('aria-pressed'), 'true');
          assert.equal(await visiblePanel.getAttribute('lang'), language);
          assert.deepEqual(await dialog.boundingBox(), bounds, 'switching language must keep the frame stable');
          const close = dialog.locator('[data-work-letter-close]');
          assert.equal(await close.getAttribute('aria-label'), language === 'ko' ? '닫기' : 'Close');
          assert.equal(await visiblePanel.evaluate((el) => el.scrollWidth > el.clientWidth), false);
        }
        const sheet = dialog.locator('[data-work-letter-sheet]');
        await sheet.evaluate((el) => { el.scrollTop = el.scrollHeight; });
        if (locale === 'ko-KR' && reducedMotion === 'no-preference') {
          await page.screenshot({ path: `/tmp/work-letter-${mobile ? 'mobile' : 'desktop'}.png` });
        }
        await visiblePanel.locator('[data-work-letter-replay]').click();
        if (reducedMotion === 'reduce') {
          assert.equal(await dialog.evaluate((el) => el.getAnimations({ subtree: true }).length), 0);
        }
        const toolbar = await dialog.locator('.work-letter-toolbar').boundingBox();
        assert.ok(toolbar.y >= bounds.y && toolbar.y < bounds.y + 60);
        await page.keyboard.press('Escape');
        await page.waitForFunction(() => !document.querySelector('[data-work-letter]').open);
        assert.equal(await page.locator('[data-work-open]').evaluate((el) => el === document.activeElement), true);
        await page.locator('[data-work-open]').click();
        await dialog.waitFor({ state: 'visible' });
        assert.equal(await dialog.getAttribute('lang'), 'ko', 'manual choice survives reopening');
        await dialog.locator('[data-work-letter-close]').click();
        await page.waitForFunction(() => !document.querySelector('[data-work-letter]').open);
        assert.deepEqual(errors, []);
        await context.close();
        cases++;
      }
    }
  }
  console.log(`${cases} browser scenarios passed: locale, viewport, motion, stable layout, toggles, replay, and focus.`);
} finally {
  await browser.close();
}
