import {
  homepageSections,
  recommendedCommands,
  type SectionId,
} from '../data/site';

type RecommendedCommand = (typeof recommendedCommands)[number];
type ScrollCommand = Extract<RecommendedCommand, { kind: 'scroll' }>;
type ScrollTarget = ScrollCommand['target'];
type HomepageSection = (typeof homepageSections)[number];

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
