import { siteLinks } from '../data/links';
import type { SectionId } from '../data/site';
import type { IconName } from './icons';
import { compareByOrder } from './projects';

export type PaletteCommand = {
  id: string;
  label: string;
  hint: string;
  icon: IconName;
  href: string;
  external: boolean;
  /** What choosing the command copies instead of following `href`, or null. */
  copy: string | null;
};

export type PaletteProject = {
  id: string;
  title: string;
  tags: readonly string[];
  href: string;
  order: number;
  featured: boolean;
};

type SectionCommand = {
  id: string;
  label: string;
  hint: string;
  icon: IconName;
  section: SectionId;
};

const sectionCommands: readonly SectionCommand[] = [
  { id: 'work', label: 'Work', hint: 'Things I have built', icon: 'hammer', section: 'work' },
];

/**
 * Builds the command menu: sections, featured projects, the arcade, then every link.
 * `home` is the landing page URL (base-aware), so section jumps carry the deploy base.
 */
export function buildPaletteCommands(
  home: string,
  arcadeHref: string,
  availableSections: readonly SectionId[],
  projects: readonly PaletteProject[] = [],
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
      copy: null,
    };
  });

  const projectCommands = projects
    .filter((project) => project.featured)
    .sort(compareByOrder)
    .map((project) => ({
      id: `project-${project.id}`,
      label: project.title,
      hint: project.tags.join(', '),
      icon: 'arrow-up-right' as const,
      href: project.href,
      external: true,
      copy: null,
    }));

  return [
    ...sections,
    ...projectCommands,
    {
      id: 'arcade',
      label: 'Arcade',
      hint: 'Small games, starting with Snake',
      icon: 'game-controller',
      href: arcadeHref,
      external: false,
      copy: null,
    },
    ...siteLinks.map((link) => ({
      id: link.id,
      label: link.label,
      hint: link.handle,
      icon: link.icon,
      href: link.href,
      external: link.copy === null,
      copy: link.copy,
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
