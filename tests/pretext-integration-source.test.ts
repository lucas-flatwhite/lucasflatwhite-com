import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const packageSource = readFileSync(resolve(process.cwd(), 'package.json'), 'utf8');

describe('pretext integration source contract', () => {
  it('depends on the official pretext package', () => {
    expect(packageSource).toContain('@chenglou/pretext');
  });
});
