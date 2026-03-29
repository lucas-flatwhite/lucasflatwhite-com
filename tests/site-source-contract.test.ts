import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const siteLibSource = readFileSync(
  resolve(process.cwd(), 'src/lib/site.ts'),
  'utf8',
);

describe('site library source contract', () => {
  it('derives homepage sections from the canonical site data', () => {
    expect(siteLibSource).toContain('homepageSections');
    expect(siteLibSource).toContain("from '../data/site';");
    expect(siteLibSource).not.toContain("id: 'hero'");
    expect(siteLibSource).not.toContain("id: 'projects'");
    expect(siteLibSource).not.toContain("id: 'links'");
  });
});
