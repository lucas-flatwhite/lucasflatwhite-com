import {
  recommendedCommands,
  sectionIds,
  type SectionId,
} from '../data/site';

type RecommendedCommand = (typeof recommendedCommands)[number];
type ScrollCommand = Extract<RecommendedCommand, { kind: 'scroll' }>;
type ScrollTarget = ScrollCommand['target'];

function isScrollCommand(
  command: RecommendedCommand,
): command is ScrollCommand {
  return command.kind === 'scroll';
}

export function getSectionIds(): readonly SectionId[] {
  return [...sectionIds];
}

export function getScrollCommandTargets(): readonly ScrollTarget[] {
  return recommendedCommands.filter(isScrollCommand).map((command) => command.target);
}
