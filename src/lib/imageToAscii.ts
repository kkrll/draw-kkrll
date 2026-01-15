/**
 * Image to ASCII Grid Converter
 *
 * Converts images to a grid of ColorCharCell objects for ASCII art rendering.
 * Uses Web Worker + OffscreenCanvas when available for non-blocking conversion.
 * Falls back to main thread processing for older browsers.
 *
 * Now supports:
 * - Dynamic cell sizes (not hardcoded)
 * - RGB color preservation for color mode
 */

import type {
  CellSize,
  ColorCharCell,
  FitMode,
  WorkerInput,
  WorkerOutput,
} from "./types";
import { DEFAULT_CELL_WIDTH, DEFAULT_CELL_HEIGHT } from "./constants";
import { adjustContrast } from "./renderingUtils";

// Lazy-loaded worker instance (created on first use)
let worker: Worker | null = null;
let workerSupported: boolean | null = null;

/**
 * Check if Web Worker + OffscreenCanvas is supported
 * We cache this result since it won't change during the session
 */
function isWorkerSupported(): boolean {
  if (workerSupported !== null) return workerSupported;

  workerSupported =
    typeof Worker !== "undefined" &&
    typeof OffscreenCanvas !== "undefined" &&
    typeof createImageBitmap !== "undefined";

  return workerSupported;
}

/**
 * Get or create the worker instance
 * Uses dynamic import with worker URL for Vite compatibility
 */
function getWorker(): Worker {
  if (!worker) {
    worker = new Worker(new URL("./imageToAscii.worker.ts", import.meta.url), {
      type: "module",
    });
  }
  return worker;
}

/**
 * Convert image using Web Worker (non-blocking)
 * Uses ImageBitmap which can be transferred to worker without copying
 */
async function convertWithWorker(
  file: File,
  cols: number,
  rows: number,
  asciiChars: string[],
  cellSize: CellSize,
  fitMode: FitMode,
  blackPoint: number,
  whitePoint: number,
  invert: boolean,
): Promise<ColorCharCell[]> {
  // Create ImageBitmap from file - this is transferable to workers
  const imageBitmap = await createImageBitmap(file);

  return new Promise((resolve, reject) => {
    const workerInstance = getWorker();

    const handleMessage = (event: MessageEvent<WorkerOutput>) => {
      workerInstance.removeEventListener("message", handleMessage);
      workerInstance.removeEventListener("error", handleError);

      if (event.data.success) {
        resolve(event.data.grid);
      } else {
        reject(new Error(event.data.error));
      }
    };

    const handleError = (error: ErrorEvent) => {
      workerInstance.removeEventListener("message", handleMessage);
      workerInstance.removeEventListener("error", handleError);
      reject(new Error(error.message || "Worker error"));
    };

    workerInstance.addEventListener("message", handleMessage);
    workerInstance.addEventListener("error", handleError);

    // Send data to worker with dynamic cell size
    const input: WorkerInput = {
      imageBitmap,
      cols,
      rows,
      asciiChars,
      cellWidth: cellSize.width,
      cellHeight: cellSize.height,
      fitMode,
      blackPoint,
      whitePoint,
      invert,
    };

    workerInstance.postMessage(input, [imageBitmap]);
  });
}

/**
 * Load image file into HTMLImageElement (for main thread fallback)
 */
function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

/**
 * Shared conversion logic for any canvas-drawable source
 * Works with HTMLImageElement, ImageBitmap, or any CanvasImageSource
 */
function convertSourceToGrid(
  source: CanvasImageSource,
  sourceWidth: number,
  sourceHeight: number,
  cols: number,
  rows: number,
  asciiChars: string[],
  cellSize: CellSize,
  fitMode: FitMode,
  blackPoint: number,
  whitePoint: number,
  invert: boolean,
): ColorCharCell[] {
  // Create canvas at full pixel resolution
  const canvasWidth = cols * cellSize.width;
  const canvasHeight = rows * cellSize.height;
  const tempCanvas = document.createElement("canvas");
  tempCanvas.width = canvasWidth;
  tempCanvas.height = canvasHeight;

  const ctx = tempCanvas.getContext("2d");
  if (!ctx) {
    throw new Error("Failed to get canvas context");
  }

  // Calculate aspect ratios for proper image fitting
  const imgAspect = sourceWidth / sourceHeight;
  const canvasAspect = canvasWidth / canvasHeight;

  let drawWidth = canvasWidth;
  let drawHeight = canvasHeight;
  let offsetX = 0;
  let offsetY = 0;

  // "contain" - fit entire image inside (letterbox)
  // "cover" - fill entire canvas (crop edges)
  const shouldScaleToSmaller =
    fitMode === "contain" ? imgAspect > canvasAspect : imgAspect < canvasAspect;

  if (shouldScaleToSmaller) {
    drawHeight = Math.round(canvasWidth / imgAspect);
    offsetY = Math.round((canvasHeight - drawHeight) / 2);
  } else {
    drawWidth = Math.round(canvasHeight * imgAspect);
    offsetX = Math.round((canvasWidth - drawWidth) / 2);
  }

  // Clear and draw
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);
  ctx.drawImage(source, offsetX, offsetY, drawWidth, drawHeight);

  const imageData = ctx.getImageData(0, 0, canvasWidth, canvasHeight);
  const pixels = imageData.data;

  // Build grid by sampling each cell
  const grid: ColorCharCell[] = new Array(cols * rows);
  const maxLevel = asciiChars.length - 1;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      // Sample center pixel of the cell
      const centerX = Math.min(
        col * cellSize.width + Math.floor(cellSize.width / 2),
        canvasWidth - 1,
      );
      const centerY = row * cellSize.height + Math.floor(cellSize.height / 2);
      const pixelIndex = (centerY * canvasWidth + centerX) * 4;

      const r = pixels[pixelIndex];
      const g = pixels[pixelIndex + 1];
      const b = pixels[pixelIndex + 2];
      const a = pixels[pixelIndex + 3];

      const index = row * cols + col;

      if (a < 56) {
        // Transparent - blank level depends on theme
        const level = invert ? maxLevel : 0;
        grid[index] = {
          baseLevel: level,
          currentLevel: level,
          col,
          row,
          r: 0,
          g: 0,
          b: 0,
          isTransparent: true,
        };
      } else {
        // Calculate luminance and level
        const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
        const normalized = luminance / 255;
        const adjusted = adjustContrast(normalized, blackPoint, whitePoint);
        let level = Math.floor(adjusted * maxLevel);
        level = Math.max(0, Math.min(level, maxLevel));

        grid[index] = {
          baseLevel: level,
          currentLevel: level,
          col,
          row,
          r,
          g,
          b,
          isTransparent: false,
        };
      }
    }
  }

  return grid;
}

/**
 * Convert image on main thread (fallback for older browsers)
 * This blocks the UI during processing but ensures compatibility
 */
async function convertOnMainThread(
  file: File,
  cols: number,
  rows: number,
  asciiChars: string[],
  cellSize: CellSize,
  fitMode: FitMode,
  blackPoint: number,
  whitePoint: number,
  invert: boolean,
): Promise<ColorCharCell[]> {
  const img = await loadImage(file);
  return convertSourceToGrid(
    img,
    img.width,
    img.height,
    cols,
    rows,
    asciiChars,
    cellSize,
    fitMode,
    blackPoint,
    whitePoint,
    invert,
  );
}

/**
 * Main entry point - converts an image file to ColorCharCell grid
 *
 * Automatically chooses the best method:
 * - Web Worker + OffscreenCanvas for modern browsers (non-blocking)
 * - Main thread fallback for older browsers
 *
 * @param file - Image file to convert
 * @param cols - Number of columns in the grid
 * @param rows - Number of rows in the grid
 * @param asciiChars - Character set for level mapping
 * @param cellSize - Optional cell dimensions (defaults to 10x16)
 * @param fitMode - How to fit image: "contain" (default) or "cover"
 * @param blackPoint - Black point for contrast adjustment (0-1, default 0)
 * @param whitePoint - White point for contrast adjustment (0-1, default 1)
 * @param invert - Invert levels at conversion time for light mode (default false)
 */
async function convertImageToGrid(
  file: File,
  cols: number,
  rows: number,
  asciiChars: string[],
  cellSize: CellSize = {
    width: DEFAULT_CELL_WIDTH,
    height: DEFAULT_CELL_HEIGHT,
  },
  fitMode: FitMode = "contain",
  blackPoint = 0,
  whitePoint = 1,
  invert = false,
): Promise<ColorCharCell[]> {
  // Validate input
  if (!file.type.startsWith("image/")) {
    throw new Error("Invalid file type");
  }

  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    throw new Error("File size is too large");
  }

  // Use worker if supported, otherwise fall back to main thread
  if (isWorkerSupported()) {
    try {
      return await convertWithWorker(
        file,
        cols,
        rows,
        asciiChars,
        cellSize,
        fitMode,
        blackPoint,
        whitePoint,
        invert,
      );
    } catch (error) {
      console.warn(
        "Worker conversion failed, falling back to main thread:",
        error,
      );
      return convertOnMainThread(
        file,
        cols,
        rows,
        asciiChars,
        cellSize,
        fitMode,
        blackPoint,
        whitePoint,
        invert,
      );
    }
  }

  return convertOnMainThread(
    file,
    cols,
    rows,
    asciiChars,
    cellSize,
    fitMode,
    blackPoint,
    whitePoint,
    invert,
  );
}

export default convertImageToGrid;

/**
 * Convert directly from an ImageBitmap (used for grid regeneration)
 * This avoids re-reading the file when just changing cell size
 */
export function convertBitmapToGrid(
  bitmap: ImageBitmap,
  cols: number,
  rows: number,
  asciiChars: string[],
  cellSize: CellSize,
  fitMode: FitMode = "contain",
  blackPoint = 0,
  whitePoint = 1,
  invert = false,
): ColorCharCell[] {
  return convertSourceToGrid(
    bitmap,
    bitmap.width,
    bitmap.height,
    cols,
    rows,
    asciiChars,
    cellSize,
    fitMode,
    blackPoint,
    whitePoint,
    invert,
  );
}
