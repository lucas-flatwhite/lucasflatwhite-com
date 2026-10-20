import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');
const specimen = read('src/lib/specimen.ts');
const field = read('src/lib/text-field.ts');
const landingStyles = read('src/styles/landing.css');

describe('specimen field on a phone', () => {
  it('keeps the first viewport one height while the toolbar folds away', () => {
    expect(landingStyles).toMatch(/\.specimen \{[^}]*min-height: 100svh;/);
    expect(landingStyles).not.toMatch(/\.specimen \{[^}]*min-height: 100dvh/);
  });

  it('repaints in the same frame a resize clears the canvas', () => {
    expect(specimen).toMatch(/new ResizeObserver\(\(\) => \{\s*fitAll\(\);\s*measure\(\);[\s\S]*?paint\(\);\s*\}\)/);
  });

  it('lets a mouse steer the lens but not a finger that is scrolling', () => {
    expect(specimen).toContain("if (event.pointerType === 'touch') {");
  });

  it('pins the lines and keeps the lens, ringed, in the strip above the name', () => {
    expect(specimen).toContain('field.anchor(blocks);');
    expect(specimen).toContain('field.openBand(blocks)');
    expect(specimen).toContain('ctx.arc(lens.x, lens.y, lens.radius, 0, Math.PI * 2);');
    expect(field).toContain('anchor(obstacles: readonly FieldObstacle[]): void {');
  });
});
