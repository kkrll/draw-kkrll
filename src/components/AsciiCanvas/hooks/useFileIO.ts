import type { Setter } from "solid-js";
import type { CanvasState } from "../types";
import type { RenderSettings } from "../../../lib/types";
import convertImageToGrid from "../../../lib/imageToAscii";
import { createEditOverlay } from "../../../lib/editOverlay";
import { generateAsciiTxt, uploadAsciiToR2 } from "../../../lib/asciiSavingUtils";
import { IMAGE_ASCII_CHARS } from "../../../lib/constants";
import { theme } from "../../../stores/theme";

interface UseFileIODeps {
  canvasState: CanvasState;
  renderSettings: RenderSettings;
  renderGrid: () => void;
  drawBackground: () => void;
  getCanvasDimensions: () => { cols: number; rows: number };

  // Signal setters
  setIsConverting: Setter<boolean>;
  setHasSourceImage: Setter<boolean>;

  // For contrast values (needed for image upload)
  blackPointVal: () => number;
  whitePointVal: () => number;
}

export function useFileIO(deps: UseFileIODeps) {
  const {
    canvasState,
    renderSettings,
    renderGrid,
    drawBackground,
    getCanvasDimensions,
    setIsConverting,
    setHasSourceImage,
    blackPointVal,
    whitePointVal,
  } = deps;

  const handleImageUpload = async (file: File) => {
    setIsConverting(true)
    try {
      const canvas = canvasState.canvasRef.current
      if (!canvas) return

      const currentCellSize = renderSettings.cellSize
      const cols = Math.ceil(canvas.width / currentCellSize.width)
      const rows = Math.ceil(canvas.height / currentCellSize.height)

      const bitmap = await createImageBitmap(file)

      if (canvasState.sourceImage.current?.bitmap) {
        canvasState.sourceImage.current.bitmap.close()
      }

      canvasState.sourceImage.current = {
        bitmap,
        width: bitmap.width,
        height: bitmap.height
      }
      setHasSourceImage(true)

      canvasState.editOverlay.current = createEditOverlay(canvas.width, canvas.height)
      canvasState.fitMode.current = "contain"

      const convertedGrid = await convertImageToGrid(
        file,
        cols,
        rows,
        IMAGE_ASCII_CHARS,
        currentCellSize,
        "contain",
        blackPointVal(),
        whitePointVal(),
        renderSettings.invert
      );

      canvasState.grid.current = convertedGrid
      drawBackground()
      renderGrid()
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to convert the image"
      throw new Error(message)
    } finally {
      setIsConverting(false)
    }
  }

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

  const handleDownloadPng = async () => {
    const canvas = canvasState.canvasRef.current;
    const bgCanvas = canvasState.bgCanvasRef.current;
    if (!canvas || !bgCanvas) return;

    // Create export canvas combining bg and main canvas
    const exportCanvas = document.createElement("canvas");
    exportCanvas.width = canvas.width;
    exportCanvas.height = canvas.height;
    const exportCtx = exportCanvas.getContext("2d");
    if (!exportCtx) return;

    exportCtx.drawImage(bgCanvas, 0, 0);
    exportCtx.drawImage(canvas, 0, 0);

    exportCanvas.toBlob(async (blob) => {
      if (!blob) return;

      // Download the PNG
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ascii-art-${Date.now()}.png`;
      a.click();
      URL.revokeObjectURL(url);

      // Also upload TXT version to R2
      const { cols, rows } = getCanvasDimensions();
      const txtContent = generateAsciiTxt({
        grid: canvasState.grid.current,
        symbols: canvasState.asciiChars.current,
        cols,
        rows,
        theme: theme(),
      });

      await uploadAsciiToR2(txtContent);
    });
  };

  const handleDownloadTxt = async () => {
    const canvas = canvasState.canvasRef.current;
    if (!canvas) return;

    const { cols, rows } = getCanvasDimensions();

    const txtContent = generateAsciiTxt({
      grid: canvasState.grid.current,
      symbols: canvasState.asciiChars.current,
      cols,
      rows,
      theme: theme(),
    });

    // Download the TXT
    const blob = new Blob([txtContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ascii-art-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);

    // Upload to R2
    await uploadAsciiToR2(txtContent);
  };

  return {
    handleImageUpload,
    handlePaste,
    handleDownloadPng,
    handleDownloadTxt,
  };
}
