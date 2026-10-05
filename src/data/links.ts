import type { IconName } from '../lib/icons';

/**
 * The verb a glyph performs on hover or focus. Add a new motion here and a matching
 * `[data-motion='...']` rule in Glyph.astro when a new kind of link needs one.
 */
export type GlyphMotion = 'commit' | 'cross' | 'lift';

export type SiteLink = {
  id: string;
  label: string;
  handle: string;
  href: string;
  blurb: string;
  icon: IconName;
  motion: GlyphMotion;
  /** Featured links sit in the first viewport; every link appears in the footer and the command menu. */
  featured: boolean;
  /** The icon already spells the service name (X), so the handle is shown in its place. */
  wordmark?: boolean;
};

export const siteLinks = [
  {
    id: 'github',
    label: 'GitHub',
    handle: 'lucas-flatwhite',
    href: 'https://github.com/lucas-flatwhite',
    blurb: 'Code for my tools, translations, and this site.',
    icon: 'github-logo',
    motion: 'commit',
    featured: true,
    wordmark: false,
  },
  {
    id: 'x',
    label: 'X',
    handle: '@lucas_flatwhite',
    href: 'https://x.com/lucas_flatwhite',
    blurb: 'Short notes while I build.',
    icon: 'x-logo',
    motion: 'cross',
    featured: true,
    wordmark: true,
  },
] as const satisfies readonly SiteLink[];

export const featuredLinks = siteLinks.filter((link) => link.featured);
