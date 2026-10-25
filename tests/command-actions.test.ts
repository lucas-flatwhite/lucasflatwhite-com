import { describe, expect, it } from 'vitest';
import { siteLinks } from '../src/data/links';
import { buildPaletteCommands, filterPaletteCommands } from '../src/lib/command-actions';

const commands = buildPaletteCommands('/', '/play/', ['top', 'work', 'play']);
const projects = [
  {
    slug: 'ai-timeline-log',
    title: 'AI Timeline Log',
    href: 'https://www.lucasflatwhite.com/ai-timeline-log',
    tags: ['Astro', 'TypeScript', 'Canvas'],
  },
  {
    slug: 'lucasflatwhite-com',
    title: 'lucasflatwhite.com',
    href: 'https://github.com/lucas-flatwhite/lucasflatwhite-com',
    tags: ['Astro', 'TypeScript', 'Three.js', 'pretext'],
  },
];
const withProjects = buildPaletteCommands('/', '/play/', ['top', 'work', 'play'], projects);

describe('command palette commands', () => {
  it('lists sections, the game and every link', () => {
    expect(commands.map((command) => command.id)).toEqual([
      'work',
      'play',
      ...siteLinks.map((link) => link.id),
    ]);
  });

  it('resolves section jumps against the landing page so they work from /play', () => {
    const base = buildPaletteCommands('/lucasflatwhite-com/', '/lucasflatwhite-com/play/', ['top', 'work', 'play']);

    expect(base.find((command) => command.id === 'work')?.href).toBe('/lucasflatwhite-com/#work');
    expect(base.find((command) => command.id === 'play')?.href).toBe('/lucasflatwhite-com/play/');
  });

  it('opens only the outside links in a new tab', () => {
    expect(commands.filter((command) => command.external).map((command) => command.id)).toEqual([
      'github',
      'x',
    ]);
  });

  it('copies the email address instead of opening it', () => {
    const email = commands.find((command) => command.id === 'email');

    expect(email).toMatchObject({
      label: 'Email',
      hint: 'lucas.flatwhite@gmail.com',
      href: 'mailto:lucas.flatwhite@gmail.com',
      external: false,
      copy: 'lucas.flatwhite@gmail.com',
    });
    expect(commands.filter((command) => command.copy !== null).map((command) => command.id)).toEqual([
      'email',
    ]);
  });

  it('rejects a section command that points at a missing section', () => {
    expect(() => buildPaletteCommands('/', '/play/', ['top'])).toThrow('Unknown section target: work');
  });

  it('keeps ids unique', () => {
    const ids = commands.map((command) => command.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('puts each project right after Work, in the order given', () => {
    expect(withProjects.map((command) => command.id)).toEqual([
      'work',
      'project-ai-timeline-log',
      'project-lucasflatwhite-com',
      'play',
      ...siteLinks.map((link) => link.id),
    ]);
  });

  it('opens a project in a new tab and hints at what it is made with', () => {
    expect(withProjects.find((command) => command.id === 'project-ai-timeline-log')).toMatchObject({
      label: 'AI Timeline Log',
      hint: 'Astro, TypeScript, Canvas',
      icon: 'hammer',
      href: 'https://www.lucasflatwhite.com/ai-timeline-log',
      external: true,
      copy: null,
    });
    expect(filterPaletteCommands(withProjects, 'canvas').map((command) => command.id)).toEqual([
      'project-ai-timeline-log',
    ]);
  });

  it('filters by label or hint, ignoring case and outer space', () => {
    expect(filterPaletteCommands(commands, '  GIT ').map((command) => command.id)).toEqual(['github']);
    expect(filterPaletteCommands(commands, 'snake').map((command) => command.id)).toEqual(['play']);
    expect(filterPaletteCommands(commands, 'mail').map((command) => command.id)).toEqual(['email']);
    expect(filterPaletteCommands(commands, 'gmail').map((command) => command.id)).toEqual(['email']);
    expect(filterPaletteCommands(commands, '')).toHaveLength(commands.length);
    expect(filterPaletteCommands(commands, 'nothing like this')).toEqual([]);
  });
});
