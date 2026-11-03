import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createNoteFixture } from '../../support/note-fixture.js';
import { assertTableLayout, type CellRectangle } from '../../support/table-layout.js';

function grid(rows: number, columns: number): CellRectangle[] {
  return Array.from({ length: rows * columns }, (_, index) => ({
    x: 10 + (index % columns) * 100,
    y: 20 + Math.floor(index / columns) * 50,
    width: 98,
    height: 48,
  }));
}

test('TABLE-01: title parameters get unique ownership markers without evaluating literal input', () => {
  const literal = 'QA "table" $(touch /tmp/never-run) `literal`';
  const first = createNoteFixture({ QA_NOTE_TITLE: literal });
  const second = createNoteFixture({ QA_NOTE_TITLE: literal });
  assert.ok(first.title.startsWith(`${literal} [appium:`));
  assert.match(first.title, /\[appium:[0-9a-f-]{36}\]$/);
  assert.notEqual(first.title, second.title);
  assert.ok(createNoteFixture({}).title.startsWith('QA 4x4 table [appium:'));
  for (const value of [
    '',
    '   ',
    '${QA_NOTE_TITLE}',
    'prefix ${NAME}',
    'a\nb',
    'a\u200bb',
    'a'.repeat(101),
  ]) {
    assert.throws(() => createNoteFixture({ QA_NOTE_TITLE: value }), /QA_NOTE_TITLE/);
  }
});

test('TABLE-02: the layout oracle accepts a 4×4 native layout independently of node order', () => {
  assert.doesNotThrow(() => assertTableLayout(grid(4, 4).reverse(), 4, 4));
  assert.doesNotThrow(() => assertTableLayout(grid(2, 2), 2, 2));
});

test('TABLE-03: 16 cells do not prove 4×4; reject other shapes and incomplete native exposure', () => {
  assert.throws(() => assertTableLayout(grid(8, 2), 4, 4), /row lengths/);
  assert.throws(() => assertTableLayout(grid(2, 8), 4, 4), /row lengths/);
  assert.throws(() => assertTableLayout(grid(4, 4).slice(1), 4, 4), /observed 15/);
  const duplicate = grid(4, 4);
  duplicate[1] = { ...duplicate[0] };
  assert.throws(() => assertTableLayout(duplicate, 4, 4), /overlapping/);
  const staggered = grid(4, 4);
  staggered[7].x += 10;
  assert.throws(() => assertTableLayout(staggered, 4, 4), /aligned/);
  const empty = grid(4, 4);
  empty[0].width = 0;
  assert.throws(() => assertTableLayout(empty, 4, 4), /empty bounds/);
});
