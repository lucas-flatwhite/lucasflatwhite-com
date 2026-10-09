import { describe, expect, it } from 'vitest';
import { featuredLinks, siteLinks } from '../src/data/links';
import { homepageSections, identityLinks, sectionIds, siteProfile } from '../src/data/site';
import { icons } from '../src/lib/icons';
import { getHomepageSections, getSectionIds } from '../src/lib/site';

const wordCount = (text: string) => text.trim().split(/\s+/).length;

describe('site data', () => {
  it('exposes the landing sections in reading order', () => {
    expect(getSectionIds()).toEqual(['top', 'work', 'play']);
    expect(sectionIds).toEqual(['top', 'work', 'play']);
    expect(getHomepageSections()).toEqual([...homepageSections]);
  });

  it('returns isolated section ids to callers', () => {
    const ids = getSectionIds() as string[];
    ids.pop();

    expect(getSectionIds()).toEqual(['top', 'work', 'play']);
  });

  it('keeps the profile English first with the Korean name alongside', () => {
    expect(siteProfile.name).toBe('Lucas Flatwhite');
    expect(siteProfile.nameKo).toBe('루카스 플랫화이트');
    expect(wordCount(siteProfile.intro)).toBeLessThanOrEqual(20);
  });
});

describe('site links', () => {
  it('links GitHub and X, both featured', () => {
    expect(siteLinks.map((link) => link.id)).toEqual(['github', 'x']);
    expect(featuredLinks.map((link) => link.id)).toEqual(['github', 'x']);
  });

  it('keeps every link unique, secure, iconed and briefly described', () => {
    const ids = siteLinks.map((link) => link.id);
    const hrefs = siteLinks.map((link) => link.href);

    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(hrefs).size).toBe(hrefs.length);

    for (const link of siteLinks) {
      expect(link.href.startsWith('https://')).toBe(true);
      expect(Object.keys(icons)).toContain(link.icon);
      expect(['commit', 'cross', 'lift']).toContain(link.motion);
      expect(link.blurb.length).toBeGreaterThan(8);
      expect(wordCount(link.blurb)).toBeLessThanOrEqual(20);
    }
  });

  it('shares the featured links with the game strip', () => {
    expect(identityLinks).toEqual(featuredLinks.map(({ label, href }) => ({ label, href })));
  });
});
