import { siteLinks } from './links';

const x = siteLinks.find((link) => link.id === 'x');

if (!x) {
  throw new Error('Daily Shot needs the X link in src/data/links.ts');
}

/** The Daily Shot card: the AI notes I post every day, opened on my X profile. */
export const dailyShot = {
  title: 'Daily Shot',
  summary: 'One shot of AI, pulled fresh every day.',
  /** The command menu's hint. */
  hint: 'AI notes, poured daily on X',
  href: x.href,
} as const;
