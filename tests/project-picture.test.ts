import { describe, expect, it } from 'vitest';
import { cropPicture, pictureForId } from '../src/lib/project-picture';

const plate = '<svg><g id="years"></g></svg>';
const portrait = '<svg><g id="ripple"></g></svg>';
const pictures = {
  'ai-timeline-log': plate,
  'lucasflatwhite-com': portrait,
};

describe('pictureForId', () => {
  it('resolves the plate with or without the markdown suffix', () => {
    expect(pictureForId(pictures, 'ai-timeline-log.md')).toBe(plate);
    expect(pictureForId(pictures, 'ai-timeline-log')).toBe(plate);
  });

  it('resolves the portrait with or without the markdown suffix', () => {
    expect(pictureForId(pictures, 'lucasflatwhite-com.md')).toBe(portrait);
    expect(pictureForId(pictures, 'lucasflatwhite-com')).toBe(portrait);
  });

  it('returns undefined for an unknown id', () => {
    expect(pictureForId(pictures, 'missing.md')).toBeUndefined();
  });
});

describe('cropPicture', () => {
  it('gives a root svg with no aspect ratio the slice crop', () => {
    expect(cropPicture('<svg viewBox="0 0 720 480"></svg>')).toBe(
      '<svg preserveAspectRatio="xMidYMid slice" viewBox="0 0 720 480"></svg>',
    );
  });

  it('leaves a string that already has preserveAspectRatio unchanged', () => {
    const marked = '<svg preserveAspectRatio="xMidYMid meet" id="years"></svg>';

    expect(cropPicture(marked)).toBe(marked);
  });

  it('leaves the ripple and years ids otherwise untouched', () => {
    const ripple = '<svg viewBox="0 0 720 480"><g id="ripple"></g></svg>';
    const years = '<svg viewBox="0 0 720 480"><g id="years"></g></svg>';

    expect(cropPicture(ripple)).toBe('<svg preserveAspectRatio="xMidYMid slice" viewBox="0 0 720 480"><g id="ripple"></g></svg>');
    expect(cropPicture(years)).toBe('<svg preserveAspectRatio="xMidYMid slice" viewBox="0 0 720 480"><g id="years"></g></svg>');
  });

  it('adds the slice crop when only an inner element has preserveAspectRatio', () => {
    const svg = '<svg viewBox="0 0 720 480"><image preserveAspectRatio="none"/></svg>';

    expect(cropPicture(svg)).toBe(
      '<svg preserveAspectRatio="xMidYMid slice" viewBox="0 0 720 480"><image preserveAspectRatio="none"/></svg>',
    );
  });
});
