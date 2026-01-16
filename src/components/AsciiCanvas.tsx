/**
 * AsciiCanvas - Main interactive ASCII art component (SolidJS)
 *
 * Converted from React with these key pattern changes:
 * - useState → createSignal (accessed as functions: count())
 * - useRef for values → plain variables (let)
 * - useRef for DOM → let el: HTMLElement with ref={el!}
 * - useEffect(fn, []) → onMount(fn)
 * - useEffect(fn, [deps]) → createEffect(fn) (auto-tracking)
 * - useCallback → regular functions (no stale closures in Solid)
 * - memo() → not needed (fine-grained reactivity)
 */

import { createSignal, createEffect, onMount, onCleanup, Show } from "solid-js";
import { useDebounce } from "../lib/useDebounce";
import { theme } from "../stores/theme";
import {
  DEFAULT_CELL_HEIGHT,
  DEFAULT_CELL_WIDTH,
  IMAGE_ASCII_CHARS,
  STYLES,
  getFontForCellSize,
} from "../lib/constants";
import type {
  CellSize,
  CellSizeRange,
  ColorCharCell,
  ColorMode,
  Colors,
  EditOverlay,
  FitMode,
  SourceImage,
  RenderStyle,
  DrawingModes,
  VariableCellDimensions,
} from "../lib/types";
import SymbolSelector from "./SymbolSelector";
import PaletteColorPicker from "./PaletteColorPicker";
import DrawingControls from "./DrawingControls";
import ResizingIndicator from "./ResizingIndicator";
import convertImageToGrid, { convertBitmapToGrid } from "../lib/imageToAscii";
import { generateAsciiTxt, uploadAsciiToR2 } from "../lib/asciiSavingUtils";
import NavButton from "./NavButton";
import Divider from "./ui/Divider";
import {
  renderCell,
  mapLevel,
  type RenderSettings,
  createDefaultRenderSettings,
} from "../lib/renderingUtils";
import { loadRandomImage } from "../lib/imageLoader";
import CellSizeSelector, { adjustCellSizeForStyle } from "./CellSizeSelector";
import ColorModeToggle from "./ColorModeToggle";
import {
  createEditOverlay,
  recordEdit,
  sampleEditsForCell,
  applyEditToLevel,
  clearOverlay,
  resizeOverlay,
} from "../lib/editOverlay";
import { Darken, Eraser, Lighten } from "./ui/icons";
import {
  generateVariableDimensions,
  findColumnAtX,
  findRowAtY,
  DEFAULT_CELL_SIZE_RANGE,
} from "../lib/variableDimensions";

interface AsciiCanvasProps {
  drawingMode: DrawingModes;
  onToggleDrawingMode: () => void;
  setMode: (mode: DrawingModes) => void;
}

export default function AsciiCanvas(props: AsciiCanvasProps) {
  // Canvas and grid refs (plain variables in SolidJS)
  let canvasRef: HTMLCanvasElement | undefined;
  let bgCanvasRef: HTMLCanvasElement | undefined;
  let grid: ColorCharCell[] = [];
  let colors: Colors = { bg: "", fg: "" };
  let asciiCharsDraw: string[] = [...IMAGE_ASCII_CHARS];

  // Source image storage
  let sourceImage: SourceImage | null = null;
  let fitMode: FitMode = "cover";
  let editOverlay: EditOverlay | null = null;

  // Drawing state (plain variables - no stale closures in Solid)
  let isDragging = false;
  let animationFrameId: number | undefined;
  let selectedSymbolVal = 8;
  let selectedPaletteColorVal = "#000000";
  let drawingModeVal: DrawingModes = props.drawingMode;
  let lastDrawnCell: { row: number; col: number } | null = null;
  let blackPointVal = 0;
  let whitePointVal = 1;
  let bgOffset = { x: 0, y: 0, originalWidth: 0, originalHeight: 0 };
  let bgBlurVal = 4;
  let bgScaleVal = 1;

  // Render settings
  let renderSettings: RenderSettings = createDefaultRenderSettings();

  // Variable dimensions for Palette mode
  let variableDimensions: VariableCellDimensions | null = null;

  // UI State (signals for reactive updates)
  const [selectedSymbol, setSelectedSymbol] = createSignal(8);
  const [selectedPaletteColor, setSelectedPaletteColor] = createSignal("#000000");
  const [isResizing, setIsResizing] = createSignal(false);
  const [isConverting, setIsConverting] = createSignal(false);
  const [style, setStyle] = createSignal<RenderStyle>("Ascii");
  const [cellSize, setCellSize] = createSignal<CellSize>({
    width: DEFAULT_CELL_WIDTH,
    height: DEFAULT_CELL_HEIGHT,
  });
  const [cellSizeRange, setCellSizeRange] = createSignal<CellSizeRange>(DEFAULT_CELL_SIZE_RANGE);
  const [colorMode, setColorMode] = createSignal<ColorMode>("monochrome");
  const [hasSourceImage, setHasSourceImage] = createSignal(false);
  const [blackPoint, setBlackPoint] = createSignal(0);
  const [whitePoint, setWhitePoint] = createSignal(1);
  const [bgBlur, setBgBlur] = createSignal(4);
  const [bgScale, setBgScale] = createSignal(1);
  const [bgOffsetX, setBgOffsetX] = createSignal(0);
  const [bgOffsetY, setBgOffsetY] = createSignal(0);

  // Sync local values with signals
  createEffect(() => {
    selectedSymbolVal = selectedSymbol();
  });

  createEffect(() => {
    selectedPaletteColorVal = selectedPaletteColor();
  });

  createEffect(() => {
    drawingModeVal = props.drawingMode;
  });

  // Background canvas drawing
  const drawBackground = () => {
    const bgCanvas = bgCanvasRef;
    if (!bgCanvas) return;

    const ctx = bgCanvas.getContext("2d");
    if (!ctx) return;

    const currentColorMode = renderSettings.colorMode;

    if (currentColorMode === "mixed" && sourceImage) {
      const { bitmap, width: srcW, height: srcH } = sourceImage;
      const originalCanvasW = bgOffset.originalWidth;
      const originalCanvasH = bgOffset.originalHeight;

      let dx: number, dy: number, dw: number, dh: number;

      if (fitMode === "cover") {
        const scale = Math.max(originalCanvasW / srcW, originalCanvasH / srcH);
        dw = srcW * scale;
        dh = srcH * scale;
        dx = (originalCanvasW - dw) / 2;
        dy = (originalCanvasH - dh) / 2;
      } else {
        const scale = Math.min(originalCanvasW / srcW, originalCanvasH / srcH);
        dw = srcW * scale;
        dh = srcH * scale;
        dx = (originalCanvasW - dw) / 2;
        dy = (originalCanvasH - dh) / 2;
      }

      dw *= bgScaleVal;
      dh *= bgScaleVal;
      dx = (originalCanvasW - dw) / 2;
      dy = (originalCanvasH - dh) / 2;
      dx += bgOffset.x;
      dy += bgOffset.y;

      ctx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);
      ctx.fillStyle = colors.bg;
      ctx.fillRect(0, 0, bgCanvas.width, bgCanvas.height);
      ctx.filter = `blur(${bgBlurVal}px)`;
      ctx.drawImage(bitmap, dx, dy, dw, dh);
      ctx.filter = "none";
    } else {
      ctx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);
      ctx.fillStyle = colors.bg;
      ctx.fillRect(0, 0, bgCanvas.width, bgCanvas.height);
    }
  };

  // Get canvas dimensions
  const getCanvasDimensions = (canvas: HTMLCanvasElement) => {
    const currentCellSize = renderSettings.cellSize;
    return {
      width: canvas.width,
      height: canvas.height,
      cols: Math.ceil(canvas.width / currentCellSize.width),
      rows: Math.ceil(canvas.height / currentCellSize.height),
    };
  };

  // Update cached colors from CSS
  const updateColors = () => {
    const canvas = canvasRef;
    if (!canvas) return;

    const styles = getComputedStyle(canvas);
    colors = {
      bg: styles.backgroundColor,
      fg: styles.color,
    };
  };

  // Initialize grid from random image
  const initGrid = async () => {
    const canvas = canvasRef;
    if (!canvas) return;

    const currentCellSize = renderSettings.cellSize;
    const cols = Math.ceil(canvas.width / currentCellSize.width);
    const rows = Math.ceil(canvas.height / currentCellSize.height);

    try {
      const file = await loadRandomImage();
      const bitmap = await createImageBitmap(file);

      if (sourceImage?.bitmap) {
        sourceImage.bitmap.close();
      }

      bgOffset = { x: 0, y: 0, originalWidth: canvas.width, originalHeight: canvas.height };
      sourceImage = { bitmap, width: bitmap.width, height: bitmap.height };
      setHasSourceImage(true);

      editOverlay = createEditOverlay(canvas.width, canvas.height);
      fitMode = "cover";

      const convertedGrid = await convertImageToGrid(
        file,
        cols,
        rows,
        IMAGE_ASCII_CHARS,
        currentCellSize,
        "cover",
        blackPointVal,
        whitePointVal,
        renderSettings.invert
      );
      grid = convertedGrid;
    } catch (error) {
      console.error("Failed to load initial image, using blank canvas:", error);

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
      grid = blankGrid;
      editOverlay = createEditOverlay(canvas.width, canvas.height);
    }
  };

  // Render the entire grid to canvas
  const renderGrid = () => {
    const canvas = canvasRef;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    updateColors();
    const currentCellSize = renderSettings.cellSize;
    const varDims = variableDimensions;
    const isPaletteWithVarDims = renderSettings.style === "Palette" && varDims !== null;

    drawBackground();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = getFontForCellSize(currentCellSize.height);
    ctx.textBaseline = "top";

    grid.forEach((cell) => {
      let x: number;
      let y: number;
      let cellSizeOverride: CellSize | undefined;

      if (isPaletteWithVarDims) {
        x = varDims.columnOffsets[cell.col];
        y = varDims.rowOffsets[cell.row];
        cellSizeOverride = {
          width: varDims.columnWidths[cell.col],
          height: varDims.rowHeights[cell.row],
        };
      } else {
        x = cell.col * currentCellSize.width;
        y = cell.row * currentCellSize.height;
      }

      renderCell(ctx, cell, renderSettings, x, y, asciiCharsDraw, colors, cellSizeOverride);
    });
  };

  // Handle style changes
  createEffect(() => {
    renderSettings.style = style();
    renderGrid();
  });

  // Handle theme changes
  createEffect(() => {
    renderSettings.invert = theme() === "light";
    requestAnimationFrame(() => {
      renderGrid();
    });
  });

  // Handle cell size changes
  const handleCellSizeChange = (newCellSize: CellSize) => {
    const canvas = canvasRef;
    if (!canvas) return;

    setIsResizing(true);
    renderSettings.cellSize = newCellSize;
    setCellSize(newCellSize);

    const cols = Math.ceil(canvas.width / newCellSize.width);
    const rows = Math.ceil(canvas.height / newCellSize.height);

    if (sourceImage) {
      const newGrid = convertBitmapToGrid(
        sourceImage.bitmap,
        cols,
        rows,
        IMAGE_ASCII_CHARS,
        newCellSize,
        fitMode,
        blackPointVal,
        whitePointVal,
        renderSettings.invert
      );

      if (editOverlay) {
        newGrid.forEach((cell) => {
          const edit = sampleEditsForCell(editOverlay!, cell.col, cell.row, newCellSize);
          if (edit) {
            cell.currentLevel = applyEditToLevel(cell.baseLevel, edit, IMAGE_ASCII_CHARS.length - 1);
          }
        });
      }

      grid = newGrid;
    } else {
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
      grid = blankGrid;
    }

    renderGrid();
    setIsResizing(false);
  };

  const debouncedCellSizeChange = useDebounce(handleCellSizeChange, 100);

  // Generate grid with variable cell dimensions (Palette mode)
  const generateGridWithVariableDimensions = (varDims: VariableCellDimensions) => {
    const canvas = canvasRef;
    if (!canvas) return;

    const cols = varDims.columnWidths.length;
    const rows = varDims.rowHeights.length;

    if (sourceImage) {
      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      const tempCtx = tempCanvas.getContext("2d");
      if (!tempCtx) return;

      const { bitmap, width: srcW, height: srcH } = sourceImage;
      let dx: number, dy: number, dw: number, dh: number;

      if (fitMode === "cover") {
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
      const maxLevel = IMAGE_ASCII_CHARS.length - 1;

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const cellX = varDims.columnOffsets[col];
          const cellY = varDims.rowOffsets[row];
          const cellW = varDims.columnWidths[col];
          const cellH = varDims.rowHeights[row];

          const centerX = Math.floor(cellX + cellW / 2);
          const centerY = Math.floor(cellY + cellH / 2);
          const pixelIndex = (centerY * canvas.width + centerX) * 4;

          const r = pixels[pixelIndex] || 0;
          const g = pixels[pixelIndex + 1] || 0;
          const b = pixels[pixelIndex + 2] || 0;
          const a = pixels[pixelIndex + 3] || 255;

          const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
          const normalized = luminance / 255;
          let level = Math.floor(normalized * maxLevel);

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

      grid = newGrid;
    } else {
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
      grid = blankGrid;
    }
  };

  // Handle shuffle button
  const handleShuffleDimensions = () => {
    const canvas = canvasRef;
    if (!canvas || renderSettings.style !== "Palette") return;

    setIsResizing(true);

    const varDims = generateVariableDimensions(canvas.width, canvas.height, cellSizeRange());
    variableDimensions = varDims;
    generateGridWithVariableDimensions(varDims);

    renderGrid();
    setIsResizing(false);
  };

  // Handle cell size range change (Palette mode)
  const handleCellSizeRangeChange = (newRange: CellSizeRange) => {
    setCellSizeRange(newRange);

    const canvas = canvasRef;
    if (!canvas || renderSettings.style !== "Palette") return;

    setIsResizing(true);

    const varDims = generateVariableDimensions(canvas.width, canvas.height, newRange);
    variableDimensions = varDims;
    generateGridWithVariableDimensions(varDims);

    renderGrid();
    setIsResizing(false);
  };

  const debouncedCellSizeRangeChange = useDebounce(handleCellSizeRangeChange, 200);

  // Handle color mode toggle
  const handleColorModeToggle = () => {
    const modes: ColorMode[] = ["monochrome", "original", "mixed"];
    const currentIndex = modes.indexOf(colorMode());
    const newMode = modes[(currentIndex + 1) % modes.length];

    setColorMode(newMode);
    renderSettings.colorMode = newMode;
    renderGrid();
  };

  // Handle setting mixed mode directly
  const handleSetMixedMode = () => {
    setColorMode("mixed");
    renderSettings.colorMode = "mixed";
    renderGrid();
  };

  // Resize grid while preserving content (center-anchored)
  const resizeGridPeriphery = (newWidth: number, newHeight: number) => {
    const canvas = canvasRef;
    if (!canvas) return;

    const oldGrid = grid;
    const { cols: oldCols, rows: oldRows } = getCanvasDimensions(canvas);
    const currentCellSize = renderSettings.cellSize;

    const newCols = Math.ceil(newWidth / currentCellSize.width);
    const newRows = Math.ceil(newHeight / currentCellSize.height);

    const colOffset = Math.floor((newCols - oldCols) / 2);
    const rowOffset = Math.floor((newRows - oldRows) / 2);

    bgOffset.x += colOffset * currentCellSize.width;
    bgOffset.y += rowOffset * currentCellSize.height;
    setBgOffsetX(bgOffset.x);
    setBgOffsetY(bgOffset.y);

    const newGrid: ColorCharCell[] = new Array(newCols * newRows);

    const maxLevel = asciiCharsDraw.length - 1;
    const blankLevel = mapLevel(0, maxLevel, renderSettings.invert);

    for (let row = 0; row < newRows; row++) {
      for (let col = 0; col < newCols; col++) {
        const newIndex = row * newCols + col;
        const oldCol = col - colOffset;
        const oldRow = row - rowOffset;

        if (oldRow >= 0 && oldRow < oldRows && oldCol >= 0 && oldCol < oldCols) {
          const oldIndex = oldRow * oldCols + oldCol;
          const cell = oldGrid[oldIndex];
          cell.col = col;
          cell.row = row;
          newGrid[newIndex] = cell;
        } else {
          newGrid[newIndex] = {
            baseLevel: blankLevel,
            currentLevel: blankLevel,
            col,
            row,
            r: 0,
            g: 0,
            b: 0,
          };
        }
      }
    }
    grid = newGrid;

    if (editOverlay) {
      resizeOverlay(editOverlay, newWidth, newHeight);
    }
  };

  // Handle window resize
  const handleWindowResize = () => {
    const canvas = canvasRef;
    const bgCanvas = bgCanvasRef;
    if (!canvas || !bgCanvas) return;

    const newWidth = window.innerWidth;
    const newHeight = window.innerHeight;

    if (grid.length > 0) {
      resizeGridPeriphery(newWidth, newHeight);
    } else {
      const reinit = async () => {
        await initGrid();
        renderGrid();
      };
      reinit();
      return;
    }

    canvas.width = newWidth;
    canvas.height = newHeight;
    bgCanvas.width = newWidth;
    bgCanvas.height = newHeight;

    renderGrid();
    setIsResizing(false);
  };

  const handleResizeStart = () => {
    setIsResizing(true);
  };

  const debounceWindowResize = useDebounce(handleWindowResize, 200);

  const triggerResize = () => {
    handleResizeStart();
    debounceWindowResize();
  };

  // Draw a single cell
  const drawCell = (ctx: CanvasRenderingContext2D, cell: ColorCharCell) => {
    const varDims = variableDimensions;
    const isPaletteWithVarDims = renderSettings.style === "Palette" && varDims !== null;

    let x: number;
    let y: number;
    let cellW: number;
    let cellH: number;
    let cellSizeOverride: CellSize | undefined;

    if (isPaletteWithVarDims) {
      x = varDims.columnOffsets[cell.col];
      y = varDims.rowOffsets[cell.row];
      cellW = varDims.columnWidths[cell.col];
      cellH = varDims.rowHeights[cell.row];
      cellSizeOverride = { width: cellW, height: cellH };
    } else {
      const currentCellSize = renderSettings.cellSize;
      x = cell.col * currentCellSize.width;
      y = cell.row * currentCellSize.height;
      cellW = currentCellSize.width;
      cellH = currentCellSize.height;
    }

    ctx.clearRect(x, y, cellW, cellH);

    if (cell.isTransparent && bgCanvasRef) {
      const bgCtx = bgCanvasRef.getContext("2d");
      if (bgCtx) {
        ctx.drawImage(bgCanvasRef, x, y, cellW, cellH, x, y, cellW, cellH);
      }
    } else {
      renderCell(ctx, cell, renderSettings, x, y, asciiCharsDraw, colors, cellSizeOverride);
    }
  };

  // Get cell at mouse/touch position
  const getCellAtPosition = (canvas: HTMLCanvasElement, x: number, y: number) => {
    const varDims = variableDimensions;
    const isPaletteWithVarDims = renderSettings.style === "Palette" && varDims !== null;

    let col: number;
    let row: number;
    let cols: number;
    let rows: number;

    if (isPaletteWithVarDims) {
      col = findColumnAtX(x, varDims.columnOffsets);
      row = findRowAtY(y, varDims.rowOffsets);
      cols = varDims.columnWidths.length;
      rows = varDims.rowHeights.length;
    } else {
      const currentCellSize = renderSettings.cellSize;
      col = Math.floor(x / currentCellSize.width);
      row = Math.floor(y / currentCellSize.height);
      cols = Math.ceil(canvas.width / currentCellSize.width);
      rows = Math.ceil(canvas.height / currentCellSize.height);
    }

    if (col < 0 || col >= cols || row < 0 || row >= rows) {
      return undefined;
    }

    const index = row * cols + col;
    return grid[index];
  };

  // Handle drawing
  const handleDraw = (e: MouseEvent | TouchEvent) => {
    const canvas = canvasRef;
    if (!isDragging || !canvas) return;

    if (animationFrameId) return;

    animationFrameId = requestAnimationFrame(() => {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const rect = canvas.getBoundingClientRect();
      const x = "touches" in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
      const y = "touches" in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

      const cell = getCellAtPosition(canvas, x, y);
      if (cell) {
        const isDifferentCell =
          !lastDrawnCell || lastDrawnCell.row !== cell.row || lastDrawnCell.col !== cell.col;

        if (isDifferentCell) {
          const mode = drawingModeVal;
          const currentCellSize = renderSettings.cellSize;
          const maxLevel = asciiCharsDraw.length - 1;

          switch (mode) {
            case "brush":
              if (renderSettings.style === "Palette" && renderSettings.colorMode !== "monochrome") {
                const hex = selectedPaletteColorVal;
                const r = Number.parseInt(hex.slice(1, 3), 16);
                const g = Number.parseInt(hex.slice(3, 5), 16);
                const b = Number.parseInt(hex.slice(5, 7), 16);

                if ("r" in cell && "g" in cell && "b" in cell) {
                  cell.r = r;
                  cell.g = g;
                  cell.b = b;
                  cell.currentLevel = maxLevel;
                }
                cell.isTransparent = false;
              } else {
                cell.currentLevel = mapLevel(selectedSymbolVal, maxLevel, renderSettings.invert);
                cell.isTransparent = false;
              }
              break;
            case "increment":
              cell.isTransparent = false;
              if (
                renderSettings.style === "Palette" &&
                renderSettings.colorMode !== "monochrome" &&
                "r" in cell
              ) {
                cell.r = Math.min(cell.r + 10, 255);
                cell.g = Math.min(cell.g + 10, 255);
                cell.b = Math.min(cell.b + 10, 255);
              } else {
                cell.currentLevel = Math.min(cell.currentLevel + 1, maxLevel);
              }
              break;
            case "decrement":
              cell.isTransparent = false;
              if (
                renderSettings.style === "Palette" &&
                renderSettings.colorMode !== "monochrome" &&
                "r" in cell
              ) {
                cell.r = Math.max(cell.r - 10, 0);
                cell.g = Math.max(cell.g - 10, 0);
                cell.b = Math.max(cell.b - 10, 0);
              } else {
                cell.currentLevel = Math.max(cell.currentLevel - 1, 0);
              }
              break;
            case "eraser":
              cell.isTransparent = true;
              cell.currentLevel = renderSettings.invert ? maxLevel : 0;
              break;
          }

          if (editOverlay && mode) {
            recordEdit(editOverlay, cell.col, cell.row, currentCellSize, {
              level:
                mode === "brush"
                  ? mapLevel(selectedSymbolVal, maxLevel, renderSettings.invert)
                  : undefined,
              delta: mode === "increment" ? 1 : mode === "decrement" ? -1 : undefined,
              mode,
            });
          }

          lastDrawnCell = { row: cell.row, col: cell.col };
          ctx.font = getFontForCellSize(currentCellSize.height);
          ctx.textBaseline = "top";
          drawCell(ctx, cell);
        }
      }

      animationFrameId = undefined;
    });
  };

  const handleStart = (e: MouseEvent | TouchEvent) => {
    isDragging = true;
    handleDraw(e);
  };

  const handleEnd = () => {
    isDragging = false;
    lastDrawnCell = null;
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = undefined;
    }
  };

  // Handle contrast change
  const handleContrastChange = (newBlackPoint: number, newWhitePoint: number) => {
    blackPointVal = newBlackPoint;
    whitePointVal = newWhitePoint;
    setBlackPoint(newBlackPoint);
    setWhitePoint(newWhitePoint);

    if (!sourceImage) return;

    const canvas = canvasRef;
    if (!canvas) return;

    const currentCellSize = renderSettings.cellSize;
    const cols = Math.ceil(canvas.width / currentCellSize.width);
    const rows = Math.ceil(canvas.height / currentCellSize.height);
    const newGrid = convertBitmapToGrid(
      sourceImage.bitmap,
      cols,
      rows,
      IMAGE_ASCII_CHARS,
      currentCellSize,
      fitMode,
      newBlackPoint,
      newWhitePoint,
      renderSettings.invert
    );

    if (editOverlay) {
      newGrid.forEach((cell) => {
        const edit = sampleEditsForCell(editOverlay!, cell.col, cell.row, currentCellSize);
        if (edit) {
          cell.currentLevel = applyEditToLevel(cell.baseLevel, edit, IMAGE_ASCII_CHARS.length - 1);
        }
      });
    }

    grid = newGrid;
    renderGrid();
  };

  const debouncedContrastChange = useDebounce(handleContrastChange, 100);

  // Handle background controls
  const handleBgBlurChange = (value: number) => {
    bgBlurVal = value;
    setBgBlur(value);
    drawBackground();
  };

  const handleBgScaleChange = (value: number) => {
    bgScaleVal = value;
    setBgScale(value);
    drawBackground();
  };

  const handleBgOffsetChange = (x: number, y: number) => {
    bgOffset.x = x;
    bgOffset.y = y;
    setBgOffsetX(x);
    setBgOffsetY(y);
    drawBackground();
  };

  // Handle reset
  const handleReset = () => {
    blackPointVal = 0;
    whitePointVal = 1;
    setBlackPoint(0);
    setWhitePoint(1);

    bgBlurVal = 4;
    bgScaleVal = 1;
    bgOffset.x = 0;
    bgOffset.y = 0;
    setBgBlur(4);
    setBgScale(1);
    setBgOffsetX(0);
    setBgOffsetY(0);

    grid.forEach((cell) => {
      cell.currentLevel = cell.baseLevel;
    });

    if (editOverlay) {
      clearOverlay(editOverlay);
    }

    if (sourceImage) {
      handleContrastChange(0, 1);
    } else {
      renderGrid();
    }
  };

  // Handle clear
  const handleClear = () => {
    const canvas = canvasRef;
    if (!canvas) return;

    if (sourceImage?.bitmap) {
      sourceImage.bitmap.close();
    }
    sourceImage = null;
    setHasSourceImage(false);

    blackPointVal = 0;
    whitePointVal = 1;
    setBlackPoint(0);
    setWhitePoint(1);

    if (editOverlay) {
      clearOverlay(editOverlay);
    }

    const currentCellSize = renderSettings.cellSize;
    const cols = Math.ceil(canvas.width / currentCellSize.width);
    const rows = Math.ceil(canvas.height / currentCellSize.height);
    const maxLevel = IMAGE_ASCII_CHARS.length - 1;
    const blankLevel = mapLevel(0, maxLevel, renderSettings.invert);

    const blankGrid: ColorCharCell[] = new Array(cols * rows);
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        blankGrid[row * cols + col] = {
          baseLevel: blankLevel,
          currentLevel: blankLevel,
          row,
          col,
          r: 0,
          g: 0,
          b: 0,
        };
      }
    }
    grid = blankGrid;

    renderGrid();
  };

  // Handle toggle drawing mode
  const handleToggleMode = () => {
    if (props.drawingMode) {
      grid.forEach((cell) => {
        cell.currentLevel = cell.baseLevel;
      });
      if (editOverlay) {
        clearOverlay(editOverlay);
      }
    }

    props.onToggleDrawingMode();
    renderGrid();
  };

  // Handle style toggle
  const handleStyleToggle = () => {
    const canvas = canvasRef;
    const currentStyle = style();
    const newStyle =
      STYLES.indexOf(currentStyle) === STYLES.length - 1
        ? STYLES[0]
        : STYLES[STYLES.indexOf(currentStyle) + 1];

    setStyle(newStyle);

    if (newStyle === "Palette" && canvas) {
      const varDims = generateVariableDimensions(canvas.width, canvas.height, cellSizeRange());
      variableDimensions = varDims;
      generateGridWithVariableDimensions(varDims);
      renderGrid();
    } else {
      variableDimensions = null;

      const newCellSize = adjustCellSizeForStyle(cellSize(), newStyle);
      if (newCellSize.width !== cellSize().width || newCellSize.height !== cellSize().height) {
        debouncedCellSizeChange(newCellSize);
      }
    }
  };

  // Handle download PNG
  const handleDownloadPng = async () => {
    const canvas = canvasRef;
    const bgCanvas = bgCanvasRef;
    if (!canvas || !bgCanvas) return;

    const exportCanvas = document.createElement("canvas");
    exportCanvas.width = canvas.width;
    exportCanvas.height = canvas.height;
    const exportCtx = exportCanvas.getContext("2d");
    if (!exportCtx) return;

    exportCtx.drawImage(bgCanvas, 0, 0);
    exportCtx.drawImage(canvas, 0, 0);

    exportCanvas.toBlob(async (blob) => {
      if (!blob) return;

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ascii-art-${Date.now()}.png`;
      a.click();
      URL.revokeObjectURL(url);

      const { cols, rows } = getCanvasDimensions(canvas);
      const txtContent = generateAsciiTxt({
        grid,
        symbols: asciiCharsDraw,
        cols,
        rows,
        theme: theme(),
      });

      await uploadAsciiToR2(txtContent);
    });
  };

  // Handle download TXT
  const handleDownloadTxt = async () => {
    const canvas = canvasRef;
    if (!canvas) return;

    const { cols, rows } = getCanvasDimensions(canvas);

    const txtContent = generateAsciiTxt({
      grid,
      symbols: asciiCharsDraw,
      cols,
      rows,
      theme: theme(),
    });

    const blob = new Blob([txtContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ascii-art-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);

    await uploadAsciiToR2(txtContent);
  };

  // Handle image upload
  const handleImageUpload = async (file: File) => {
    setIsConverting(true);
    try {
      const canvas = canvasRef;
      if (!canvas) return;

      const currentCellSize = renderSettings.cellSize;
      const cols = Math.ceil(canvas.width / currentCellSize.width);
      const rows = Math.ceil(canvas.height / currentCellSize.height);

      const bitmap = await createImageBitmap(file);

      if (sourceImage?.bitmap) {
        sourceImage.bitmap.close();
      }

      sourceImage = { bitmap, width: bitmap.width, height: bitmap.height };
      setHasSourceImage(true);

      editOverlay = createEditOverlay(canvas.width, canvas.height);
      fitMode = "contain";

      const convertedGrid = await convertImageToGrid(
        file,
        cols,
        rows,
        IMAGE_ASCII_CHARS,
        currentCellSize,
        "contain",
        blackPointVal,
        whitePointVal,
        renderSettings.invert
      );

      grid = convertedGrid;
      renderGrid();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to convert the image";
      throw new Error(message);
    } finally {
      setIsConverting(false);
    }
  };

  // Handle paste
  const handlePaste = (e: ClipboardEvent) => {
    e.preventDefault();
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith("image/")) {
        const file = items[i].getAsFile();
        if (file) {
          handleImageUpload(file);
        }
        break;
      }
    }
  };

  // Initialize canvas and attach listeners
  onMount(() => {
    const canvas = canvasRef;
    const bgCanvas = bgCanvasRef;
    if (!canvas || !bgCanvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    bgCanvas.width = window.innerWidth;
    bgCanvas.height = window.innerHeight;

    const initializeGrid = async () => {
      await initGrid();
      renderGrid();
    };
    initializeGrid();

    window.addEventListener("resize", triggerResize);
    canvas.addEventListener("mousedown", handleStart);
    canvas.addEventListener("mousemove", handleDraw);
    canvas.addEventListener("mouseup", handleEnd);
    canvas.addEventListener("mouseleave", handleEnd);
    document.addEventListener("paste", handlePaste);

    canvas.addEventListener("touchstart", handleStart);
    canvas.addEventListener("touchmove", handleDraw);
    canvas.addEventListener("touchend", handleEnd);
  });

  onCleanup(() => {
    const canvas = canvasRef;

    window.removeEventListener("resize", triggerResize);
    if (canvas) {
      canvas.removeEventListener("mousedown", handleStart);
      canvas.removeEventListener("mousemove", handleDraw);
      canvas.removeEventListener("mouseup", handleEnd);
      canvas.removeEventListener("mouseleave", handleEnd);
      canvas.removeEventListener("touchstart", handleStart);
      canvas.removeEventListener("touchmove", handleDraw);
      canvas.removeEventListener("touchend", handleEnd);
    }
    document.removeEventListener("paste", handlePaste);

    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
    }

    if (sourceImage?.bitmap) {
      sourceImage.bitmap.close();
    }
  });

  // Handle symbol selection
  const handleSelectSymbol = (index: number) => {
    setSelectedSymbol(index);
  };

  // Handle palette color selection
  const handleSelectPaletteColor = (color: string) => {
    setSelectedPaletteColor(color);
  };

  // Handle drawing mode selection
  const handleModeSelect = (mode: "brush" | "increment" | "decrement" | "eraser") => {
    props.setMode(mode);
  };

  return (
    <>
      <Show when={props.drawingMode}>
        <div
          class={`flex flex-col text-center p-8 font-mono text-sm items-center justify-center md:hidden absolute top-0 left-0 w-full h-screen overflow-hidden ${props.drawingMode ? "opacity-100 z-100" : "opacity-15 z-0"
            }`}
        >
          <p>
            There's quiet a nice drawing tool on this website, but atm it's only available on the
            desktop.
          </p>
          <p class="my-6">See you there.</p>
          <button
            type="button"
            onClick={() => props.setMode(null)}
            class="nice-button"
          >
            <span>back to the website</span>
          </button>
        </div>
      </Show>

      <div
        class={`hidden md:block absolute top-0 left-0 w-full h-screen overflow-hidden ${!props.drawingMode
          ? renderSettings.invert
            ? "opacity-[7%] z-0"
            : "opacity-15 z-0"
          : "opacity-100 z-100"
          } transition-opacity duration-300`}
        role="button"
        tabIndex={props.drawingMode ? -1 : 0}
        onMouseDown={() => {
          if (!props.drawingMode) {
            handleToggleMode();
          }
        }}
        onKeyDown={(e) => {
          if (props.drawingMode && (e.metaKey || e.ctrlKey) && e.key === "s") {
            e.preventDefault();
            handleDownloadPng();
          }
        }}
      >
        <ResizingIndicator isResizing={isResizing()} drawingMode={props.drawingMode} />

        <canvas
          ref={(el) => (bgCanvasRef = el)}
          class={`inset-0 z-0 w-full h-full ${props.drawingMode ? "fixed" : "absolute"} bg-background text-foreground-07`}
        />
        <canvas
          ref={(el) => (canvasRef = el)}
          class={`inset-0 z-10 w-full h-full cursor-crosshair ${props.drawingMode ? "fixed" : "absolute"}`}
        />

        <Show when={props.drawingMode}>
          <div class="fixed top-4 right-4 left-4 flex justify-between p-2 gap-2 z-200 bg-foreground/10 text-foreground rounded-2xl backdrop-blur">
            <div class="flex gap-1 items-center flex-wrap">
              <NavButton text={style()} onClick={handleStyleToggle} />
              <Divider vertical class="bg-foreground-07/20 mx-2" />
              <CellSizeSelector
                cellSize={cellSize()}
                onCellSizeChange={debouncedCellSizeChange}
                style={style()}
                cellSizeRange={cellSizeRange()}
                onCellSizeRangeChange={debouncedCellSizeRangeChange}
                onShuffle={handleShuffleDimensions}
              />
              <Divider vertical class="bg-foreground-07/20 mx-2" />
              <ColorModeToggle
                colorMode={colorMode()}
                onToggle={handleColorModeToggle}
                disabled={!hasSourceImage()}
              />
              <Divider vertical class="bg-foreground-07/20 mx-2" />
              <div class="flex gap-1 h-full">
                <NavButton
                  onClick={() => {
                    handleModeSelect(theme() === "light" ? "increment" : "decrement");
                  }}
                  isSelected={
                    props.drawingMode === (theme() === "light" ? "increment" : "decrement")
                  }
                  text="Darken"
                  icon={<Darken stroke={1} />}
                />
                <NavButton
                  onClick={() => {
                    handleModeSelect(theme() === "light" ? "decrement" : "increment");
                  }}
                  isSelected={
                    props.drawingMode === (theme() === "light" ? "decrement" : "increment")
                  }
                  text="Lighten"
                  icon={<Lighten stroke={1} />}
                />
                <NavButton
                  onClick={() => handleModeSelect("eraser")}
                  isSelected={props.drawingMode === "eraser"}
                  text="Eraser"
                  icon={<Eraser stroke={1} />}
                />
                <Show
                  when={style() === "Palette" && colorMode() !== "monochrome"}
                  fallback={
                    <SymbolSelector
                      selectedSymbol={selectedSymbol()}
                      onSelectSymbol={handleSelectSymbol}
                      onModeSelect={() => handleModeSelect("brush")}
                      isSelected={props.drawingMode === "brush"}
                      style={style()}
                    />
                  }
                >
                  <PaletteColorPicker
                    selectedColor={selectedPaletteColor()}
                    onSelectColor={handleSelectPaletteColor}
                    onModeSelect={() => handleModeSelect("brush")}
                    isSelected={props.drawingMode === "brush"}
                  />
                </Show>
              </div>
            </div>

            <DrawingControls
              onDownloadPng={handleDownloadPng}
              onDownloadTxt={handleDownloadTxt}
              onExit={handleToggleMode}
              onImageUpload={handleImageUpload}
              onReset={handleReset}
              onClear={handleClear}
              isConverting={isConverting()}
              blackPoint={blackPoint()}
              whitePoint={whitePoint()}
              onBlackPointChange={(v) => debouncedContrastChange(v, whitePointVal)}
              onWhitePointChange={(v) => debouncedContrastChange(blackPointVal, v)}
              bgBlur={bgBlur()}
              bgScale={bgScale()}
              bgOffsetX={bgOffsetX()}
              bgOffsetY={bgOffsetY()}
              onBgBlurChange={handleBgBlurChange}
              onBgScaleChange={handleBgScaleChange}
              onBgOffsetChange={handleBgOffsetChange}
              hasSourceImage={hasSourceImage()}
              colorMode={colorMode()}
              onSetMixedMode={handleSetMixedMode}
              renderStyle={style()}
            />
          </div>
        </Show>
      </div>
    </>
  );
}
