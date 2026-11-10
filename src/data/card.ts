/*
 * My business card (BusinessCard.astro). The QR text is upper case so the code stays in
 * alphanumeric mode: at error correction H that fits version 3 (29 by 29 modules), where the
 * lower-case https://lucasflatwhite.com/hi/ needs 33 by 33 and every dot gets smaller.
 * vercel.json sends /HI and /hi to /hi/.
 */
export const CARD_QR_TEXT = 'HTTPS://LUCASFLATWHITE.COM/HI';

/** The words on the card. The name, the Korean name and the handle come from siteProfile. */
export const card = {
  role: 'Software engineer. Spots problems, then solves them.',
  url: 'lucasflatwhite.com',
  scan: 'Scan',
} as const;
