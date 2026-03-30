import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const indexSource = readFileSync(
  resolve(process.cwd(), 'src/pages/index.astro'),
  'utf8',
);

describe('homepage experience source contract', () => {
  it('boots a dedicated snake experience instead of the old section stack', () => {
    expect(indexSource).toContain("import SnakeExperience from '../components/SnakeExperience.astro';");
    expect(indexSource).toContain('<SnakeExperience />');
    expect(indexSource).not.toContain("import Hero from '../components/Hero.astro';");
    expect(indexSource).not.toContain("import CommandShelf from '../components/CommandShelf.astro';");
    expect(indexSource).not.toContain("import ProjectGrid from '../components/ProjectGrid.astro';");
    expect(indexSource).not.toContain("import FooterLinks from '../components/FooterLinks.astro';");
  });
});
