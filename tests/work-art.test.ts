import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { gzipSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';
import { fontFaces } from './support/font-faces';

// Guards docs/superpowers/specs/2026-10-20-work-art-design.md: each project in Work is one
// standalone picture that renders through <img> exactly as it was generated.
const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), 'utf8');
const projectsDir = resolve(root, 'src/content/projects');
const projects = readdirSync(projectsDir)
  .filter((name) => name.endsWith('.md'))
  .map((name) => ({ name, source: readFileSync(resolve(projectsDir, name), 'utf8') }))
  .filter((project) => /^featured: true$/m.test(project.source));
const pictures = {
  plate: read('src/assets/work/ai-timeline-log.svg'),
  ripple: read('src/assets/work/lucasflatwhite-com.svg'),
};
// What a visitor who asked for less motion sees: the picture with its motion-only rules removed.
const still = (svg: string) => svg.replace(/@media \(prefers-reduced-motion: no-preference\) \{[\s\S]*?\n\}/g, '');

describe('Work pictures', () => {
  it('gives every project in Work a picture file and a description of it', () => {
    expect(projects.length).toBeGreaterThan(0);

    for (const { name, source } of projects) {
      const art = source.match(/^art:\n {2}image: (.+)\n {2}alt: (.+)$/m);

      expect(art, name).not.toBeNull();
      const image = resolve(projectsDir, art![1].trim());
      expect(dirname(image)).toBe(resolve(root, 'src/assets/work'));
      expect(existsSync(image), name).toBe(true);
      expect(art![2].replace(/^["']|["']$/g, '').trim().length).toBeGreaterThan(0);
    }
  });

  it.each(Object.entries(pictures))('prints the %s as a standalone 720 by 480 document', (_, svg) => {
    expect(svg.startsWith('<svg xmlns="http://www.w3.org/2000/svg"')).toBe(true);
    expect(svg).toContain('viewBox="0 0 720 480"');
    expect(svg).toContain('width="720"');
    expect(svg).toContain('height="480"');
  });

  it.each(Object.entries(pictures))('keeps the %s free of anything an <img> would have to fetch', (_, svg) => {
    expect([...svg.matchAll(/url\(([^)]*)\)/g)].every(([, target]) => /^(?:#|data:)/.test(target))).toBe(true);
    expect([...svg.matchAll(/\b(?:href|src)="([^"]*)"/g)].every(([, target]) => /^(?:#|data:)/.test(target))).toBe(true);
  });

  it('keeps a blinkable caret on the plate', () => {
    expect(pictures.plate).toContain('id="caret"');
  });

  it('marks the ripple picture for inlining and keeps names out of it', () => {
    expect(pictures.ripple).toContain('<g id="ripple">');
    expect(pictures.ripple).not.toMatch(/lucasflatwhite|ChatGPT|<text/i);
    expect(pictures.ripple).not.toMatch(/#1f35b5|#16278a|#0e1a5e/i);
  });

  it('rests the ripple picture on a still crema ring without motion', () => {
    expect(still(pictures.ripple)).not.toMatch(/animation:/);
    expect(still(pictures.ripple)).toMatch(/transform: scale\(1\.35\)/);
    expect(pictures.ripple).toMatch(/animation: ripple-[\w-]+ 6\.4s cubic-bezier\(0\.3, 0\.55, 0\.4, 1\) infinite/);
  });

  it('stays within its weight budget once compressed', () => {
    expect(gzipSync(pictures.plate).length).toBeLessThanOrEqual(40 * 1024);
    expect(gzipSync(pictures.ripple).length).toBeLessThanOrEqual(100 * 1024);
  });

  it('inlines a moving picture and uses an img when a picture does not move', () => {
    const card = read('src/components/ProjectCard.astro');

    expect(card).toContain('set:html={svg}');
    expect(card).toContain('loading="lazy"');
    expect(card).toContain('width={art.image.width}');
    expect(card).toContain('height={art.image.height}');
    expect(read('src/pages/index.astro')).not.toContain('excerpt');
    expect(read('src/styles/landing.css')).not.toContain('excerpt');
  });
});
