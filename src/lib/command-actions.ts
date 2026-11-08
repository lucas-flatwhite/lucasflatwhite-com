import { book } from '../data/book';
import { siteLinks } from '../data/links';
import { BOOK_HASH } from './book';
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
 * Builds the command menu: sections, the book, featured projects, the arcade, then every link.
 * The book opens on the homepage from its address, so the arcade lobby's menu opens it too.
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
    {
      id: 'book',
      label: book.name,
      hint: 'My book on working with Claude',
      icon: 'book-open',
      href: `${home}${BOOK_HASH}`,
      external: false,
      copy: null,
    },
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

/** A command as `/commands.json` publishes it for pages served from other projects. */
export type PublicCommand = Omit<PaletteCommand, 'icon'> & {
  /** The `d` of each path in the command's Phosphor regular glyph, on a 256 by 256 box. */
  icon: string[];
};

export const PUBLIC_COMMANDS_VERSION = 1;

/** Pulls each path's `d` out of a Phosphor SVG, so a reader draws it without parsing markup. */
export function svgPaths(svg: string): string[] {
  return [...svg.matchAll(/<path\b[^>]*\sd="([^"]+)"/g)].map((match) => match[1]!);
}

/**
 * The menu as other pages read it: every href made absolute against `origin`, and each
 * icon as path data, since the reader is on another deployment with its own base.
 */
export function toPublicCommands(
  commands: readonly PaletteCommand[],
  origin: string | URL,
  iconSvg: (name: IconName) => string,
): { version: number; commands: PublicCommand[] } {
  return {
    version: PUBLIC_COMMANDS_VERSION,
    commands: commands.map((command) => ({
      ...command,
      href: new URL(command.href, origin).href,
      icon: svgPaths(iconSvg(command.icon)),
    })),
  };
}
