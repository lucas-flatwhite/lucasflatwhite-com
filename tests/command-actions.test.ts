import { describe, expect, it } from 'vitest';
import { siteLinks } from '../src/data/links';
import { buildPaletteCommands, filterPaletteCommands } from '../src/lib/command-actions';

const commands = buildPaletteCommands('/', '/arcade/', ['top', 'work']);

describe('command palette commands', () => {
  it('lists sections, the arcade and every link', () => {
    expect(commands.map((command) => command.id)).toEqual([
      'work',
      'arcade',
      ...siteLinks.map((link) => link.id),
    ]);
  });

  it('resolves section jumps against the landing page so they keep the deploy base', () => {
    const base = buildPaletteCommands('/lucasflatwhite-com/', '/lucasflatwhite-com/arcade/', ['top', 'work']);

    expect(base.find((command) => command.id === 'work')?.href).toBe('/lucasflatwhite-com/#work');
    expect(base.find((command) => command.id === 'arcade')?.href).toBe('/lucasflatwhite-com/arcade/');
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
    expect(() => buildPaletteCommands('/', '/arcade/', ['top'])).toThrow('Unknown section target: work');
  });

  it('keeps ids unique', () => {
    const ids = commands.map((command) => command.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('filters by label or hint, ignoring case and outer space', () => {
    expect(filterPaletteCommands(commands, '  GIT ').map((command) => command.id)).toEqual(['github']);
    expect(filterPaletteCommands(commands, 'snake').map((command) => command.id)).toEqual(['arcade']);
    expect(filterPaletteCommands(commands, 'mail').map((command) => command.id)).toEqual(['email']);
    expect(filterPaletteCommands(commands, 'gmail').map((command) => command.id)).toEqual(['email']);
    expect(filterPaletteCommands(commands, '')).toHaveLength(commands.length);
    expect(filterPaletteCommands(commands, 'nothing like this')).toEqual([]);
  });
});

describe('project commands', () => {
  const withProjects = buildPaletteCommands('/', '/arcade/', ['top', 'work'], [
    { id: 'old', title: 'Old', tags: ['Astro'], href: 'https://example.com/old', order: 1, featured: true },
    { id: 'new', title: 'New', tags: ['Canvas', 'TypeScript'], href: 'https://example.com/new', order: 3, featured: true },
    { id: 'draft', title: 'Draft', tags: ['Hidden'], href: 'https://example.com/draft', order: 9, featured: false },
    { id: 'mid', title: 'Mid', tags: ['One'], href: 'https://example.com/mid', order: 2, featured: true },
  ]);

  it('lists featured projects between Work and Arcade, highest order first', () => {
    expect(withProjects.map((command) => command.id)).toEqual([
      'work',
      'project-new',
      'project-mid',
      'project-old',
      'arcade',
      'github',
      'x',
      'email',
    ]);
  });

  it('opens a project in a new tab and uses its tags as the hint', () => {
    expect(withProjects.find((command) => command.id === 'project-new')).toMatchObject({
      label: 'New',
      hint: 'Canvas, TypeScript',
      href: 'https://example.com/new',
      external: true,
      copy: null,
      icon: 'arrow-up-right',
    });
  });
});
