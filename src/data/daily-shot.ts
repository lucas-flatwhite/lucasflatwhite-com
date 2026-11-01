import { siteLinks } from './links';

const x = siteLinks.find((link) => link.id === 'x');

if (!x) {
  throw new Error('Daily Shot needs the X link in src/data/links.ts');
}

/**
 * The Daily Shot card: the AI notes I post every day, opened on my X profile. The command menu
 * leaves it out, since its Twitter entry already goes to the same profile.
 */
export const dailyShot = {
  title: 'Daily Shot',
  summary: 'One shot of AI, pulled fresh every day.',
  href: x.href,
} as const;
