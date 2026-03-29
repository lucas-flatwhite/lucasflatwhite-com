import { recommendedCommands, type SectionId } from '../data/site';

const sectionIds: SectionId[] = ['hero', 'projects', 'links'];

export function getSectionIds(): SectionId[] {
  return sectionIds;
}

export function getScrollCommandTargets(): string[] {
  return recommendedCommands
    .filter((command) => command.kind === 'scroll')
    .map((command) => command.target);
}
