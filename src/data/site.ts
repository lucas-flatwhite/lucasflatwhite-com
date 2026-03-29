export type SectionId = 'hero' | 'projects' | 'links';

export type PrimaryLink = {
  label: string;
  href: string;
  external: boolean;
};

export type RecommendedCommand =
  | {
      id: string;
      label: string;
      description: string;
      kind: 'scroll';
      target: Exclude<SectionId, 'hero'>;
    }
  | {
      id: string;
      label: string;
      description: string;
      kind: 'link';
      href: string;
    };

export const siteProfile = {
  handle: 'lucas.flatwhite',
  name: 'Lucas Flatwhite',
  title: 'Developer who loves flat whites and playful interfaces.',
  intro:
    'I build tools, translations, and small web experiences with a warm terminal-cafe attitude.',
  availability: 'Available for interesting collaborations and experiments.',
} as const;

export const primaryLinks: PrimaryLink[] = [
  {
    label: 'GitHub',
    href: 'https://github.com/lucas-flatwhite/',
    external: true,
  },
  {
    label: 'X',
    href: 'https://x.com/lucas_flatwhite',
    external: true,
  },
  {
    label: 'Projects',
    href: '#projects',
    external: false,
  },
];

export const recommendedCommands: RecommendedCommand[] = [
  {
    id: 'view-projects',
    label: 'view projects',
    description: 'Jump to selected work.',
    kind: 'scroll',
    target: 'projects',
  },
  {
    id: 'open-github',
    label: 'open github',
    description: 'Open the GitHub profile.',
    kind: 'link',
    href: 'https://github.com/lucas-flatwhite/',
  },
  {
    id: 'contact',
    label: 'contact',
    description: 'Jump to links and contact options.',
    kind: 'scroll',
    target: 'links',
  },
];
