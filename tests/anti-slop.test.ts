import { readdirSync, readFileSync, statSync } from 'node:fs';
import { extname, join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

// Guards the design contract in docs/superpowers/specs/2026-10-05-landing-redesign-plan.md.
const TEXT_EXTENSIONS = new Set(['.astro', '.ts', '.css', '.md']);

function collect(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);

    if (statSync(path).isDirectory()) {
      return collect(path);
    }

    return TEXT_EXTENSIONS.has(extname(name)) ? [path] : [];
  });
}

const files = collect(resolve(process.cwd(), 'src')).map((path) => ({
  path,
  source: readFileSync(path, 'utf8'),
}));
const styles = files.filter((file) => file.path.endsWith('.css') || file.path.endsWith('.astro'));

describe('anti-slop contract', () => {
  it('ships no em or en dashes anywhere in the source', () => {
    const offenders = files.filter((file) => /[–—]/.test(file.source)).map((file) => file.path);
    expect(offenders).toEqual([]);
  });

  it('never reaches for the training-data default faces', () => {
    const banned = /(Inter|Space Grotesk|Space Mono|IBM Plex|Fraunces|Playfair|Instrument|DM Sans|DM Serif|Outfit)['",]/;
    const offenders = styles.filter((file) => banned.test(file.source)).map((file) => file.path);
    expect(offenders).toEqual([]);
  });

  it('keeps gradient text and decorative glass off the landing', () => {
    const landing = files.filter((file) => /landing\.css|global\.css|index\.astro|Glyph|CommandPalette/.test(file.path));

    for (const file of landing) {
      expect(file.source).not.toMatch(/background-clip:\s*text/);
      expect(file.source).not.toMatch(/backdrop-filter/);
      expect(file.source).not.toMatch(/#000\b|#000000/);
    }
  });

  it('keeps one sharp corner system on the landing', () => {
    const landing = files.filter((file) => /landing\.css|global\.css|Glyph|CommandPalette/.test(file.path));

    for (const file of landing) {
      expect(file.source).not.toMatch(/border-radius:\s*(?!0[;\s])\S/);
    }
  });

  it('uses one icon family', () => {
    const icons = files.find((file) => file.path.endsWith('src/lib/icons.ts'));
    const imports = icons?.source.match(/from '([^']+)'/g) ?? [];

    expect(imports.length).toBeGreaterThan(0);
    expect(imports.every((line) => line.includes('@phosphor-icons/core/'))).toBe(true);
  });
});
