import { describe, expect, it } from 'vitest';
import { siteLinks } from '../src/data/links';
import { buildPaletteCommands, filterPaletteCommands } from '../src/lib/command-actions';

const commands = buildPaletteCommands('/', '/play/', ['top', 'work', 'play']);

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
    expect(commands.filter((command) => command.external).map((command) => command.id)).toEqual(
      siteLinks.map((link) => link.id),
    );
  });

  it('rejects a section command that points at a missing section', () => {
    expect(() => buildPaletteCommands('/', '/play/', ['top'])).toThrow('Unknown section target: work');
  });

  it('keeps ids unique', () => {
    const ids = commands.map((command) => command.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('filters by label or hint, ignoring case and outer space', () => {
    expect(filterPaletteCommands(commands, '  GIT ').map((command) => command.id)).toEqual(['github']);
    expect(filterPaletteCommands(commands, 'snake').map((command) => command.id)).toEqual(['play']);
    expect(filterPaletteCommands(commands, '')).toHaveLength(commands.length);
    expect(filterPaletteCommands(commands, 'nothing like this')).toEqual([]);
  });
});
