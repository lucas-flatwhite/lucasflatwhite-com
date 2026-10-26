import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

describe('generated content types', () => {
  it('loads .astro/types.d.ts before the Astro stub', () => {
    const tsconfig = JSON.parse(read('tsconfig.json')) as { include: string[] };
    expect(tsconfig.include[0]).toBe('.astro/types.d.ts');
  });

  it('calls placeProjects without a CollectionEntry type argument', () => {
    for (const path of ['src/pages/index.astro', 'src/components/CommandPalette.astro']) {
      const source = read(path);
      expect(source).toContain('placeProjects(');
      expect(source).not.toContain('placeProjects<');
      expect(source).not.toContain('CollectionEntry');
    }
  });
});
