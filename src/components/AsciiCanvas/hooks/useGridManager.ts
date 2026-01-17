import type { Setter } from "solid-js";
import type { CanvasState } from "../types";
import type {
  CellSize,
  CellSizeRange,
  ColorCharCell,
  RenderSettings,
  VariableCellDimensions,
} from "../../../lib/types";
import { useDebounce } from "../../../lib/useDebounce";
import { loadRandomImage } from "../../../lib/imageLoader";
import { convertBitmapToGrid } from "../../../lib/imageToAscii";
import {
  createEditOverlay,
  clearOverlay,
  resizeOverlay,
  batchSampleEdits,
  applyEditToLevel,
} from "../../../lib/editOverlay";
import {
  generateVariableDimensions,
} from "../../../lib/variableDimensions";
import {
  IMAGE_ASCII_CHARS,
  getFontForCellSize,
} from "../../../lib/constants";
import { theme } from "../../../stores/theme";

interface UseGridManagerDeps {
  canvasState: CanvasState;
  renderSettings: RenderSettings;
  renderGrid: () => void;
  drawBackground: () => void;

  // Signal setters for loading states
  setIsResizing: Setter<boolean>;
  setHasSourceImage: Setter<boolean>;

  // Signal setters for image controls (to reset them)
  setBlackPoint: Setter<number>;
  setWhitePoint: Setter<number>;
  setBgBlur: Setter<number>;
  setBgScale: Setter<number>;
  setBgOffsetX: Setter<number>;
  setBgOffsetY: Setter<number>;

  // Signal setters for cell size (for shuffle)
  setCellSizeRange: Setter<CellSizeRange>;
}

export function useGridManager(deps: UseGridManagerDeps) {
  const {
    canvasState,
    renderSettings,
    renderGrid,
    drawBackground,
    setIsResizing,
    setHasSourceImage,
    setBlackPoint,
    setWhitePoint,
    setBgBlur,
    setBgScale,
    setBgOffsetX,
    setBgOffsetY,
    setCellSizeRange,
  } = deps;

  const getCanvasDimensions = () => {
    const canvas = canvasState.canvasRef.current
    if (!canvas) return { cols: 0, rows: 0 }

    const cols = Math.ceil(canvas.width / renderSettings.cellSize.width)
    const rows = Math.ceil(canvas.height / renderSettings.cellSize.height)
    return { cols, rows }
  }

  const updateColors = () => {
    const canvas = canvasState.canvasRef.current
    if (!canvas) return

    const computedStyle = getComputedStyle(canvas)
    canvasState.colors.current = {
      bg: computedStyle.getPropertyValue("--background").trim() || "#111111",
      fg: computedStyle.getPropertyValue("--foreground").trim() || "#ffffff",
    }
  }

  const initGrid = async () => {
    const canvas = canvasState.canvasRef.current;
    if (!canvas) return;

    updateColors();

    const { cols, rows } = getCanvasDimensions();
    if (cols === 0 || rows === 0) return;

    canvasState.editOverlay.current = createEditOverlay(canvas.width, canvas.height)

    try {
      const file = await loadRandomImage();
      const bitmap = await createImageBitmap(file);
      canvasState.sourceImage.current = {
        bitmap,
        width: bitmap.width,
        height: bitmap.height,
      };
      setHasSourceImage(true);

      const grid = convertBitmapToGrid(
        bitmap,
        cols,
        rows,
        IMAGE_ASCII_CHARS,
        renderSettings.cellSize,
        canvasState.fitMode.current,
        0, // blackPoint
        1, // whitePoint
        theme() === "light" // invert
      );

      canvasState.grid.current = grid;
      renderGrid();
    } catch (error) {
      console.error("Failed to load initial image:", error);
      // Create empty grid as fallback
      canvasState.grid.current = createEmptyGrid(cols, rows);
      renderGrid();
    }
  }

  const createEmptyGrid = (cols: number, rows: number): ColorCharCell[] => {
    const grid: ColorCharCell[] = [];
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        grid.push({
          baseLevel: 0,
          currentLevel: 0,
          col,
          row,
          r: 0,
          g: 0,
          b: 0,
        });
      }
    }
    return grid;
  };

  const handleCellSizeChange = async (newCellSize: CellSize) => {
    const canvas = canvasState.canvasRef.current;
    if (!canvas) return;

    setIsResizing(true);

    renderSettings.cellSize = newCellSize

    const cols = Math.ceil(canvas.width / newCellSize.width);
    const rows = Math.ceil(canvas.height / newCellSize.height);

    if (canvasState.sourceImage.current) {
      try {
        const grid = convertBitmapToGrid(
          canvasState.sourceImage.current.bitmap,
          cols,
          rows,
          IMAGE_ASCII_CHARS,
          newCellSize,
          canvasState.fitMode.current,
          0,
          1,
          renderSettings.invert
        );

        // Apply any edits from overlay (batch for O(edits) instead of O(cells × edits))
        const editOverlay = canvasState.editOverlay.current;
        if (editOverlay && editOverlay.edits.size > 0) {
          const editMap = batchSampleEdits(editOverlay, newCellSize, cols, rows);
          for (const cell of grid) {
            const edit = editMap.get(`${cell.col},${cell.row}`);
            if (edit) {
              cell.currentLevel = applyEditToLevel(
                cell.baseLevel,
                edit,
                IMAGE_ASCII_CHARS.length - 1
              );
              if (edit.isTransparent !== undefined) {
                cell.isTransparent = edit.isTransparent;
              }
            }
          }
        }
        canvasState.grid.current = grid;
      } catch (error) {
        console.error("Failed to regenerate grid:", error);
      }
    } else {
      // No source image - create empty grid
      canvasState.grid.current = createEmptyGrid(cols, rows);
    }

    // Update canvas font for ASCII mode
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.font = getFontForCellSize(newCellSize.height);
      ctx.textBaseline = "top";
    }

    renderGrid();
    setIsResizing(false);
  };

  const generateGridWithVariableDimensions = (
    cellSizeRange: CellSizeRange
  ): { grid: ColorCharCell[]; dimensions: VariableCellDimensions } | null => {
    const canvas = canvasState.canvasRef.current;
    if (!canvas) return null;

    const dimensions = generateVariableDimensions(
      canvas.width,
      canvas.height,
      cellSizeRange
    );

    const cols = dimensions.columnWidths.length;
    const rows = dimensions.rowHeights.length;
    const maxLevel = IMAGE_ASCII_CHARS.length - 1;

    if (canvasState.sourceImage.current) {
      // Create temp canvas at display size for proper fitMode handling
      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      const tempCtx = tempCanvas.getContext("2d");
      if (!tempCtx) return null;

      const { bitmap, width: srcW, height: srcH } = canvasState.sourceImage.current;
      let dx: number, dy: number, dw: number, dh: number;

      // Apply fitMode (cover vs contain)
      if (canvasState.fitMode.current === "cover") {
        const scale = Math.max(canvas.width / srcW, canvas.height / srcH);
        dw = srcW * scale;
        dh = srcH * scale;
        dx = (canvas.width - dw) / 2;
        dy = (canvas.height - dh) / 2;
      } else {
        const scale = Math.min(canvas.width / srcW, canvas.height / srcH);
        dw = srcW * scale;
        dh = srcH * scale;
        dx = (canvas.width - dw) / 2;
        dy = (canvas.height - dh) / 2;
      }

      tempCtx.drawImage(bitmap, dx, dy, dw, dh);
      const imageData = tempCtx.getImageData(0, 0, canvas.width, canvas.height);
      const pixels = imageData.data;

      const newGrid: ColorCharCell[] = new Array(cols * rows);

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const cellX = dimensions.columnOffsets[col];
          const cellY = dimensions.rowOffsets[row];
          const cellW = dimensions.columnWidths[col];
          const cellH = dimensions.rowHeights[row];

          const centerX = Math.floor(cellX + cellW / 2);
          const centerY = Math.floor(cellY + cellH / 2);
          const pixelIndex = (centerY * canvas.width + centerX) * 4;

          const r = pixels[pixelIndex] || 0;
          const g = pixels[pixelIndex + 1] || 0;
          const b = pixels[pixelIndex + 2] || 0;
          const a = pixels[pixelIndex + 3] || 255;

          // ITU-R BT.709 luminance coefficients
          const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
          const normalized = luminance / 255;
          let level = Math.floor(normalized * maxLevel);

          // Handle invert for light mode
          if (renderSettings.invert) {
            level = maxLevel - level;
          }

          newGrid[row * cols + col] = {
            baseLevel: level,
            currentLevel: level,
            col,
            row,
            r,
            g,
            b,
            isTransparent: a < 56,
          };
        }
      }

      return { grid: newGrid, dimensions };
    } else {
      // No source image - create blank grid
      const blankGrid: ColorCharCell[] = new Array(cols * rows);
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          blankGrid[row * cols + col] = {
            baseLevel: 0,
            currentLevel: 0,
            col,
            row,
            r: 0,
            g: 0,
            b: 0,
          };
        }
      }
      return { grid: blankGrid, dimensions };
    }
  }

  const handleShuffleDimensions = (cellSizeRange: CellSizeRange) => {

    setIsResizing(true);

    const result = generateGridWithVariableDimensions(cellSizeRange);
    if (result) {
      canvasState.grid.current = result.grid;
      canvasState.variableDimensions.current = result.dimensions;
      renderGrid();
    }

    setIsResizing(false);
  };

  const handleCellSizeRangeChange = (newRange: CellSizeRange) => {
    setCellSizeRange(newRange);

    if (renderSettings.style !== "Palette") return;

    setIsResizing(true);

    const result = generateGridWithVariableDimensions(newRange);
    if (result) {
      canvasState.grid.current = result.grid;
      canvasState.variableDimensions.current = result.dimensions;
      renderGrid();
    }

    setIsResizing(false);
  }

  const resizeGridPeriphery = (newCols: number, newRows: number) => {
    const oldGrid = canvasState.grid.current;
    if (oldGrid.length === 0) return;

    // Find old dimensions from grid
    const oldCols = Math.max(...oldGrid.map((c) => c.col)) + 1;
    const oldRows = Math.max(...oldGrid.map((c) => c.row)) + 1;

    // Calculate offsets to center the old content in new grid
    const colOffset = Math.floor((newCols - oldCols) / 2);
    const rowOffset = Math.floor((newRows - oldRows) / 2);

    const newGrid: ColorCharCell[] = [];

    for (let row = 0; row < newRows; row++) {
      for (let col = 0; col < newCols; col++) {
        // Map new position to old position
        const oldCol = col - colOffset;
        const oldRow = row - rowOffset;

        // Check if this position existed in old grid
        if (oldCol >= 0 && oldCol < oldCols && oldRow >= 0 && oldRow < oldRows) {
          const oldIndex = oldRow * oldCols + oldCol;
          const oldCell = oldGrid[oldIndex];
          if (oldCell) {
            newGrid.push({
              ...oldCell,
              col,
              row,
            });
            continue;
          }
        }

        // New cell - create empty
        newGrid.push({
          baseLevel: 0,
          currentLevel: 0,
          col,
          row,
          r: 0,
          g: 0,
          b: 0,
        });
      }
    }

    canvasState.grid.current = newGrid;
  };

  const handleWindowResize = () => {
    const canvas = canvasState.canvasRef.current;
    const bgCanvas = canvasState.bgCanvasRef.current;
    if (!canvas) return;

    // Update canvas size to match container
    const container = canvas.parentElement;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    if (bgCanvas) {
      bgCanvas.width = rect.width;
      bgCanvas.height = rect.height;
    }

    // Update edit overlay size
    if (canvasState.editOverlay.current) {
      resizeOverlay(canvasState.editOverlay.current, rect.width, rect.height);
    }

    // Calculate new grid dimensions
    const newCols = Math.ceil(rect.width / renderSettings.cellSize.width);
    const newRows = Math.ceil(rect.height / renderSettings.cellSize.height);

    // Resize grid preserving center
    resizeGridPeriphery(newCols, newRows);

    // Update colors and re-render
    updateColors();

    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.font = getFontForCellSize(renderSettings.cellSize.height);
      ctx.textBaseline = "top";
    }

    drawBackground();
    renderGrid();
    setIsResizing(false);
  };

  // Reset to initial state (keeps source image, clears edits)
  const handleReset = async () => {
    // Clear edit overlay
    if (canvasState.editOverlay.current) {
      clearOverlay(canvasState.editOverlay.current);
    }

    // Reset contrast and background settings
    setBlackPoint(0);
    setWhitePoint(1);
    setBgBlur(4);
    setBgScale(1);
    setBgOffsetX(0);
    setBgOffsetY(0);
    canvasState.bgOffset.current = { x: 0, y: 0 };

    // Regenerate grid from source image
    if (canvasState.sourceImage.current) {
      const { cols, rows } = getCanvasDimensions();
      const grid = convertBitmapToGrid(
        canvasState.sourceImage.current.bitmap,
        cols,
        rows,
        IMAGE_ASCII_CHARS,
        renderSettings.cellSize,
        canvasState.fitMode.current,
        0,
        1,
        renderSettings.invert
      );
      canvasState.grid.current = grid;
    }

    drawBackground();
    renderGrid();
  };

  // Clear everything (removes source image)
  const handleClear = () => {
    // Close existing bitmap to free memory
    if (canvasState.sourceImage.current) {
      canvasState.sourceImage.current.bitmap.close();
      canvasState.sourceImage.current = null;
    }
    setHasSourceImage(false);

    // Clear edit overlay
    if (canvasState.editOverlay.current) {
      clearOverlay(canvasState.editOverlay.current);
    }

    // Reset all settings
    setBlackPoint(0);
    setWhitePoint(1);
    setBgBlur(4);
    setBgScale(1);
    setBgOffsetX(0);
    setBgOffsetY(0);
    canvasState.bgOffset.current = { x: 0, y: 0 };

    // Create empty grid
    const { cols, rows } = getCanvasDimensions();
    canvasState.grid.current = createEmptyGrid(cols, rows);

    // Clear background canvas
    const bgCanvas = canvasState.bgCanvasRef.current;
    if (bgCanvas) {
      const bgCtx = bgCanvas.getContext("2d");
      if (bgCtx) {
        bgCtx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);
      }
    }

    renderGrid();
  };

  // Handle contrast change - regenerates grid with new black/white points
  const handleContrastChange = (newBlackPoint: number, newWhitePoint: number) => {
    setBlackPoint(newBlackPoint);
    setWhitePoint(newWhitePoint);

    if (!canvasState.sourceImage.current) return;

    const { cols, rows } = getCanvasDimensions();
    const grid = convertBitmapToGrid(
      canvasState.sourceImage.current.bitmap,
      cols,
      rows,
      IMAGE_ASCII_CHARS,
      renderSettings.cellSize,
      canvasState.fitMode.current,
      newBlackPoint,
      newWhitePoint,
      renderSettings.invert
    );

    // Apply any edits from overlay (batch for O(edits) instead of O(cells × edits))
    const editOverlay = canvasState.editOverlay.current;
    if (editOverlay && editOverlay.edits.size > 0) {
      const editMap = batchSampleEdits(editOverlay, renderSettings.cellSize, cols, rows);
      for (const cell of grid) {
        const edit = editMap.get(`${cell.col},${cell.row}`);
        if (edit) {
          cell.currentLevel = applyEditToLevel(
            cell.baseLevel,
            edit,
            IMAGE_ASCII_CHARS.length - 1
          );
          if (edit.isTransparent !== undefined) {
            cell.isTransparent = edit.isTransparent;
          }
        }
      }
    }

    canvasState.grid.current = grid;
    renderGrid();
  };

  const debouncedCellSizeChange = useDebounce(handleCellSizeChange, 100);
  const debouncedCellSizeRangeChange = useDebounce(handleCellSizeRangeChange, 100);
  const debouncedWindowResize = useDebounce(handleWindowResize, 100);
  const debouncedContrastChange = useDebounce(handleContrastChange, 100);

  return {
    initGrid,
    getCanvasDimensions,
    updateColors,
    handleCellSizeChange: debouncedCellSizeChange,
    handleCellSizeRangeChange: debouncedCellSizeRangeChange,
    handleShuffleDimensions,
    handleWindowResize: debouncedWindowResize,
    handleContrastChange: debouncedContrastChange,
    handleReset,
    handleClear,
    resizeGridPeriphery,
  };
}
