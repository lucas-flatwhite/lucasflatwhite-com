import { siteLinks } from '../data/links';
import type { SectionId } from '../data/site';
import type { IconName } from './icons';

export type PaletteCommand = {
  id: string;
  label: string;
  hint: string;
  icon: IconName;
  href: string;
  external: boolean;
};

type SectionCommand = {
  id: string;
  label: string;
  hint: string;
  icon: IconName;
  section: SectionId;
};

const sectionCommands: readonly SectionCommand[] = [
  { id: 'work', label: 'Work', hint: 'Translation projects', icon: 'translate', section: 'work' },
];

/**
 * Builds the command menu from the site's sections, the game page and every link.
 * `home` is the landing page URL (base-aware) so section jumps work from /play too.
 */
export function buildPaletteCommands(
  home: string,
  playHref: string,
  availableSections: readonly SectionId[],
): PaletteCommand[] {
  const sections = sectionCommands.map((command) => {
    if (!availableSections.includes(command.section)) {
      throw new Error(`Unknown section target: ${command.section}`);
    }

    return {
      id: command.id,
      label: command.label,
      hint: command.hint,
      icon: command.icon,
      href: `${home}#${command.section}`,
      external: false,
    };
  });

  return [
    ...sections,
    {
      id: 'play',
      label: 'Play',
      hint: 'Snake, in a field of words',
      icon: 'game-controller',
      href: playHref,
      external: false,
    },
    ...siteLinks.map((link) => ({
      id: link.id,
      label: link.label,
      hint: link.handle,
      icon: link.icon,
      href: link.href,
      external: true,
    })),
  ];
}

/** Case-insensitive match on label and hint; an empty query keeps everything. */
export function filterPaletteCommands(
  commands: readonly PaletteCommand[],
  query: string,
): PaletteCommand[] {
  const needle = query.trim().toLowerCase();

  if (!needle) {
    return [...commands];
  }

  return commands.filter((command) =>
    `${command.label} ${command.hint}`.toLowerCase().includes(needle),
  );
}
