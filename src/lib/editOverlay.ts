/**
 * Edit Overlay System
 *
 * Stores user edits at pixel-level resolution, independent of current cell size.
 * This allows edits to be preserved when switching between cell sizes or modes.
 *
 * Key concepts:
 * - Edits are stored in "canvas space" (pixel coordinates)
 * - When cell size changes, edits are re-sampled to the new grid
 * - Uses sparse Map storage (only stores edited pixels)
 */

import { IMAGE_ASCII_CHARS } from "./constants";
import type { CellSize, EditOverlay, EditPixel } from "./types";

/**
 * Create a new empty edit overlay
 * @param width - Width of the overlay in pixels (typically screen width)
 * @param height - Height of the overlay in pixels (typically screen height)
 */
export function createEditOverlay(width: number, height: number): EditOverlay {
  return {
    edits: new Map(),
    width,
    height,
  };
}

/**
 * Generate a coordinate key for the Map
 */
function coordKey(x: number, y: number): string {
  return `${x},${y}`;
}

/**
 * Parse a coordinate key back to x, y
 */
function parseCoordKey(key: string): { x: number; y: number } {
  const [x, y] = key.split(",").map(Number);
  return { x, y };
}

/**
 * Record an edit at a cell position.
 * Converts cell coordinates to pixel coordinates in overlay space.
 *
 * @param overlay - The edit overlay to modify
 * @param cellCol - Column of the cell being edited
 * @param cellRow - Row of the cell being edited
 * @param cellSize - Current cell dimensions
 * @param edit - The edit data to record
 */
export function recordEdit(
  overlay: EditOverlay,
  cellCol: number,
  cellRow: number,
  cellSize: CellSize,
  edit: EditPixel,
): void {
  // Convert cell position to center pixel in overlay space
  const px = Math.floor(cellCol * cellSize.width + cellSize.width / 2);
  const py = Math.floor(cellRow * cellSize.height + cellSize.height / 2);

  // Clamp to overlay bounds
  const clampedX = Math.max(0, Math.min(px, overlay.width - 1));
  const clampedY = Math.max(0, Math.min(py, overlay.height - 1));

  const key = coordKey(clampedX, clampedY);

  // For increment/decrement, we need to accumulate deltas
  if (edit.mode === "increment" || edit.mode === "decrement") {
    const existing = overlay.edits.get(key);
    if (existing && existing.delta !== undefined) {
      // Accumulate delta
      const newDelta = existing.delta + (edit.delta ?? 0);
      overlay.edits.set(key, {
        ...existing,
        delta: newDelta,
      });
    } else if (existing && existing.level !== undefined) {
      // Convert absolute to delta-adjusted
      const newLevel = Math.max(
        0,
        Math.min(
          existing.level + (edit.delta ?? 0),
          IMAGE_ASCII_CHARS.length - 1,
        ),
      );
      overlay.edits.set(key, {
        level: newLevel,
        mode: edit.mode,
      });
    } else {
      // New edit
      overlay.edits.set(key, edit);
    }
  } else {
    // Brush mode - absolute level replaces any existing edit
    overlay.edits.set(key, edit);
  }
}

/**
 * Sample edits for a given cell at the current cell size.
 * Finds all edit pixels that fall within the cell region and composites them.
 *
 * @param overlay - The edit overlay to sample from
 * @param cellCol - Column of the cell to sample
 * @param cellRow - Row of the cell to sample
 * @param cellSize - Current cell dimensions
 * @returns The composited edit for this cell, or null if no edits
 */
export function sampleEditsForCell(
  overlay: EditOverlay,
  cellCol: number,
  cellRow: number,
  cellSize: CellSize,
): EditPixel | null {
  // Calculate the pixel bounds of this cell
  const startX = cellCol * cellSize.width;
  const startY = cellRow * cellSize.height;
  const endX = startX + cellSize.width;
  const endY = startY + cellSize.height;

  // Collect all edits that fall within this cell
  const editsInCell: EditPixel[] = [];

  for (const [key, edit] of overlay.edits) {
    const { x, y } = parseCoordKey(key);
    if (x >= startX && x < endX && y >= startY && y < endY) {
      editsInCell.push(edit);
    }
  }

  if (editsInCell.length === 0) {
    return null;
  }

  // Composite multiple edits into one
  return compositeEdits(editsInCell);
}

/**
 * Composite multiple edits into a single edit.
 * Priority: brush (absolute) > increment/decrement (delta)
 * If multiple brush edits, use the last one.
 * If multiple deltas, sum them.
 */
function compositeEdits(edits: EditPixel[]): EditPixel {
  // Find the most recent brush edit (if any)
  const brushEdits = edits.filter(
    (e) => e.mode === "brush" && e.level !== undefined,
  );
  if (brushEdits.length > 0) {
    // Use the last brush edit as base
    const lastBrush = brushEdits[brushEdits.length - 1];

    // Apply any subsequent delta edits
    const deltaEdits = edits.filter(
      (e) =>
        (e.mode === "increment" || e.mode === "decrement") &&
        e.delta !== undefined,
    );
    const totalDelta = deltaEdits.reduce((sum, e) => sum + (e.delta ?? 0), 0);

    if (totalDelta !== 0 && lastBrush.level !== undefined) {
      return {
        level: Math.max(
          0,
          Math.min(lastBrush.level + totalDelta, IMAGE_ASCII_CHARS.length - 1),
        ),
        mode: "brush",
      };
    }

    return lastBrush;
  }

  // No brush edits - sum all deltas
  const totalDelta = edits.reduce((sum, e) => sum + (e.delta ?? 0), 0);
  return {
    delta: totalDelta,
    mode: totalDelta >= 0 ? "increment" : "decrement",
  };
}

/**
 * Apply an edit to a base level, returning the new current level.
 *
 * @param baseLevel - The original level from the image
 * @param edit - The edit to apply
 * @param maxLevel - Maximum level (typically IMAGE_ASCII_CHARS.length - 1)
 * @returns The new current level
 */
export function applyEditToLevel(
  baseLevel: number,
  edit: EditPixel | null,
  maxLevel: number = IMAGE_ASCII_CHARS.length - 1,
): number {
  if (!edit) {
    return baseLevel;
  }

  if (edit.level !== undefined) {
    // Absolute level from brush mode
    return Math.max(0, Math.min(edit.level, maxLevel));
  }

  if (edit.delta !== undefined) {
    // Delta from increment/decrement
    return Math.max(0, Math.min(baseLevel + edit.delta, maxLevel));
  }

  return baseLevel;
}

/**
 * Clear all edits from the overlay
 */
export function clearOverlay(overlay: EditOverlay): void {
  overlay.edits.clear();
}

/**
 * Get the number of edits in the overlay
 */
export function getEditCount(overlay: EditOverlay): number {
  return overlay.edits.size;
}

/**
 * Check if the overlay has any edits
 */
export function hasEdits(overlay: EditOverlay): boolean {
  return overlay.edits.size > 0;
}

/**
 * Resize the overlay (called when window resizes).
 * Edits are kept but may fall outside new bounds.
 * We don't remove them - they'll just be ignored if outside the grid.
 */
export function resizeOverlay(
  overlay: EditOverlay,
  newWidth: number,
  newHeight: number,
): void {
  overlay.width = newWidth;
  overlay.height = newHeight;
}
