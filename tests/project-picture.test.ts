import { describe, expect, it } from 'vitest';
import { pictureForId } from '../src/lib/project-picture';

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
