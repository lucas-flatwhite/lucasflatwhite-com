import { homepageSections, type SectionId } from '../data/site';

type HomepageSection = (typeof homepageSections)[number];

export function getSectionIds(): readonly SectionId[] {
  return homepageSections.map((section) => section.id);
}

export function getHomepageSections(): readonly HomepageSection[] {
  return homepageSections.map((section) => ({ ...section }));
}
