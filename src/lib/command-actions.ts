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
  /** What choosing the command copies instead of following `href`, or null. */
  copy: string | null;
};

type SectionCommand = {
  id: string;
  label: string;
  hint: string;
  icon: IconName;
  section: SectionId;
};

/** A project from the content collection, as much of it as the menu shows. */
export type PaletteProject = {
  slug: string;
  title: string;
  href: string;
  tags: readonly string[];
};

const sectionCommands: readonly SectionCommand[] = [
  { id: 'work', label: 'Work', hint: 'Things I have built', icon: 'hammer', section: 'work' },
];

/**
 * Builds the command menu from the site's sections, each project, the game page and every
 * link. `home` is the landing page URL (base-aware) so section jumps work from /play too.
 */
export function buildPaletteCommands(
  home: string,
  playHref: string,
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

  // The tags are the hint, so a project is found by what it is made with as well as by name.
  const projectCommands = projects.map((project): PaletteCommand => ({
    id: `project-${project.slug}`,
    label: project.title,
    hint: project.tags.join(', '),
    icon: 'hammer',
    href: project.href,
    external: true,
    copy: null,
  }));

  return [
    ...sections,
    ...projectCommands,
    {
      id: 'play',
      label: 'Play',
      hint: 'Snake, in a field of words',
      icon: 'game-controller',
      href: playHref,
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
