import { createEffect, onCleanup, type Accessor } from "solid-js";
import type { HookDependencies } from "../types";
import type { ColorCharCell, DrawingModes } from "../../../lib/types";
import { recordEdit } from "../../../lib/editOverlay";
import { renderCell } from "../../../lib/renderingUtils";
import { findColumnAtX, findRowAtY } from "../../../lib/variableDimensions";
import { track } from "../../../lib/posthog";

interface UseDrawingDeps extends HookDependencies {
  // Signals for drawing state (read-only in this hook)
  selectedSymbol: Accessor<number>;
  selectedPaletteColor: Accessor<string>;
  drawingMode: Accessor<DrawingModes>;
}

export function useDrawing(deps: UseDrawingDeps) {
  const {
    canvasState,
    renderSettings,
    renderGrid,
    selectedSymbol,
    selectedPaletteColor,
    drawingMode,
  } = deps;

  let isDragging = false;
  let animationFrameId: number | null = null
  let lastDrawnCell: { col: number; row: number } | null = null

  let selectedSymbolVal = selectedSymbol()
  let selectedPaletteColorVal = selectedPaletteColor()
  let drawingModeVal = drawingMode()

  createEffect(() => {
    selectedSymbolVal = selectedSymbol()
  })
  createEffect(() => {
    selectedPaletteColorVal = selectedPaletteColor()
  })
  createEffect(() => {
    drawingModeVal = drawingMode()
  })

  const getCellAtPosition = (x: number, y: number): ColorCharCell | undefined => {
    const canvas = canvasState.canvasRef.current;
    if (!canvas) return undefined;

    const isPaletteWithVarDims =
      renderSettings.style === "Palette" && canvasState.variableDimensions.current
      !== null;

    let col: number;
    let row: number;
    let cols: number;
    let rows: number;

    if (isPaletteWithVarDims) {
      const varDims = canvasState.variableDimensions.current!;
      col = findColumnAtX(x, varDims.columnOffsets);
      row = findRowAtY(y, varDims.rowOffsets);
      cols = varDims.columnWidths.length;
      rows = varDims.rowHeights.length;
    } else {
      col = Math.floor(x / renderSettings.cellSize.width);
      row = Math.floor(y / renderSettings.cellSize.height);
      cols = Math.ceil(canvas.width / renderSettings.cellSize.width);
      rows = Math.ceil(canvas.height / renderSettings.cellSize.height);
    }

    if (col < 0 || col >= cols || row < 0 || row >= rows) {
      return undefined;
    }

    const index = row * cols + col;
    return canvasState.grid.current[index];
  };

  // Draw a single cell to canvas
  const drawCell = (cell: ColorCharCell) => {
    const canvas = canvasState.canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const isPaletteWithVarDims =
      renderSettings.style === "Palette" && canvasState.variableDimensions.current
      !== null;

    let x: number;
    let y: number;
    let cellW: number;
    let cellH: number;
    let cellSizeOverride: { width: number; height: number } | undefined;

    if (isPaletteWithVarDims) {
      const varDims = canvasState.variableDimensions.current!;
      x = varDims.columnOffsets[cell.col];
      y = varDims.rowOffsets[cell.row];
      cellW = varDims.columnWidths[cell.col];
      cellH = varDims.rowHeights[cell.row];
      cellSizeOverride = { width: cellW, height: cellH };
    } else {
      x = cell.col * renderSettings.cellSize.width;
      y = cell.row * renderSettings.cellSize.height;
      cellW = renderSettings.cellSize.width;
      cellH = renderSettings.cellSize.height;
    }

    ctx.clearRect(x, y, cellW, cellH);

    if (cell.isTransparent && canvasState.bgCanvasRef.current) {
      const bgCtx = canvasState.bgCanvasRef.current.getContext("2d");
      if (bgCtx) {
        ctx.drawImage(canvasState.bgCanvasRef.current, x, y, cellW, cellH, x, y,
          cellW, cellH);
      }
    } else {
      renderCell(
        ctx,
        cell,
        renderSettings,
        x,
        y,
        canvasState.asciiChars.current,
        canvasState.colors.current,
        cellSizeOverride
      );
    }
  };

  const handleStart = (e: MouseEvent | TouchEvent) => {
    isDragging = true
    lastDrawnCell = null
    if (drawingModeVal) {
      track("drawing_started", { mode: drawingModeVal })
    }
    handleDraw(e)
  }

  const handleEnd = () => {
    isDragging = false
    lastDrawnCell = null
    if (animationFrameId !== null) {
      cancelAnimationFrame(animationFrameId)
      animationFrameId = null
    }
  }

  const handleDraw = (e: MouseEvent | TouchEvent) => {
    if (!drawingModeVal) return
    if (!isDragging && e.type !== "mousedown" && e.type !== "touchstart") return

    const canvas = canvasState.canvasRef.current
    if (!canvas) return

    if (animationFrameId !== null) {
      cancelAnimationFrame(animationFrameId)
    }

    animationFrameId = requestAnimationFrame(() => {
      const rect = canvas.getBoundingClientRect()
      let clientX: number
      let clientY: number

      if (e.type.startsWith("touch")) {
        const touch = (e as TouchEvent).touches[0]
        if (!touch) return
        clientX = touch.clientX
        clientY = touch.clientY
      } else {
        clientX = (e as MouseEvent).clientX
        clientY = (e as MouseEvent).clientY
      }

      const x = clientX - rect.left
      const y = clientY - rect.top

      const cell = getCellAtPosition(x, y)
      if (!cell) return

      const isDifferentCell =
        !lastDrawnCell || lastDrawnCell.row !== cell.row || lastDrawnCell.col !== cell.col;
      if (!isDifferentCell) return

      lastDrawnCell = { col: cell.col, row: cell.row }

      const editOverlay = canvasState.editOverlay.current
      const maxLevel = canvasState.asciiChars.current.length - 1

      let currentCellSize = renderSettings.cellSize;
      if (renderSettings.style === "Palette" && canvasState.variableDimensions.current) {
        const varDims = canvasState.variableDimensions.current;
        currentCellSize = {
          width: varDims.columnWidths[cell.col],
          height: varDims.rowHeights[cell.row],
        };
      }

      switch (drawingModeVal) {
        case "brush":
          cell.isTransparent = false;
          cell.currentLevel = selectedSymbolVal
          if (renderSettings.style === "Palette" && renderSettings.colorMode !== "monochrome") {
            const hex = selectedPaletteColorVal
            const r = Number.parseInt(hex.slice(1, 3), 16)
            const g = Number.parseInt(hex.slice(3, 5), 16)
            const b = Number.parseInt(hex.slice(5, 7), 16)
            cell.r = r
            cell.g = g
            cell.b = b
          }

          if (editOverlay) {
            recordEdit(editOverlay, cell.col, cell.row, currentCellSize, { level: selectedSymbolVal, mode: "brush", isTransparent: false })
          }
          break
        case "increment":
          {
            cell.isTransparent = false;

            const newLevel = Math.min(cell.currentLevel + 1, maxLevel);
            cell.currentLevel = newLevel;

            if (editOverlay) {
              recordEdit(editOverlay, cell.col, cell.row, currentCellSize, {
                delta: 1, mode: "increment", isTransparent: false
              });
            }
          }
          break

        case "decrement":
          {
            cell.isTransparent = false;

            const newLevel = Math.max(cell.currentLevel - 1, 0);
            cell.currentLevel = newLevel;

            if (editOverlay) {
              recordEdit(editOverlay, cell.col, cell.row, currentCellSize, {
                delta: -1, mode: "decrement", isTransparent: false
              });
            }
          }
          break

        case "eraser":
          cell.isTransparent = true;
          cell.currentLevel = renderSettings.invert ? maxLevel : 0;

          if (editOverlay) {
            recordEdit(editOverlay, cell.col, cell.row, currentCellSize, {
              level: cell.currentLevel,
              mode: "eraser",
              isTransparent: true
            });
          }
          break

        default:
          return
      }

      drawCell(cell)
      animationFrameId = null

    })
  }

  onCleanup(() => {
    if (animationFrameId !== null) {
      cancelAnimationFrame(animationFrameId);
    }
  });

  return {
    handleStart,
    handleDraw,
    handleEnd,
  };
}
