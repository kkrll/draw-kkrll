/**
 * Web Worker for image-to-ASCII conversion
 *
 * This worker handles the CPU-intensive pixel processing off the main thread,
 * preventing UI jank when converting large images.
 *
 * Flow:
 * 1. Main thread sends ImageBitmap + dimensions + ASCII chars
 * 2. Worker draws image to OffscreenCanvas at FULL resolution
 * 3. Worker processes each cell region, preserving RGB + calculating luminance
 * 4. Worker sends back the ColorCharCell grid array
 */

import { adjustContrast } from "./renderingUtils";
import type {
  ColorCharCell,
  WorkerInput,
  WorkerOutputError,
  WorkerOutputSuccess,
} from "./types";

/**
 * Process a single cell region and extract RGB + luminance data.
 * Samples the center pixel of the cell for color values.
 */
function processCellRegion(
  pixels: Uint8ClampedArray,
  imageWidth: number,
  cellStartX: number,
  cellStartY: number,
  cellWidth: number,
  cellHeight: number,
  maxLevel: number,
  blackPoint: number,
  whitePoint: number,
  invert: boolean,
): { r: number; g: number; b: number; level: number; isTransparent: boolean } {
  // Sample center pixel of the cell
  const centerX = Math.min(
    cellStartX + Math.floor(cellWidth / 2),
    imageWidth - 1,
  );
  const centerY = cellStartY + Math.floor(cellHeight / 2);
  const pixelIndex = (centerY * imageWidth + centerX) * 4;

  const r = pixels[pixelIndex];
  const g = pixels[pixelIndex + 1];
  const b = pixels[pixelIndex + 2];
  const a = pixels[pixelIndex + 3];

  // Check transparency - blank level depends on theme
  if (a < 56) {
    const level = invert ? maxLevel : 0;
    return { r: 0, g: 0, b: 0, level, isTransparent: true };
  }

  // Calculate perceived luminance using standard ITU coefficients
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;

  // Normalize and apply contrast adjustment
  const normalized = luminance / 255;
  const adjusted = adjustContrast(normalized, blackPoint, whitePoint);

  // Convert to level
  let level = Math.floor(adjusted * maxLevel);
  level = Math.max(0, Math.min(level, maxLevel));

  return { r, g, b, level, isTransparent: false };
}

/**
 * Process the image and convert to ColorCharCell grid.
 * Now preserves original RGB values for color mode support.
 */
function processImage(data: WorkerInput): ColorCharCell[] {
  const {
    imageBitmap,
    cols,
    rows,
    asciiChars,
    cellWidth,
    cellHeight,
    fitMode,
    blackPoint,
    whitePoint,
    invert,
  } = data;

  // Create canvas at the actual pixel dimensions we need
  // This gives us more accurate color sampling
  const canvasWidth = cols * cellWidth;
  const canvasHeight = rows * cellHeight;
  const canvas = new OffscreenCanvas(canvasWidth, canvasHeight);
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Failed to get canvas context");
  }

  // Calculate aspect ratios for proper image fitting
  const imgAspect = imageBitmap.width / imageBitmap.height;
  const canvasAspect = canvasWidth / canvasHeight;

  let drawWidth = canvasWidth;
  let drawHeight = canvasHeight;
  let offsetX = 0;
  let offsetY = 0;

  // Fit image while preserving aspect ratio
  // "contain" - fit entire image inside (letterbox)
  // "cover" - fill entire canvas (crop edges)
  const shouldScaleToSmaller =
    fitMode === "contain"
      ? imgAspect > canvasAspect // contain: wider image → fit to width
      : imgAspect < canvasAspect; // cover: wider image → fit to height (overflow width)

  if (shouldScaleToSmaller) {
    drawHeight = Math.round(canvasWidth / imgAspect);
    offsetY = Math.round((canvasHeight - drawHeight) / 2);
  } else {
    drawWidth = Math.round(canvasHeight * imgAspect);
    offsetX = Math.round((canvasWidth - drawWidth) / 2);
  }

  // Clear canvas (transparent background for edge cells in contain mode)
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);

  // Draw the image at proper resolution
  ctx.drawImage(imageBitmap, offsetX, offsetY, drawWidth, drawHeight);

  // Get raw pixel data at full resolution
  const imageData = ctx.getImageData(0, 0, canvasWidth, canvasHeight);
  const pixels = imageData.data;

  // Build the grid by sampling each cell
  const grid: ColorCharCell[] = new Array(cols * rows);
  const maxLevel = asciiChars.length - 1;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const cellStartX = col * cellWidth;
      const cellStartY = row * cellHeight;

      const cellData = processCellRegion(
        pixels,
        canvasWidth,
        cellStartX,
        cellStartY,
        cellWidth,
        cellHeight,
        maxLevel,
        blackPoint,
        whitePoint,
        invert,
      );

      const index = row * cols + col;
      grid[index] = {
        baseLevel: cellData.level,
        currentLevel: cellData.level,
        col,
        row,
        r: cellData.r,
        g: cellData.g,
        b: cellData.b,
        isTransparent: cellData.isTransparent,
      };
    }
  }

  return grid;
}

// Worker message handler
self.onmessage = (event: MessageEvent<WorkerInput>) => {
  try {
    const grid = processImage(event.data);

    // Send result back to main thread
    const response: WorkerOutputSuccess = { success: true, grid };
    self.postMessage(response);
  } catch (error) {
    const response: WorkerOutputError = {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
    self.postMessage(response);
  }
};
