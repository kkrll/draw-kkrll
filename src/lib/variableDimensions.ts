/**
 * Variable Cell Dimensions Utilities
 *
 * Handles generation and lookup for variable-sized cells in Palette mode.
 * Each column can have a different width, each row a different height.
 */

import type { CellSizeRange, VariableCellDimensions } from "./types";

/**
 * Generate random column widths and row heights within the given ranges.
 * Fills the canvas completely, clamping the last column/row as needed.
 */
export function generateVariableDimensions(
  canvasWidth: number,
  canvasHeight: number,
  range: CellSizeRange
): VariableCellDimensions {
  const columnWidths: number[] = [];
  const rowHeights: number[] = [];

  // Generate random column widths until we fill the canvas width
  let x = 0;
  while (x < canvasWidth) {
    const width = randomInRange(range.minWidth, range.maxWidth);
    const remaining = canvasWidth - x;
    // Clamp last column to not exceed canvas
    columnWidths.push(Math.min(width, remaining));
    x += width;
  }

  // Generate random row heights until we fill the canvas height
  let y = 0;
  while (y < canvasHeight) {
    const height = randomInRange(range.minHeight, range.maxHeight);
    const remaining = canvasHeight - y;
    // Clamp last row to not exceed canvas
    rowHeights.push(Math.min(height, remaining));
    y += height;
  }

  // Calculate cumulative offsets for fast lookup
  const columnOffsets = calculateOffsets(columnWidths);
  const rowOffsets = calculateOffsets(rowHeights);

  return { columnWidths, rowHeights, columnOffsets, rowOffsets };
}

/**
 * Generate a random integer in the range [min, max] inclusive.
 */
function randomInRange(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Calculate cumulative offsets from an array of sizes.
 * offsets[i] = sum of sizes[0..i-1], so offsets[0] = 0.
 */
function calculateOffsets(sizes: number[]): number[] {
  const offsets: number[] = [0];
  for (let i = 0; i < sizes.length - 1; i++) {
    offsets.push(offsets[i] + sizes[i]);
  }
  return offsets;
}

/**
 * Binary search to find which column contains pixel x.
 * Returns the column index (0-based).
 */
export function findColumnAtX(
  x: number,
  columnOffsets: number[]
): number {
  let low = 0;
  let high = columnOffsets.length - 1;

  while (low < high) {
    const mid = Math.floor((low + high + 1) / 2);
    if (columnOffsets[mid] <= x) {
      low = mid;
    } else {
      high = mid - 1;
    }
  }

  return low;
}

/**
 * Binary search to find which row contains pixel y.
 * Returns the row index (0-based).
 */
export function findRowAtY(
  y: number,
  rowOffsets: number[]
): number {
  let low = 0;
  let high = rowOffsets.length - 1;

  while (low < high) {
    const mid = Math.floor((low + high + 1) / 2);
    if (rowOffsets[mid] <= y) {
      low = mid;
    } else {
      high = mid - 1;
    }
  }

  return low;
}

/**
 * Default range settings for Palette mode.
 * When min === max, cells are uniform (equal mode).
 */
export const DEFAULT_CELL_SIZE_RANGE: CellSizeRange = {
  minWidth: 8,
  maxWidth: 8,
  minHeight: 8,
  maxHeight: 8,
};
