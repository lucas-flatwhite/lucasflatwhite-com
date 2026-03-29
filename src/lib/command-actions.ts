import type { RecommendedCommand, SectionId } from '../data/site';

export type CommandAction =
  | {
      kind: 'scroll';
      value: `#${SectionId}`;
    }
  | {
      kind: 'link';
      value: string;
    };

export function resolveCommandAction(
  command: RecommendedCommand,
  availableSections: readonly SectionId[],
): CommandAction {
  if (command.kind === 'scroll') {
    if (!availableSections.includes(command.target)) {
      throw new Error(`Unknown section target: ${command.target}`);
    }

    return {
      kind: 'scroll',
      value: `#${command.target}`,
    };
  }

  return {
    kind: 'link',
    value: command.href,
  };
}
