/**
 * Rendering Utilities for HeroAscii
 *
 * Pure functions for rendering cells to canvas.
 * Supports:
 * - ASCII and Dot rendering styles
 * - Dynamic cell sizes
 * - Color mode (original RGB or monochrome)
 * - Light/dark theme inversion
 */

import { DEFAULT_CELL_HEIGHT, DEFAULT_CELL_WIDTH } from "./constants";
import type {
  CellSize,
  CharCell,
  ColorCharCell,
  ColorMode,
  Colors,
  RenderStyle,
} from "./types";

/**
 * Settings that affect how cells are rendered.
 * Stored in a ref in the main component to avoid re-renders.
 */
export interface RenderSettings {
  style: RenderStyle;
  invert: boolean;
  colorMode: ColorMode;
  cellSize: CellSize;
}

/**
 * Create default render settings
 */
export function createDefaultRenderSettings(): RenderSettings {
  return {
    style: "Ascii",
    invert: false,
    colorMode: "monochrome",
    cellSize: { width: DEFAULT_CELL_WIDTH, height: DEFAULT_CELL_HEIGHT },
  };
}

/**
 * Map a level value based on invert setting.
 * In light mode (invert=true), we flip the levels so bright=dark.
 */
export function mapLevel(
  level: number,
  maxLevel: number,
  invert: boolean,
): number {
  return invert ? maxLevel - level : level;
}

/**
 * Check if a cell has color data (is a ColorCharCell)
 */
function hasColorData(cell: CharCell): cell is ColorCharCell {
  return "r" in cell && "g" in cell && "b" in cell;
}

/**
 * Get the fill color for a cell based on color mode
 */
function getCellColor(
  cell: CharCell,
  colorMode: ColorMode,
  fallbackColor: string,
  renderStyle: RenderStyle,
  level: number,
  maxLevel: number
): string {
  if (colorMode === "original" && hasColorData(cell)) {
    return `rgb(${cell.r}, ${cell.g}, ${cell.b})`;
  }
  if (renderStyle === "Palette") {
    if (colorMode === "mixed" && hasColorData(cell)) {
      return `rgb(${cell.r}, ${cell.g}, ${cell.b})`;
    }

    // let color = Math.round((level / maxLevel) * 255);
    let color = cell.isTransparent ? 0 : Math.round((level / maxLevel) * 255);
    return `rgb(${color}, ${color}, ${color})`;
  }
  return fallbackColor;
}

/**
 * Render a dot (circle) at the specified position.
 * Radius is proportional to level.
 */
function renderDot(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  level: number,
  cellSize: CellSize,
  maxLevel: number,
): void {
  // Scale radius based on level and cell size
  // Max radius is half the smaller cell dimension
  const maxRadius = Math.min(cellSize.width, cellSize.height) / 2;
  const radius = (level / maxLevel) * maxRadius;

  if (radius <= 0) return;

  const centerX = x + cellSize.width / 2;
  const centerY = y + cellSize.height / 2;

  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
  ctx.fill();

}

function renderPallete(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  level: number,
  cellSize: CellSize,
  maxLevel: number,
): void {
  if (level <= 0) return
  ctx.fillRect(x, y, cellSize.width, cellSize.height)
}

/**
 * Render an ASCII character at the specified position.
 */
function renderChar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  char: string,
): void {
  ctx.fillText(char || "", x, y);
}

/**
 * Render a single cell to the canvas.
 *
 * @param ctx - Canvas 2D context
 * @param cell - The cell to render (CharCell or ColorCharCell)
 * @param settings - Current render settings
 * @param x - X position in pixels
 * @param y - Y position in pixels
 * @param chars - ASCII character set for level mapping
 * @param colors - Canvas colors (for monochrome mode fallback)
 */
export function renderCell(
  ctx: CanvasRenderingContext2D,
  cell: CharCell,
  settings: RenderSettings,
  x: number,
  y: number,
  chars: string[],
  colors?: Colors,
  /** Optional cell size override for variable dimensions (Palette mode) */
  cellSizeOverride?: CellSize,
): void {
  // Transparent pixels don't render anything (show background)
  if (cell.isTransparent) {
    return;
  }

  const maxLevel = chars.length - 1;

  // Apply inversion for theme
  const level = mapLevel(cell.currentLevel, maxLevel, settings.invert);

  // Get the fill color based on color mode
  const fillColor = getCellColor(
    cell,
    settings.colorMode,
    colors?.fg || ctx.fillStyle.toString(),
    settings.style,
    level,
    maxLevel
  );

  // Set the fill color (only if different to avoid state changes)
  ctx.fillStyle = fillColor;

  // Use override if provided (for variable dimensions), otherwise use settings
  const cellSize = cellSizeOverride || settings.cellSize;

  switch (settings.style) {
    case "Ascii":
      renderChar(ctx, x, y, chars[level]);
      break
    case "Dot":
      renderDot(ctx, x, y, level, cellSize, maxLevel);
      break
    case "Palette":
      renderPallete(ctx, x, y, level, cellSize, maxLevel)
      break
    default:
      return
  }

}

export function adjustContrast(normalized: number, blackPoint: number = 0, whitePoint: number = 1) {
  let luminance = normalized

  // Adjust white and black point
  if (normalized < blackPoint) { luminance = 0 }
  if (normalized > whitePoint) { luminance = 1 }
  luminance = (luminance - blackPoint) / (whitePoint - blackPoint)

  if (whitePoint <= blackPoint) return luminance > 0.5 ? 1 : 0;

  //update the contrast
  return luminance > 0.6 ? luminance ** (1 / 1.5) : luminance ** 1.3;
}
