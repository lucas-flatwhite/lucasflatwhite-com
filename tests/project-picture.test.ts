import { describe, expect, it } from 'vitest';
import { cropPicture, pictureForId } from '../src/lib/project-picture';

const plate = '<svg id="caret"></svg>';
const portrait = '<svg id="strokes"></svg>';
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
    const marked = '<svg preserveAspectRatio="xMidYMid meet" id="caret"></svg>';

    expect(cropPicture(marked)).toBe(marked);
  });

  it('leaves the caret and strokes ids otherwise untouched', () => {
    const caret = '<svg viewBox="0 0 720 480"><rect id="caret" width="14" height="48"/></svg>';
    const strokes = '<svg viewBox="0 0 720 480"><g id="strokes"></g></svg>';

    expect(cropPicture(caret)).toBe(
      '<svg preserveAspectRatio="xMidYMid slice" viewBox="0 0 720 480"><rect id="caret" width="14" height="48"/></svg>',
    );
    expect(cropPicture(strokes)).toBe(
      '<svg preserveAspectRatio="xMidYMid slice" viewBox="0 0 720 480"><g id="strokes"></g></svg>',
    );
  });
});
