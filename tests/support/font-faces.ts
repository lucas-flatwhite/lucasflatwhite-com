/** Reads the @font-face rules an SVG carries in its <style>, for tests that check what it embeds. */
export type Face = {
  family: string;
  rule: string;
  ranges: [number, number][];
};

export function fontFaces(svg: string): Face[] {
  return [...svg.matchAll(/@font-face\{([^}]*)\}/g)].map(([, rule]) => {
    const family = rule.match(/font-family:'([^']+)'/)?.[1] ?? '';
    const range = rule.match(/unicode-range:([^;]+)/)?.[1] ?? '';
    const ranges = range
      .split(',')
      .filter(Boolean)
      .map((part) => {
        const [from, to = from] = part.trim().replace(/^U\+/i, '').split('-');
        return [parseInt(from, 16), parseInt(to, 16)] as [number, number];
      });

    return { family, rule, ranges };
  });
}

export function covers(faces: Face[], char: string): boolean {
  const code = char.codePointAt(0) ?? 0;
  return faces.some((face) => face.ranges.some(([from, to]) => code >= from && code <= to));
}
