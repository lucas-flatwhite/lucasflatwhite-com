import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const footerLinksSource = readFileSync(
  resolve(process.cwd(), 'src/components/FooterLinks.astro'),
  'utf8',
);

describe('FooterLinks source contract', () => {
  it('conditions external link attributes on link.external', () => {
    expect(footerLinksSource).toContain(
      "target={link.external ? '_blank' : undefined}",
    );
    expect(footerLinksSource).toContain(
      "rel={link.external ? 'noreferrer' : undefined}",
    );
    expect(footerLinksSource).not.toContain('target="_blank"');
    expect(footerLinksSource).not.toContain('rel="noreferrer"');
  });
});
