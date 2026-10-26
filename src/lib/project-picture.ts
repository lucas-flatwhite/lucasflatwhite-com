/** Content collection ids keep a trailing `.md`; pictures are keyed by that stem. */
export function pictureForId(
  pictures: Readonly<Record<string, string>>,
  id: string,
): string | undefined {
  const stem = id.endsWith('.md') ? id.slice(0, -3) : id;
  return Object.hasOwn(pictures, stem) ? pictures[stem] : undefined;
}
