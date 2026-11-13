/** Browser regression checks. Run against `npm run preview -- --port 4322`. */
import assert from 'node:assert/strict';
import { chromium } from 'playwright-core';
import sharp from 'sharp';

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const origin = process.env.WORK_LETTER_URL || 'http://localhost:4322';
// A landscape phone is short enough that the company bar rests at the end instead of staying pinned.
const viewports = {
  desktop: { width: 1280, height: 1000 },
  mobile: { width: 390, height: 844 },
  landscape: { width: 844, height: 390 },
};
let cases = 0;
try {
  for (const locale of ['ko-KR', 'en-US', 'ja-JP']) {
    for (const screen of ['desktop', 'mobile', 'landscape']) {
      for (const reducedMotion of ['no-preference', 'reduce']) {
        const context = await browser.newContext({
          locale, reducedMotion, viewport: viewports[screen],
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
        assert.equal(await dialog.locator('[data-work-letter-close]').evaluate((el) => el.matches(':focus-visible')), false,
          'opening with a click does not ring Close');
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
        if (screen !== 'landscape') {
          // A landscape letter is short enough to follow the second message within this time.
          assert.equal(await dialog.locator('[data-work-letter-sheet]').evaluate((el) => el.scrollTop), 0);
        }
        if (reducedMotion === 'no-preference') {
          const row = visiblePanel.locator('.work-letter-turn').first();
          const size = async () => { const { width, height } = await row.boundingBox(); return { width, height }; };
          const rowSize = await size();
          await page.waitForTimeout(500);
          assert.deepEqual(await size(), rowSize, 'typing must not change the current message size');
          const typed = row.locator('.work-letter-q [data-work-text]');
          assert.ok((await typed.textContent()).length > 0);
          assert.equal(await visiblePanel.locator('.work-letter-turn').nth(2).isVisible(), false);
          if (locale === 'ko-KR' && screen === 'desktop') {
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
          // The company bar runs into the sheet's side padding on purpose; the sheet never scrolls sideways.
          assert.equal(await dialog.locator('[data-work-letter-sheet]').evaluate((el) => el.scrollWidth > el.clientWidth), false);
        }
        assert.equal(await dialog.locator('[data-work-letter-skip]').count(), 0);
        await visiblePanel.locator('[data-work-letter-replay]').waitFor({ state: 'visible', timeout: 30000 });
        await page.waitForFunction(() => !document.querySelector('[data-work-letter]').classList.contains('is-playing'));
        const company = visiblePanel.locator('.work-letter-company');
        assert.equal(await company.locator('.work-letter-company-text').textContent(), 'kakaopayinscorp.co.kr');
        assert.equal((await company.getAttribute('aria-label')) ?? (await company.innerText()).trim(), 'kakaopayinscorp.co.kr');
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
        assert.equal(await visiblePanel.locator('.work-letter-glass').count(), 0, 'no glass section in the flow');
        const glow = dialog.locator('[data-work-letter-glow]');
        assert.equal(await glow.getAttribute('aria-hidden'), 'true');
        assert.equal(await glow.getAttribute('data-stage'), '4', 'the light ends on its last stage');
        assert.equal(await glow.evaluate((el) => getComputedStyle(el).pointerEvents), 'none');
        // The light hands over to the company link with the highlighter once it has settled.
        await company.evaluate((el) => new Promise((resolve) => {
          if (el.classList.contains('is-marked')) resolve();
          else new MutationObserver((_, observer) => { observer.disconnect(); resolve(); }).observe(el, { attributeFilter: ['class'] });
        }));
        assert.equal(await company.evaluate((el) => el.classList.contains('is-marked')), true);
        assert.equal(await visiblePanel.locator('.work-letter-foot').evaluate((el) => getComputedStyle(el).position),
          screen === 'landscape' ? 'static' : 'sticky');
        if (locale === 'ko-KR' && reducedMotion === 'no-preference') {
          await page.screenshot({ path: `/tmp/work-letter-${screen}.png` });
        }
        await visiblePanel.locator('[data-work-letter-replay]').click();
        if (reducedMotion === 'no-preference') {
          assert.equal(await company.evaluate((el) => el.classList.contains('is-marked')), false, 'replay lifts the highlighter');
          assert.equal(await dialog.evaluate((el) => el.classList.contains('is-playing')), true);
          assert.equal(await visiblePanel.locator('.work-letter-turn:not([hidden])').count(), 0);
          assert.equal(await glow.getAttribute('data-stage'), '0', 'replay starts the light again');
          assert.deepEqual(await dialog.boundingBox(), bounds, 'replay must keep the frame stable');
        }
        if (reducedMotion === 'reduce') {
          assert.equal(await dialog.evaluate((el) => el.getAnimations({ subtree: true }).length), 0);
          assert.equal(await glow.getAttribute('data-stage'), '4', 'reduced motion shows the final light at once');
        }
        // The bar is slim, but each control is a full thumb-sized target.
        for (const control of await dialog.locator('.work-letter-toolbar button').all()) {
          const box = await control.boundingBox();
          assert.ok(box.width >= 44 && box.height >= 43, `toolbar target is ${box.width}x${box.height}`);
        }
        const toolbar = await dialog.locator('.work-letter-toolbar').boundingBox();
        assert.ok(toolbar.y >= bounds.y && toolbar.y < bounds.y + 60);
        await page.keyboard.press('Escape');
        await page.waitForFunction(() => !document.querySelector('[data-work-letter]').open);
        assert.equal(await page.locator('[data-work-open]').evaluate((el) => el === document.activeElement), true);
        await page.keyboard.press('Enter');
        await dialog.waitFor({ state: 'visible' });
        assert.equal(await dialog.locator('[data-work-letter-close]').evaluate((el) => el.matches(':focus-visible')), true,
          'opening from the keyboard rings Close');
        await page.keyboard.press('Escape');
        await page.waitForFunction(() => !document.querySelector('[data-work-letter]').open);
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
  console.log(`${cases} browser scenarios passed: locale, viewport, motion, sequential conversation, reserved message size, stable frame, toggles, company bar, the light and its hand-over, replay, focus, and focus ring.`);
  await checkScrolledBack();
  await checkRestingPaint();
} finally {
  await browser.close();
}

async function openFinished(context) {
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(origin);
  await page.locator('[data-work-open]').click();
  const dialog = page.locator('[data-work-letter]');
  await dialog.waitFor({ state: 'visible' });
  await page.locator('[data-work-language-panel]:not([hidden]) .work-letter-company.is-marked').waitFor({ state: 'attached', timeout: 60000 });
  await dialog.evaluate((el) => Promise.all(el.getAnimations({ subtree: true }).map((animation) => animation.finished)));
  return { page, dialog, errors };
}

function frames(page) {
  return page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
}

/**
 * Looks at what is drawn on top at each point. The light takes no hits, so it is made to take
 * them for a moment: if it were painted over the toolbar, the company bar or any text,
 * elementFromPoint would land on it. Then, with the light back to taking none, every point of
 * the company link and Meet again must land on that control.
 */
function inspect(dialog) {
  const glow = dialog.querySelector('[data-work-letter-glow]');
  const sheet = dialog.querySelector('[data-work-letter-sheet]');
  const panel = dialog.querySelector('[data-work-language-panel]:not([hidden])');
  const view = sheet.getBoundingClientRect();
  const toolbar = dialog.querySelector('.work-letter-toolbar').getBoundingClientRect();
  const grid = (rect, clip = rect) => {
    const left = Math.max(rect.left, clip.left) + 1;
    const right = Math.min(rect.right, clip.right) - 1;
    const top = Math.max(rect.top, clip.top) + 1;
    const bottom = Math.min(rect.bottom, clip.bottom) - 1;
    if (right <= left || bottom <= top) return [];
    return [0, 0.25, 0.5, 0.75, 1].flatMap((u) => [0, 0.5, 1].map((v) => [left + (right - left) * u, top + (bottom - top) * v]));
  };
  const overlaps = [];
  if (glow.getBoundingClientRect().top < toolbar.bottom - 0.5) overlaps.push('the light reaches into the toolbar');
  const probe = document.createElement('style');
  probe.textContent = '[data-work-letter-glow], [data-work-letter-glow] * { pointer-events: auto !important; }';
  document.head.append(probe);
  const covered = [
    ...[...dialog.querySelectorAll('.work-letter-toolbar button')].map((el) => [el, el.getBoundingClientRect()]),
    ...[...panel.querySelectorAll('.work-letter-eyebrow, .work-letter-title, .work-letter-q, .work-letter-a, [data-work-letter-step], .work-letter-foot')]
      .map((el) => [el, view]),
  ];
  for (const [element, clip] of covered) {
    for (const [x, y] of grid(element.getBoundingClientRect(), clip)) {
      if (glow.contains(document.elementFromPoint(x, y))) overlaps.push(`${element.className} at ${Math.round(x)},${Math.round(y)}`);
    }
  }
  probe.remove();
  const foot = panel.querySelector('.work-letter-foot').getBoundingClientRect();
  const controls = [panel.querySelector('.work-letter-company'), panel.querySelector('[data-work-letter-replay]')];
  const inView = foot.top >= view.top - 0.5 && foot.bottom <= view.bottom + 0.5;
  const misses = [];
  const points = [];
  if (inView) {
    for (const control of controls) {
      for (const [x, y] of grid(control.getBoundingClientRect())) {
        points.push([control.className, x, y]);
        if (!control.contains(document.elementFromPoint(x, y))) misses.push(`${control.className} at ${Math.round(x)},${Math.round(y)}`);
      }
    }
  }
  return { overlaps, misses, inView, points, footBackground: getComputedStyle(panel.querySelector('.work-letter-foot')).backgroundColor };
}

/** The deepest colour the light reaches, against the letter's body text colours. */
async function lightContrast(dialog) {
  const glow = dialog.locator('[data-work-letter-glow]');
  const sheet = dialog.locator('[data-work-letter-sheet]');
  const inks = await dialog.evaluate((el) => {
    const panel = el.querySelector('[data-work-language-panel]:not([hidden])');
    return ['.work-letter-a', '.work-letter-really', '.work-letter-waiting', '.work-letter-company']
      .map((selector) => getComputedStyle(panel.querySelector(selector)).color);
  });
  await sheet.evaluate((el) => { el.style.visibility = 'hidden'; });
  const shot = await glow.screenshot({ animations: 'disabled' });
  await sheet.evaluate((el) => { el.style.visibility = ''; });
  // Leave out the dialog's rounded corners, where the page behind it shows.
  const { width, height } = await sharp(shot).metadata();
  const inset = 16;
  const { data, info } = await sharp(shot)
    .extract({ left: inset, top: 0, width: width - inset * 2, height: height - inset })
    .removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const channel = (value) => { const c = value / 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
  const luminance = (r, g, b) => 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
  let darkest = 1;
  for (let i = 0; i < data.length; i += info.channels) darkest = Math.min(darkest, luminance(data[i], data[i + 1], data[i + 2]));
  return inks.map((ink) => {
    const [r, g, b] = ink.match(/\d+/g).map(Number);
    return { ink, ratio: (darkest + 0.05) / (luminance(r, g, b) + 0.05) };
  });
}

/**
 * Once the letter ends, scroll to the top, the bottom, the top and the bottom again, with real
 * wheel or touch input. The light never comes over the toolbar, the company bar or the text,
 * and every point of the company link and Meet again still takes a click or a tap.
 */
async function checkScrolledBack() {
  let scenarios = 0;
  let lowest = Infinity;
  for (const locale of ['ko-KR', 'en-US']) {
    for (const screen of ['mobile', 'landscape', 'desktop']) {
      const touch = screen !== 'desktop';
      const context = await browser.newContext({ locale, viewport: viewports[screen], hasTouch: touch });
      await context.route('https://kakaopayinscorp.co.kr/**', (route) => route.fulfill({ status: 200, contentType: 'text/html', body: 'ok' }));
      const { page, dialog, errors } = await openFinished(context);
      const cdp = await context.newCDPSession(page);
      const sheet = dialog.locator('[data-work-letter-sheet]');
      const label = `${locale} ${screen}`;
      assert.equal(await dialog.locator('[data-work-letter-glow]').getAttribute('data-stage'), '4');
      for (const ratio of await lightContrast(dialog)) {
        lowest = Math.min(lowest, ratio.ratio);
        assert.ok(ratio.ratio >= 4.5, `${label}: ${ratio.ink} over the brightest light is ${ratio.ratio.toFixed(2)}:1`);
      }
      const box = await sheet.boundingBox();
      for (const [step, end] of [['top', false], ['bottom', true], ['top', false], ['bottom', true]]) {
        const x = Math.round(box.x + box.width / 2);
        const reached = () => sheet.evaluate((el, end) => (end ? el.scrollHeight - el.clientHeight - el.scrollTop < 1 : el.scrollTop === 0), end);
        for (let tries = 0; !await reached(); tries++) {
          assert.ok(tries < 12, `${label}: scrolling to the ${step} gets there`);
          if (touch) {
            // A swipe across most of the sheet, as a thumb would.
            const reach = Math.round(box.height * 0.6) * (end ? -1 : 1);
            const y = Math.round(box.y + box.height / 2 - reach / 2);
            await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
            for (let i = 1; i <= 10; i++) {
              await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: y + (reach * i) / 10 }] });
            }
            await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
          } else {
            await page.mouse.move(x, Math.round(box.y + box.height / 2));
            await page.mouse.wheel(0, end ? 2000 : -2000);
          }
          await page.waitForTimeout(400);
        }
        await frames(page);
        const report = await dialog.evaluate(inspect);
        assert.deepEqual(report.overlaps, [], `${label} at the ${step}: the light is drawn over the letter`);
        assert.deepEqual(report.misses, [], `${label} at the ${step}: a control does not take every point`);
        assert.equal(report.footBackground, 'rgb(251, 250, 246)', 'the company bar keeps its solid paper');
        if (end || screen !== 'landscape') assert.equal(report.inView, true, `${label} at the ${step}: the company bar is in view`);
        if (!end) continue;
        // Real input on every point: record where each click or tap lands, without acting on it.
        await page.evaluate(() => {
          window.__landed = [];
          window.__hold = (event) => { window.__landed.push(event.target); event.preventDefault(); event.stopPropagation(); };
          window.addEventListener('click', window.__hold, true);
        });
        for (const [, x, y] of report.points) {
          if (touch) await page.touchscreen.tap(x, y);
          else await page.mouse.click(x, y);
        }
        const landed = await page.evaluate(() => {
          window.removeEventListener('click', window.__hold, true);
          const panel = document.querySelector('[data-work-language-panel]:not([hidden])');
          const controls = [panel.querySelector('.work-letter-company'), panel.querySelector('[data-work-letter-replay]')];
          return window.__landed.map((target) => controls.findIndex((control) => control.contains(target)));
        });
        assert.equal(landed.length, report.points.length, `${label}: every click or tap arrives`);
        assert.deepEqual(landed, report.points.map(([name]) => (name.includes('company') ? 0 : 1)), `${label}: each lands on its control`);
      }
      // And the real thing: the link opens the company in a new tab, and Meet again plays again.
      const panel = dialog.locator('[data-work-language-panel]:not([hidden])');
      const company = await panel.locator('.work-letter-company').boundingBox();
      const opened = context.waitForEvent('page');
      if (touch) await page.touchscreen.tap(company.x + 2, company.y + company.height - 2);
      else await page.mouse.click(company.x + 2, company.y + company.height - 2);
      await (await opened).close();
      const replay = await panel.locator('[data-work-letter-replay]').boundingBox();
      if (touch) await page.touchscreen.tap(replay.x + replay.width - 3, replay.y + replay.height / 2);
      else await page.mouse.click(replay.x + replay.width - 3, replay.y + replay.height / 2);
      assert.equal(await dialog.evaluate((el) => el.classList.contains('is-playing')), true, `${label}: Meet again replays`);
      assert.equal(await dialog.locator('[data-work-letter-glow]').getAttribute('data-stage'), '0');
      assert.deepEqual(errors, []);
      await context.close();
      scenarios++;
    }
  }
  console.log(`${scenarios} scroll-back scenarios passed: no light over the toolbar, the company bar or the text, body text at ${lowest.toFixed(2)}:1 or more over the light, and every point of the link and Meet again takes real input.`);
}

/** On a phone, with the CPU slowed six times, the finished light repaints nothing while it rests. */
async function checkRestingPaint() {
  const context = await browser.newContext({ locale: 'ko-KR', viewport: viewports.mobile });
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 6 });
  await page.goto(origin);
  await page.locator('[data-work-open]').click();
  const dialog = page.locator('[data-work-letter]');
  await dialog.waitFor({ state: 'visible' });
  await cdp.send('DOM.getDocument', { depth: -1 });
  const subtree = async (selector) => {
    const { result } = await cdp.send('Runtime.evaluate', { expression: `document.querySelector(${JSON.stringify(selector)})` });
    const { node } = await cdp.send('DOM.describeNode', { objectId: result.objectId, depth: -1, pierce: true });
    const ids = new Set();
    const walk = (n) => { ids.add(n.backendNodeId); (n.children ?? []).forEach(walk); (n.pseudoElements ?? []).forEach(walk); };
    walk(node);
    return { id: node.backendNodeId, ids };
  };
  const letter = await subtree('[data-work-letter]');
  const glow = await subtree('[data-work-letter-glow]');
  const paints = async (ms) => {
    const events = [];
    const collect = ({ value }) => events.push(...value);
    cdp.on('Tracing.dataCollected', collect);
    await cdp.send('Tracing.start', {
      traceConfig: { includedCategories: ['devtools.timeline', 'disabled-by-default-devtools.timeline'] },
      transferMode: 'ReportEvents',
    });
    await page.waitForTimeout(ms);
    const complete = new Promise((resolve) => cdp.once('Tracing.tracingComplete', resolve));
    await cdp.send('Tracing.end');
    await complete;
    cdp.off('Tracing.dataCollected', collect);
    return events.filter((event) => event.name === 'Paint').map((event) => event.args?.data?.nodeId);
  };
  // While the conversation types, the letter does paint, so the count below means something.
  const playing = await paints(2500);
  assert.ok(playing.some((id) => letter.ids.has(id)), 'the trace sees the letter paint while it plays');
  await page.locator('[data-work-language-panel]:not([hidden]) .work-letter-company.is-marked').waitFor({ state: 'attached', timeout: 120000 });
  await dialog.evaluate((el) => Promise.all(el.getAnimations({ subtree: true }).map((animation) => animation.finished)));
  await page.waitForTimeout(1000);
  // The letter paints on its own layer, so the page behind it repainting is not counted here.
  let layers = [];
  cdp.on('LayerTree.layerTreeDidChange', (event) => { if (event.layers) layers = event.layers; });
  await cdp.send('LayerTree.enable');
  await frames(page);
  await page.waitForTimeout(300);
  await cdp.send('LayerTree.disable');
  assert.ok(layers.some((layer) => layer.backendNodeId === letter.id), 'the letter has a layer of its own');
  const resting = await paints(3000);
  assert.equal(resting.filter((id) => glow.ids.has(id)).length, 0, 'the light repaints while it rests');
  assert.equal(resting.filter((id) => letter.ids.has(id)).length, 0, 'the letter repaints while it rests');
  await context.close();
  console.log('Resting paint passed: 0 repaints of the letter and its light at 390x844 with the CPU slowed 6x.');
}
