import { describe, expect, it } from 'vitest';
import { siteLinks } from '../src/data/links';
import { buildPaletteCommands, filterPaletteCommands, svgPaths, toPublicCommands } from '../src/lib/command-actions';

const commands = buildPaletteCommands('/', '/arcade/', ['top', 'work']);

describe('command palette commands', () => {
  it('lists sections, the book, the arcade and every link', () => {
    expect(commands.map((command) => command.id)).toEqual([
      'work',
      'book',
      'arcade',
      ...siteLinks.map((link) => link.id),
    ]);
  });

  it('resolves section jumps against the landing page so they keep the deploy base', () => {
    const base = buildPaletteCommands('/lucasflatwhite-com/', '/lucasflatwhite-com/arcade/', ['top', 'work']);

    expect(base.find((command) => command.id === 'work')?.href).toBe('/lucasflatwhite-com/#work');
    expect(base.find((command) => command.id === 'arcade')?.href).toBe('/lucasflatwhite-com/arcade/');
  });

  it('opens the book on the homepage, from the address the homepage reads', () => {
    expect(commands.find((command) => command.id === 'book')).toEqual({
      id: 'book',
      label: 'Claude, Made Easy',
      hint: 'My book on working with Claude',
      icon: 'book-open',
      href: '/#book',
      external: false,
      copy: null,
    });
    expect(filterPaletteCommands(commands, 'book').map((command) => command.id)).toEqual(['book']);

    const base = buildPaletteCommands('/lucasflatwhite-com/', '/lucasflatwhite-com/arcade/', ['top', 'work']);
    expect(base.find((command) => command.id === 'book')?.href).toBe('/lucasflatwhite-com/#book');
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

  it('sends no two commands to the same address', () => {
    const hrefs = commands.map((command) => command.href);
    expect(new Set(hrefs).size).toBe(hrefs.length);
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
      'book',
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

describe('published commands', () => {
  const svg = '<svg viewBox="0 0 256 256"><path d="M1,2Z"/><path fill="none" d="M3,4Z"/></svg>';
  const published = toPublicCommands(
    buildPaletteCommands('/', '/arcade/', ['top', 'work']),
    'https://lucasflatwhite.com',
    () => svg,
  );

  it('makes every href absolute, so a page on another deployment can follow it', () => {
    expect(published.commands.find((command) => command.id === 'work')?.href).toBe('https://lucasflatwhite.com/#work');
    expect(published.commands.find((command) => command.id === 'arcade')?.href).toBe('https://lucasflatwhite.com/arcade/');
    expect(published.commands.find((command) => command.id === 'book')?.href).toBe('https://lucasflatwhite.com/#book');
    expect(published.commands.find((command) => command.id === 'github')?.href).toBe('https://github.com/lucas-flatwhite');
    expect(published.commands.find((command) => command.id === 'email')?.href).toBe('mailto:lucas.flatwhite@gmail.com');
  });

  it('sends icons as path data rather than markup', () => {
    expect(svgPaths(svg)).toEqual(['M1,2Z', 'M3,4Z']);
    expect(published.commands.every((command) => command.icon.length === 2)).toBe(true);
  });

  it('keeps the same commands, in the same order, as the homepage menu', () => {
    expect(published.version).toBe(1);
    expect(published.commands.map((command) => command.id)).toEqual(commands.map((command) => command.id));
  });
});
