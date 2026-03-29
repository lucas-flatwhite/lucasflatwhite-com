export type HomepageSection = {
  id: string;
  label: string;
};

export const homepageSections = [
  { id: 'hero', label: 'Intro' },
  { id: 'projects', label: 'Selected Projects' },
  { id: 'links', label: 'Links' },
] as const satisfies readonly HomepageSection[];

export type SectionId = (typeof homepageSections)[number]['id'];

export const sectionIds = homepageSections.map(
  (section) => section.id,
) as readonly SectionId[];

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
  heroTitle: '/lucas-flatwhite',
  heroTagline: 'Building calm, useful things on the web.',
  title: 'Developer building tools, translations, and useful web experiences.',
  intro:
    'I build tools, translations, and small web experiences with a clear, terminal-forward feel.',
  availability: 'Available for interesting collaborations and experiments.',
} as const;

export const primaryLinks = [
  {
    label: 'Projects',
    href: '#projects',
    external: false,
  },
  {
    label: 'GitHub',
    href: 'https://github.com/lucas-flatwhite/',
    external: true,
  },
  {
    label: 'Contact',
    href: '#links',
    external: false,
  },
] as const satisfies readonly PrimaryLink[];

export const footerLinks = [
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
] as const satisfies readonly PrimaryLink[];

export const recommendedCommands = [
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
] as const satisfies readonly RecommendedCommand[];
