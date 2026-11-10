import { describe, expect, it } from 'vitest';
import { workLetters } from '../src/data/work';
import { workLetterLanguage } from '../src/lib/work-letter';

describe('work letter language', () => {
  it.each(['ko', 'ko-KR', 'KO-kr'])('uses Korean for %s', (language) => {
    expect(workLetterLanguage(language)).toBe('ko');
  });
  it.each(['en-US', 'ja-JP', 'fr', '', 'kok-IN'])('uses English for %s', (language) => {
    expect(workLetterLanguage(language)).toBe('en');
  });
  it('translates the entire letter and its controls', () => {
    expect(workLetters.en.title).toBe('A fresh perspective on insurance');
    expect(workLetters.ko.title).toBe('보험에 대한 새로운 시각');
    for (const letter of Object.values(workLetters)) {
      expect(letter.turns).toHaveLength(3);
      expect(letter.pledge.filter(([, marked]) => marked)).toHaveLength(5);
      expect(letter.close).toBeTruthy();
      expect(letter.replay).toBeTruthy();
    }
  });
});
