import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const commandShelfSource = readFileSync(
  resolve(process.cwd(), 'src/components/CommandShelf.astro'),
  'utf8',
);

describe('CommandShelf source contract', () => {
  it('keeps the command panel usable without the hero trigger', () => {
    expect(commandShelfSource).toContain('id="command-menu"');
    expect(commandShelfSource).toContain('class="command-shelf-trigger"');
    expect(commandShelfSource).not.toContain('coffee-trigger');
    expect(commandShelfSource).not.toContain("querySelectorAll('.coffee-trigger')");
  });
});
