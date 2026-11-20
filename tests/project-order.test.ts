import { describe, expect, it } from 'vitest';
import {
  NAME_ROWS,
  PHOTO_ROWS,
  arrangeBoard,
  listOrder,
  placeProjects,
  railOf,
  slotPositionStyle,
  sortFeaturedProjects,
  stackBoard,
  type BoardSlot,
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

describe('arrangeBoard', () => {
  const card = (title: string, slot?: number) => ({ data: { title, slot } });
  const kinds = (slots: BoardSlot<ReturnType<typeof card>>[]) =>
    slots.map((slot) => (slot.kind === 'project' ? slot.entry.data.title : slot.kind));

  it('orders real cards around pins and omits unoccupied positions', () => {
    expect(kinds(arrangeBoard([card('Timeline'), card('Site', 7)]))).toEqual([
      'book', 'Timeline', 'daily', 'arcade', 'work', 'Site',
    ]);
  });

  it('flows around a pin that lands among the first cards', () => {
    expect(kinds(arrangeBoard([card('A'), card('B', 2)]))).toEqual([
      'book', 'B', 'A', 'daily', 'arcade', 'work',
    ]);
  });

  it('orders late pins by number without reserving space between them', () => {
    expect(kinds(arrangeBoard([card('Last', 15), card('Earlier', 8)]))).toEqual([
      'book', 'daily', 'arcade', 'work', 'Earlier', 'Last',
    ]);
  });

  it('refuses two projects pinned to one slot', () => {
    expect(() => arrangeBoard([card('A', 7), card('B', 7)])).toThrow(/slot 7/);
  });
});

describe('slotPositionStyle', () => {
  it.each([3, 4] as const)('positions cards from their column origin on a %i-column board', (columns) => {
    const style = (column: number, row: number) => slotPositionStyle({ column, row, span: 4 }, columns);

    expect(style(1, NAME_ROWS + 1)).toBe(`--c${columns}: 1; --r${columns}: 2; --offset${columns}: 0`);
    expect(style(1, NAME_ROWS + 6)).toContain(`--offset${columns}: 5`);
    expect(style(2, 1)).toBe(`--c${columns}: 2; --r${columns}: 1 / 3; --offset${columns}: 0`);
    expect(style(2, PHOTO_ROWS + 1)).toContain(`--offset${columns}: ${PHOTO_ROWS}`);
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
    const slots = stackBoard(12, 4);

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
      for (const photoRows of [0, PHOTO_ROWS]) {
        const slots = stackBoard(12, columns, NAME_ROWS, photoRows);

        for (const [index, slot] of slots.entries()) {
          for (const other of slots.slice(index + 1)) {
            if (other.column !== slot.column) continue;
            expect(other.row >= slot.row + slot.span || slot.row >= other.row + other.span).toBe(true);
          }
        }
      }
    }
  });

  it('pushes the cards beside the name down under the photos and leaves the last column be', () => {
    const slots = stackBoard(12, 4, NAME_ROWS, PHOTO_ROWS);

    expect(slots.slice(0, 3).map((slot) => [slot.column, slot.row])).toEqual([
      [2, PHOTO_ROWS + 1],
      [3, PHOTO_ROWS + 1],
      [4, 1],
    ]);
  });

  it('keeps every slot off the rows the photos cover', () => {
    for (const columns of [3, 4]) {
      const slots = stackBoard(12, columns, NAME_ROWS, PHOTO_ROWS);
      const underPhotos = slots.filter((slot) => slot.column === 2 || slot.column === 3);

      expect(underPhotos.length).toBeGreaterThan(0);
      expect(underPhotos.every((slot) => slot.row > PHOTO_ROWS)).toBe(true);
    }
  });
});

describe('the rail under the name', () => {
  const card = (title: string, slot?: number) => ({ data: { title, slot } });
  const today = () => arrangeBoard([card('Timeline'), card('terrarium', 6), card('Site', 7)]);
  const label = (slot: BoardSlot<ReturnType<typeof card>>) => (slot.kind === 'project' ? slot.entry.data.title : slot.kind);
  const underName = (slots: BoardSlot<ReturnType<typeof card>>[], columns: number) => {
    const placed = stackBoard(slots.length, columns, NAME_ROWS, PHOTO_ROWS, railOf(slots));

    return placed
      .map((slot, index) => ({ ...slot, name: label(slots[index]) }))
      .filter((slot) => slot.column === 1)
      .sort((left, right) => left.row - right.row);
  };

  it('stands the work badge right under the name on every board', () => {
    for (const columns of [3, 4]) {
      const [work] = underName(today(), columns);

      expect(work).toMatchObject({ name: 'work', row: NAME_ROWS + 1, span: 5 });
    }
  });

  it('keeps the badge there when more projects join the board', () => {
    const slots = arrangeBoard(['A', 'B', 'C', 'D'].map((title) => card(title)));

    for (const columns of [3, 4]) {
      expect(underName(slots, columns)[0].name).toBe('work');
    }
  });

  it('preserves the columns and proportions of the seven cards on the wide board', () => {
    const slots = today();
    const placed = stackBoard(slots.length, 4, NAME_ROWS, PHOTO_ROWS, railOf(slots));
    expect(placed.map(({ column, span }) => [column, span])).toEqual([
      [2, 5], [3, 3], [4, 4], [4, 4], [1, 5], [3, 3], [4, 5],
    ]);
  });

  it('never stacks two slots over the same rows of a column', () => {
    const slots = today();

    for (const columns of [3, 4]) {
      const placed = stackBoard(slots.length, columns, NAME_ROWS, PHOTO_ROWS, railOf(slots));

      for (const [index, slot] of placed.entries()) {
        for (const other of placed.slice(index + 1)) {
          if (other.column !== slot.column) continue;
          expect(other.row >= slot.row + slot.span || slot.row >= other.row + other.span).toBe(true);
        }
      }
    }
  });

  it('lists the book and badge first, then the rest by number', () => {
    const slots = today();

    expect(listOrder(slots).map((index) => label(slots[index]))).toEqual([
      'book', 'work', 'Timeline', 'daily', 'arcade', 'terrarium', 'Site',
    ]);
  });
});
