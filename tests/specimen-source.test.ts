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
    expect(specimen).toMatch(/new ResizeObserver\(\(\) => \{\s*fitAll\(\);[\s\S]*?paint\(\);\s*\}\)/);
  });

});

describe('specimen field', () => {
  it('stands still: no lens follows the pointer or drifts on its own', () => {
    expect(specimen).not.toContain('pointermove');
    expect(specimen).not.toContain('runWhileVisible');
    expect(specimen).not.toContain('lens');
    expect(field).not.toContain('FieldGlow');
    expect(field).not.toContain("kind: 'circle'");
  });
});
