import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { dailyShot } from '../src/data/daily-shot';
import { receiptStamp, untilNextMinute } from '../src/lib/daily-shot';

const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

describe('receiptStamp', () => {
  it('prints the date with its weekday and the time to the minute', () => {
    expect(receiptStamp(new Date(2026, 10, 1, 9, 5, 42))).toEqual({ date: '2026.11.01 SUN', time: '09:05' });
    expect(receiptStamp(new Date(2027, 0, 9, 23, 59, 0))).toEqual({ date: '2027.01.09 SAT', time: '23:59' });
  });
});

describe('untilNextMinute', () => {
  it('waits until just after the minute turns', () => {
    expect(untilNextMinute(120_000)).toBe(60_050);
    expect(untilNextMinute(179_990)).toBe(60);
  });
});

describe('the Daily Shot card', () => {
  const landing = read('src/pages/index.astro');

  it('opens the X profile in a new tab, as the project cards do, and never in a popup', () => {
    expect(dailyShot.href).toBe('https://x.com/lucas_flatwhite');
    expect(landing).toContain('<a href={dailyShot.href} target="_blank" rel="noreferrer me">');
    expect(read('src/lib/daily-shot.ts')).not.toMatch(/window\.open|preventDefault/);
  });

  it('takes the slot after the projects and comes before the arcade', () => {
    expect(landing).toContain('const slots = arrangeBoard(placed.board);');
    expect(landing).toContain("slot.kind === 'daily'");
    expect(landing.indexOf('<DailyShotReceipt />')).toBeLessThan(landing.indexOf('<ArcadeHandheld />'));
  });

  it('stays a still picture with no animation of its own', () => {
    const receipt = read('src/components/DailyShotReceipt.astro');

    expect(receipt).not.toMatch(/<animate|@keyframes|animation:/);
    expect(receipt).toContain('data-receipt-date');
    expect(receipt).toContain('data-receipt-time');
  });

  it('prints blank fields until the browser stamps the visitor\'s time, never the build\'s', () => {
    const receipt = read('src/components/DailyShotReceipt.astro');

    expect(receipt).not.toMatch(/receiptStamp|new Date\(/);
    expect(receipt).toContain("const date = '----.--.-- ---';");
    expect(receipt).toContain("const time = '--:--';");
  });
});
