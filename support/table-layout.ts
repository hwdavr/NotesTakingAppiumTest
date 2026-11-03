export interface CellRectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

// These are current native element bounds, never coordinates from the recording.
export function assertTableLayout(
  cells: CellRectangle[],
  rowCount: number,
  columnCount: number,
): void {
  const fail = (reason: string): never => {
    throw new Error(
      `Cannot prove ${rowCount}×${columnCount} table: ${reason}. ` +
        'The native hierarchy must expose every cell in this single grid; use a viewport ' +
        'that exposes all columns. Clipped/omitted cells are not passing evidence.',
    );
  };
  if (cells.length !== rowCount * columnCount) fail(`observed ${cells.length} cells`);
  if (
    cells.some(
      (cell) => !Object.values(cell).every(Number.isFinite) || cell.width <= 0 || cell.height <= 0,
    )
  ) {
    fail('a cell has missing or empty bounds');
  }

  const tolerance = 2;
  const rows: CellRectangle[][] = [];
  for (const cell of [...cells].sort((a, b) => a.y - b.y || a.x - b.x)) {
    const row = rows.at(-1);
    if (row && Math.abs(cell.y - row[0].y) <= tolerance) row.push(cell);
    else rows.push([cell]);
  }
  if (rows.length !== rowCount || rows.some((row) => row.length !== columnCount)) {
    fail(`observed row lengths [${rows.map((row) => row.length).join(', ')}]`);
  }
  for (const [rowIndex, row] of rows.entries()) {
    row.sort((a, b) => a.x - b.x);
    for (const [columnIndex, cell] of row.entries()) {
      const previous = row[columnIndex - 1];
      if (previous && previous.x + previous.width > cell.x + tolerance) {
        fail('duplicate or overlapping cells in a row');
      }
      const reference = rows[0][columnIndex];
      if (
        Math.abs(reference.x - cell.x) > tolerance ||
        Math.abs(reference.width - cell.width) > tolerance ||
        Math.abs(row[0].height - cell.height) > tolerance
      ) {
        fail('rows do not share aligned columns');
      }
    }
    if (
      rowIndex > 0 &&
      rows[rowIndex - 1][0].y + rows[rowIndex - 1][0].height > row[0].y + tolerance
    ) {
      fail('rows overlap');
    }
  }
}
