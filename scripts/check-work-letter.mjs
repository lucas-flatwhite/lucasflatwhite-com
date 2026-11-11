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
        assert.equal(await dialog.locator('[data-work-letter-close]').evaluate((el) => el === document.activeElement), true,
          'focus starts on Close, not a language toggle');
        const visiblePanel = dialog.locator('[data-work-language-panel]:not([hidden])');
        assert.equal(await visiblePanel.count(), 1);
        assert.equal(await visiblePanel.locator('.work-letter-a').count(), 3);
        if (reducedMotion === 'no-preference') {
          assert.equal(await dialog.evaluate((el) => el.classList.contains('is-playing')), true,
            'the letter must open as a conversation, not a complete static page');
          assert.ok(await visiblePanel.locator('.work-letter-turn:not([hidden])').count() < 3);
          assert.equal(await visiblePanel.locator('.work-letter-company').isVisible(), true,
            'the company link is there while the conversation plays');
          assert.equal(await visiblePanel.locator('[data-work-letter-replay]').isVisible(), false);
        }
        const bounds = await dialog.boundingBox();
        await page.waitForTimeout(1400);
        assert.deepEqual(await dialog.boundingBox(), bounds, 'typing must not resize or move the dialog');
        assert.equal(await dialog.locator('[data-work-letter-sheet]').evaluate((el) => el.scrollTop), 0);
        if (reducedMotion === 'no-preference') {
          const row = visiblePanel.locator('.work-letter-turn').first();
          const rowBounds = await row.boundingBox();
          await page.waitForTimeout(500);
          assert.deepEqual(await row.boundingBox(), rowBounds, 'typing must not change the current message size');
          const typed = row.locator('.work-letter-q [data-work-text]');
          assert.ok((await typed.textContent()).length > 0);
          assert.equal(await visiblePanel.locator('.work-letter-turn').nth(2).isVisible(), false);
          if (locale === 'ko-KR' && !mobile) {
            await visiblePanel.locator('.work-letter-turn').nth(1).waitFor({ state: 'visible' });
            const answer = row.locator('.work-letter-a [data-work-text]');
            assert.equal(await answer.textContent(), await answer.getAttribute('data-work-text'),
              'the next question waits for the previous answer');
            assert.deepEqual(await dialog.boundingBox(), bounds);
          }
        }
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
        assert.equal(await dialog.locator('[data-work-letter-skip]').count(), 0);
        await visiblePanel.locator('[data-work-letter-replay]').waitFor({ state: 'visible', timeout: 30000 });
        await page.waitForFunction(() => !document.querySelector('[data-work-letter]').classList.contains('is-playing'));
        const company = visiblePanel.locator('.work-letter-company');
        assert.equal(await company.textContent(), 'kakaopayinscorp.co.kr');
        assert.equal(await company.getAttribute('href'), 'https://kakaopayinscorp.co.kr/');
        assert.equal(await company.getAttribute('target'), '_blank');
        assert.equal(await visiblePanel.locator('.work-letter-sign, .work-letter-mark-logo').count(), 0);
        assert.equal(await visiblePanel.locator('.work-letter-turn:not([hidden])').count(), 3);
        for (const text of await visiblePanel.locator('[data-work-text]').all()) {
          assert.equal(await text.textContent(), await text.getAttribute('data-work-text'));
        }
        const sheet = dialog.locator('[data-work-letter-sheet]');
        await sheet.evaluate((el) => { el.scrollTop = el.scrollHeight; });
        const lastStep = await visiblePanel.locator('.work-letter-waiting').boundingBox();
        const foot = await visiblePanel.locator('.work-letter-foot').boundingBox();
        assert.ok(lastStep.y + lastStep.height <= foot.y, 'the last line sits above the company bar');
        if (locale === 'ko-KR' && reducedMotion === 'no-preference') {
          await page.screenshot({ path: `/tmp/work-letter-${mobile ? 'mobile' : 'desktop'}.png` });
        }
        await visiblePanel.locator('[data-work-letter-replay]').click();
        if (reducedMotion === 'no-preference') {
          assert.equal(await dialog.evaluate((el) => el.classList.contains('is-playing')), true);
          assert.equal(await visiblePanel.locator('.work-letter-turn:not([hidden])').count(), 0);
          assert.deepEqual(await dialog.boundingBox(), bounds, 'replay must keep the frame stable');
        }
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
  console.log(`${cases} browser scenarios passed: locale, viewport, motion, sequential conversation, reserved message size, stable frame, toggles, company bar, replay, and focus.`);
} finally {
  await browser.close();
}
