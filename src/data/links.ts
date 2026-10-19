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
  /**
   * The handle is shown in place of the label: X's icon already spells the name and an
   * address says what it is. The label stays for screen readers.
   */
  wordmark?: boolean;
  /** What a click copies instead of following `href`, or null for a link that opens a page. */
  copy: string | null;
};

export const siteLinks = [
  {
    id: 'github',
    label: 'GitHub',
    handle: 'lucas-flatwhite',
    href: 'https://github.com/lucas-flatwhite',
    blurb: 'Source for everything I build, this site included.',
    icon: 'github-logo',
    motion: 'commit',
    featured: true,
    wordmark: false,
    copy: null,
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
    copy: null,
  },
  {
    id: 'email',
    label: 'Email',
    handle: 'lucas.flatwhite@gmail.com',
    // Without script, or where the clipboard is refused, the address opens a mail app.
    href: 'mailto:lucas.flatwhite@gmail.com',
    blurb: 'Click to copy the address.',
    icon: 'envelope',
    motion: 'lift',
    featured: true,
    wordmark: true,
    copy: 'lucas.flatwhite@gmail.com',
  },
] as const satisfies readonly SiteLink[];

export const featuredLinks = siteLinks.filter((link) => link.featured);
