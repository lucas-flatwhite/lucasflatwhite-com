import { describe, expect, it } from 'vitest';
import { featuredLinks, siteLinks } from '../src/data/links';
import { homepageSections, sectionIds, siteProfile } from '../src/data/site';
import { icons } from '../src/lib/icons';
import { getHomepageSections, getSectionIds } from '../src/lib/site';

const wordCount = (text: string) => text.trim().split(/\s+/).length;

describe('site data', () => {
  it('exposes the landing sections in reading order', () => {
    expect(getSectionIds()).toEqual(['top', 'work']);
    expect(sectionIds).toEqual(['top', 'work']);
    expect(getHomepageSections()).toEqual([...homepageSections]);
  });

  it('returns isolated section ids to callers', () => {
    const ids = getSectionIds() as string[];
    ids.pop();

    expect(getSectionIds()).toEqual(['top', 'work']);
  });

  it('keeps the profile English first with the Korean name alongside', () => {
    expect(siteProfile.name).toBe('Lucas Flatwhite');
    expect(siteProfile.nameKo).toBe('루카스 플랫화이트');
    expect(wordCount(siteProfile.intro)).toBeLessThanOrEqual(20);
  });
});

describe('site links', () => {
  it('links GitHub, X and email, all featured', () => {
    expect(siteLinks.map((link) => link.id)).toEqual(['github', 'x', 'email']);
    expect(featuredLinks.map((link) => link.id)).toEqual(['github', 'x', 'email']);
  });

  it('names every link by its service, not by a handle', () => {
    expect(siteLinks.map((link) => link.label)).toEqual(['GitHub', 'Twitter', 'Email']);
  });

  it('copies the email address, spells it out in the footer, and falls back to a mailto', () => {
    const email = siteLinks.find((link) => link.id === 'email');

    expect(email?.handle).toBe('lucas.flatwhite@gmail.com');
    expect(email?.copy).toBe(email?.handle);
    expect(email?.href).toBe(`mailto:${email?.copy}`);
    expect(email?.blurb).toContain(email?.handle);
  });

  it('keeps every link unique, secure, iconed and briefly described', () => {
    const ids = siteLinks.map((link) => link.id);
    const hrefs = siteLinks.map((link) => link.href);

    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(hrefs).size).toBe(hrefs.length);

    for (const link of siteLinks) {
      expect(link.href.startsWith(link.copy === null ? 'https://' : 'mailto:')).toBe(true);
      expect(Object.keys(icons)).toContain(link.icon);
      expect(['commit', 'cross', 'lift']).toContain(link.motion);
      expect(link.blurb.length).toBeGreaterThan(8);
      expect(wordCount(link.blurb)).toBeLessThanOrEqual(20);
    }
  });
});
