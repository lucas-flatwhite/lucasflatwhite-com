import { describe, expect, it } from 'vitest';
import {
  primaryLinks,
  recommendedCommands,
  siteProfile,
} from '../src/data/site';
import {
  getHomepageSections,
  getSectionIds,
  getScrollCommandTargets,
} from '../src/lib/site';

describe('site data', () => {
  it('exposes the expected homepage sections', () => {
    expect(getSectionIds()).toEqual(['hero', 'projects', 'links']);
  });

  it('returns isolated section ids to callers', () => {
    const sectionIds = getSectionIds() as string[];
    sectionIds.pop();

    expect(getSectionIds()).toEqual(['hero', 'projects', 'links']);
  });

  it('keeps the homepage section order stable', () => {
    expect(getHomepageSections()).toEqual([
      { id: 'hero', label: 'Intro' },
      { id: 'projects', label: 'Selected Projects' },
      { id: 'links', label: 'Links' },
    ]);
  });

  it('keeps primary links unique and non-empty', () => {
    const hrefs = primaryLinks.map((link) => link.href);
    expect(new Set(hrefs).size).toBe(hrefs.length);
    expect(primaryLinks.every((link) => link.label.length > 0)).toBe(true);
  });

  it('keeps scroll commands aligned with section ids', () => {
    const validSectionIds = new Set(getSectionIds());
    expect(
      getScrollCommandTargets().every((target) => validSectionIds.has(target)),
    ).toBe(true);
  });

  it('keeps the profile copy populated', () => {
    expect(siteProfile.handle).toBe('lucas.flatwhite');
    expect(siteProfile.title.length).toBeGreaterThan(10);
  });

  it('keeps command ids unique', () => {
    const ids = recommendedCommands.map((command) => command.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('keeps every command description populated for accessibility and clarity', () => {
    expect(recommendedCommands.every((command) => command.description.length > 8)).toBe(true);
  });
});
