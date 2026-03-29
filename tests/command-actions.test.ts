import { describe, expect, it } from 'vitest';
import { resolveCommandAction } from '../src/lib/command-actions';
import type { RecommendedCommand } from '../src/data/site';

describe('resolveCommandAction', () => {
  it('resolves scroll commands to in-page anchors', () => {
    const command: RecommendedCommand = {
      id: 'view-projects',
      label: 'view projects',
      description: 'Jump to selected work.',
      kind: 'scroll',
      target: 'projects',
    };

    expect(resolveCommandAction(command, ['hero', 'projects', 'links'])).toEqual({
      kind: 'scroll',
      value: '#projects',
    });
  });

  it('rejects scroll commands that point to missing sections', () => {
    const command: RecommendedCommand = {
      id: 'contact',
      label: 'contact',
      description: 'Jump to links and contact options.',
      kind: 'scroll',
      target: 'links',
    };

    expect(() => resolveCommandAction(command, ['hero', 'projects'])).toThrow(
      'Unknown section target: links',
    );
  });
});
