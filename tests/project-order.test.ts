import { describe, expect, it } from 'vitest';
import { placeProjects, sortFeaturedProjects } from '../src/lib/projects';

const project = (
  title: string,
  order: number,
  featured = true,
  ...rest: [] | [{ alt: string } | undefined]
) => ({
  data: {
    title,
    order,
    featured,
    // A default parameter would replace an explicit undefined, so omitted art is filled here.
    art: rest.length === 0 ? { alt: title } : rest[0],
  },
});

describe('sortFeaturedProjects', () => {
  it('puts the highest order first and breaks ties by title', () => {
    const projects = [
      project('Third', 1),
      project('Hidden', 9, false),
      project('First', 3),
      project('Second', 2),
      project('Also two', 2),
    ];

    expect(sortFeaturedProjects(projects).map((entry) => entry.data.title)).toEqual([
      'First',
      'Also two',
      'Second',
      'Third',
    ]);
  });
});

describe('placeProjects', () => {
  it('keeps a featured project without art in the menu only', () => {
    const placed = placeProjects([
      project('Shown', 1),
      project('Draft', 5, true, undefined),
      project('Secret', 4, false),
    ]);

    expect(placed.palette.map((entry) => entry.data.title)).toEqual(['Draft', 'Shown']);
    expect(placed.lead.map((entry) => entry.data.title)).toEqual(['Shown']);
    expect(placed.rest).toEqual([]);
  });

  it('gives the first two pictured projects the lead slots', () => {
    const placed = placeProjects([
      project('One', 1),
      project('Two', 2),
      project('Three', 3),
      project('Four', 4),
      project('Five', 5),
    ]);

    expect(placed.lead.map((entry) => entry.data.title)).toEqual(['Five', 'Four']);
    expect(placed.rest.map((entry) => entry.data.title)).toEqual(['Three', 'Two', 'One']);
  });
});
