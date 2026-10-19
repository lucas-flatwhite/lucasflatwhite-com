import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');
const layout = read('src/layouts/BaseLayout.astro');
const landing = read('src/pages/index.astro');
const landingStyles = read('src/styles/landing.css');

// Width and height straight from a PNG's IHDR chunk, so the test sees the file that ships.
function pngSize(publicPath: string) {
  const bytes = readFileSync(resolve(process.cwd(), 'public', publicPath));

  expect(bytes.subarray(1, 4).toString('latin1')).toBe('PNG');
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}

describe('profile picture', () => {
  it('rides along on shared links as an absolute, square image', () => {
    const shareImage = layout.match(/const shareImage = new URL\(withBase\('([^']+)'\), Astro\.site\);/);

    expect(shareImage).not.toBeNull();
    expect(layout).toContain('<meta property="og:image" content={shareImage} />');
    expect(layout).toContain('<meta name="twitter:image" content={shareImage} />');
    // The small card shows the picture as a square beside the title, the way X shows an avatar.
    expect(layout).toContain('<meta name="twitter:card" content="summary" />');

    const { width, height } = pngSize(shareImage![1]);

    expect(width).toBe(height);
    // X drops summary card images smaller than 144px.
    expect(width).toBeGreaterThanOrEqual(144);
  });

  it('sits in the top bar beside the handle, round like the X avatar', () => {
    const mark = landing.match(/<a class="topbar-mark" href="#top">\s*<img class="topbar-avatar" src=\{withBase\('([^']+)'\)\} alt="" width="32" height="32" \/>\s*\{siteProfile\.handle\}\s*<\/a>/);

    expect(mark).not.toBeNull();
    expect(landingStyles).toMatch(/\.topbar-avatar \{[^}]*border-radius: 50%;/);

    const { width, height } = pngSize(mark![1]);

    expect(width).toBe(height);
    // Sharp at 3x for the 32px it is drawn at.
    expect(width).toBeGreaterThanOrEqual(96);
  });

  it('keeps the top bar inside its gutter on the narrowest windows', () => {
    // Measured in Chromium with the avatar: the bar runs past its gutter below 340px at rest,
    // and below 401px while the handle is widened on hover.
    const dropTrigger = landingStyles.match(/@media \(max-width: (\d+)px\) \{\s*\.topbar \.palette-trigger \{\s*display: none;\s*\}\s*\}/);
    const holdHandle = landingStyles.match(/@media \(max-width: (\d+)px\) \{\s*\.topbar-mark:hover \{\s*font-stretch: 80%;\s*\}\s*\}/);

    expect(Number(dropTrigger?.[1])).toBeGreaterThanOrEqual(340);
    expect(Number(holdHandle?.[1])).toBeGreaterThanOrEqual(401);
  });
});
