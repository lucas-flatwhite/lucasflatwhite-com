/// <reference path="./subset-font.d.ts" />
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import subsetFont from 'subset-font';

/*
 * A picture shown through <img> can't reach the page's fonts, so the portrait carries its
 * own: the site's Anybody (both axes, since every word swells in weight and width) and the
 * Noto Sans KR pieces its Hangul falls in, each cut down to the characters actually set.
 */

const fontsource = (path: string) =>
  fileURLToPath(new URL(`../../node_modules/@fontsource-variable/${path}`, import.meta.url));
const ANYBODY = fontsource('anybody/files/anybody-latin-standard-normal.woff2');
const NOTO_CSS = fontsource('noto-sans-kr/wght.css');
/* Anybody draws the Latin; anything from Hangul Jamo up falls through to Noto Sans KR. */
const HANGUL_FROM = 0x1100;

const decode = (text: string) => text.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');

/** Every character set in the SVG's text, once each in code point order, with the space. */
export function usedText(svg: string): string {
  const text = [...svg.matchAll(/<text\b[^>]*>([\s\S]*?)<\/text>/g)]
    .map(([, inner]) => decode(inner.replace(/<[^>]+>/g, '')))
    .join('');
  const chars = [...new Set([...text, ' '])];

  return chars.sort((a, b) => (a.codePointAt(0) ?? 0) - (b.codePointAt(0) ?? 0)).join('');
}

type Piece = { file: string; range: string; spans: [number, number][] };

/* fontsource splits Noto Sans KR into ~120 pieces by unicode-range; wght.css lists them. */
function notoPieces(): Piece[] {
  const css = readFileSync(NOTO_CSS, 'utf8');

  return [...css.matchAll(/url\(\.\/files\/([^)]+\.woff2)\)[^}]*?unicode-range:\s*([^;]+);/g)].map(([, file, range]) => ({
    file,
    range: range.trim(),
    spans: range.split(',').map((part) => {
      const [from, to = from] = part.trim().replace(/^U\+/i, '').split('-');
      return [parseInt(from, 16), parseInt(to, 16)] as [number, number];
    }),
  }));
}

async function face(file: string, text: string, descriptors: string): Promise<string> {
  const woff2 = await subsetFont(readFileSync(file), text, { targetFormat: 'woff2' });
  return `@font-face{${descriptors};src:url(data:font/woff2;base64,${woff2.toString('base64')}) format('woff2')}`;
}

/** The SVG with a <style> of subset, embedded faces as its first child. */
export async function embedFonts(svg: string): Promise<string> {
  const text = usedText(svg);
  const hangul = [...text].filter((char) => (char.codePointAt(0) ?? 0) >= HANGUL_FROM);
  const rules = [await face(ANYBODY, text, "font-family:'Anybody';font-weight:100 900;font-stretch:50% 150%")];

  for (const piece of notoPieces()) {
    const inPiece = hangul.filter((char) => {
      const code = char.codePointAt(0) ?? 0;
      return piece.spans.some(([from, to]) => code >= from && code <= to);
    });

    if (inPiece.length > 0) {
      rules.push(
        await face(
          fontsource(`noto-sans-kr/files/${piece.file}`),
          inPiece.join(''),
          `font-family:'Noto Sans KR';font-weight:100 900;unicode-range:${piece.range}`,
        ),
      );
    }
  }

  return svg.replace(/^(<svg\b[^>]*>)/, `$1<style>${rules.join('')}</style>`);
}
