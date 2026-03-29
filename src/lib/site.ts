import {
  recommendedCommands,
  type SectionId,
} from '../data/site';

type RecommendedCommand = (typeof recommendedCommands)[number];
type ScrollCommand = Extract<RecommendedCommand, { kind: 'scroll' }>;
type ScrollTarget = ScrollCommand['target'];
type HomepageSection = {
  id: SectionId;
  label: string;
};

export const homepageSections = [
  { id: 'hero', label: 'Intro' },
  { id: 'projects', label: 'Selected Projects' },
  { id: 'links', label: 'Links' },
] as const satisfies readonly HomepageSection[];

function isScrollCommand(
  command: RecommendedCommand,
): command is ScrollCommand {
  return command.kind === 'scroll';
}

export function getSectionIds(): readonly SectionId[] {
  return homepageSections.map((section) => section.id);
}

export function getHomepageSections(): readonly HomepageSection[] {
  return homepageSections.map((section) => ({ ...section }));
}

export function getScrollCommandTargets(): readonly ScrollTarget[] {
  return recommendedCommands
    .filter(isScrollCommand)
    .map((command) => command.target);
}
