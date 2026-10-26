import { describe, expect, it } from 'vitest';
import {
  BOARD_SLOTS,
  GAP_NOTES,
  NAME_ROWS,
  boardGaps,
  gapNote,
  placeProjects,
  sortFeaturedProjects,
  stackBoard,
} from '../src/lib/projects';

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
    expect(placed.board.map((entry) => entry.data.title)).toEqual(['Shown']);
  });

  it('boards every pictured project in order', () => {
    const placed = placeProjects([project('One', 1), project('Three', 3), project('Two', 2)]);

    expect(placed.board.map((entry) => entry.data.title)).toEqual(['Three', 'Two', 'One']);
  });
});

describe('boardGaps', () => {
  it('pads the board up to its slot count and never below zero', () => {
    expect(boardGaps(3)).toBe(BOARD_SLOTS - 3);
    expect(boardGaps(BOARD_SLOTS)).toBe(0);
    expect(boardGaps(BOARD_SLOTS + 4)).toBe(0);
  });
});

describe('gapNote', () => {
  it('gives each gap its own line and starts over when they run out', () => {
    const notes = Array.from({ length: GAP_NOTES.length }, (_, index) => gapNote(index));

    expect(new Set(notes).size).toBe(GAP_NOTES.length);
    expect(gapNote(GAP_NOTES.length)).toBe(GAP_NOTES[0]);
  });
});

describe('stackBoard', () => {
  it('reads left to right across the first row', () => {
    const slots = stackBoard(3, 3, 0);

    expect(slots.map((slot) => [slot.column, slot.row])).toEqual([
      [1, 1],
      [2, 1],
      [3, 1],
    ]);
  });

  it('drops each later slot into the shortest column', () => {
    const slots = stackBoard(5, 3, 0);

    // Tall (5), wide (3) and square (4) fill the first row, so the wide column is shortest.
    expect(slots[3]).toEqual({ column: 2, row: 4, span: 4 });
    expect(slots[4]).toEqual({ column: 3, row: 5, span: 5 });
  });

  it('starts the cards beside the name and lands later ones under it', () => {
    const slots = stackBoard(BOARD_SLOTS, 4);

    expect(slots.slice(0, 3).map((slot) => [slot.column, slot.row])).toEqual([
      [2, 1],
      [3, 1],
      [4, 1],
    ]);

    const underName = slots.filter((slot) => slot.column === 1);
    expect(underName.length).toBeGreaterThan(0);
    expect(underName.every((slot) => slot.row > NAME_ROWS)).toBe(true);
  });

  it('never stacks two slots over the same rows of a column', () => {
    for (const columns of [3, 4]) {
      const slots = stackBoard(BOARD_SLOTS, columns);

      for (const [index, slot] of slots.entries()) {
        for (const other of slots.slice(index + 1)) {
          if (other.column !== slot.column) continue;
          expect(other.row >= slot.row + slot.span || slot.row >= other.row + other.span).toBe(true);
        }
      }
    }
  });
});
