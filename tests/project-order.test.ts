import { describe, expect, it } from 'vitest';
import { sortFeaturedProjects } from '../src/lib/projects';

describe('sortFeaturedProjects', () => {
  it('keeps featured projects ordered by the numeric order field', () => {
    const projects = [
      { data: { title: 'Third', featured: true, order: 3 } },
      { data: { title: 'Hidden', featured: false, order: 0 } },
      { data: { title: 'First', featured: true, order: 1 } },
      { data: { title: 'Second', featured: true, order: 2 } }
    ];

    expect(sortFeaturedProjects(projects).map((entry) => entry.data.title)).toEqual([
      'First',
      'Second',
      'Third'
    ]);
  });
});
