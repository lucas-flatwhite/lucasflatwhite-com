const base = import.meta.env.BASE_URL.endsWith('/')
  ? import.meta.env.BASE_URL
  : `${import.meta.env.BASE_URL}/`;

/** Prefixes a site-relative path with the deploy base (GitHub Pages serves under /<repo>/). */
export function withBase(path = ''): string {
  return `${base}${path.replace(/^\//, '')}`;
}
