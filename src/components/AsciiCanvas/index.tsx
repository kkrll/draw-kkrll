import {
  createSignal,
  createEffect,
  onMount,
  onCleanup,
  Show,
  type Accessor,
} from "solid-js";
import { AsciiCanvasProvider } from "./context";
import type { AsciiCanvasContextValue } from "./types";
import { useCanvasState } from "./hooks/useCanvasState";
import { useGridManager } from "./hooks/useGridManager";
import { useDrawing } from "./hooks/useDrawing";
import { useFileIO } from "./hooks/useFileIO";
import DrawingTools from "../DrawingTools";
import DrawingControls from "../DrawingControls";
import ResizingIndicator from "../ResizingIndicator";
import { adjustCellSizeForStyle } from "../CellSizeSelector";
import type {
  CellSize,
  CellSizeRange,
  ColorMode,
  RenderStyle,
  DrawingModes,
} from "../../lib/types";
import {
  createDefaultRenderSettings,
  renderCell,
} from "../../lib/renderingUtils";
import {
  DEFAULT_CELL_WIDTH,
  DEFAULT_CELL_HEIGHT,
  STYLES,
  getFontForCellSize,
  IMAGE_ASCII_CHARS,
} from "../../lib/constants";
import { DEFAULT_CELL_SIZE_RANGE } from "../../lib/variableDimensions";
import { theme } from "../../stores/theme";
import { useDebounce } from "../../lib/useDebounce";

interface AsciiCanvasProps {
  drawingMode: DrawingModes;
  onToggleDrawingMode: () => void;
  setMode: (mode: DrawingModes) => void;
}

export default function AsciiCanvas(props: AsciiCanvasProps) {
  const [style, setStyle] = createSignal<RenderStyle>("Ascii");
  const [cellSize, setCellSize] = createSignal<CellSize>({
    width: DEFAULT_CELL_WIDTH,
    height: DEFAULT_CELL_HEIGHT,
  });
  const [cellSizeRange, setCellSizeRange] = createSignal<CellSizeRange>(
    DEFAULT_CELL_SIZE_RANGE
  );
  const [colorMode, setColorMode] = createSignal<ColorMode>("monochrome");
  const [selectedSymbol, setSelectedSymbol] = createSignal(8);
  const [selectedPaletteColor, setSelectedPaletteColor] = createSignal("#ffffff");
  const [hasSourceImage, setHasSourceImage] = createSignal(false);
  const [isResizing, setIsResizing] = createSignal(false);
  const [isConverting, setIsConverting] = createSignal(false);
  const [blackPoint, setBlackPoint] = createSignal(0);
  const [whitePoint, setWhitePoint] = createSignal(1);
  const [bgBlur, setBgBlur] = createSignal(4);
  const [bgScale, setBgScale] = createSignal(1);
  const [bgOffsetX, setBgOffsetX] = createSignal(0);
  const [bgOffsetY, setBgOffsetY] = createSignal(0);

  const canvasState = useCanvasState();

  const renderSettings = createDefaultRenderSettings();

  const renderGrid = () => {
    const canvas = canvasState.canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const grid = canvasState.grid.current;
    if (grid.length === 0) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Set font for ASCII mode
    ctx.font = getFontForCellSize(renderSettings.cellSize.height);
    ctx.textBaseline = "top";

    // Render each cell
    if (renderSettings.style === "Palette" &&
      canvasState.variableDimensions.current) {
      // Variable dimensions mode
      const dims = canvasState.variableDimensions.current;
      for (const cell of grid) {
        const x = dims.columnOffsets[cell.col];
        const y = dims.rowOffsets[cell.row];
        const cellSizeOverride = {
          width: dims.columnWidths[cell.col],
          height: dims.rowHeights[cell.row],
        };
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
    } else {
      // Uniform cell size
      for (const cell of grid) {
        const x = cell.col * renderSettings.cellSize.width;
        const y = cell.row * renderSettings.cellSize.height;
        renderCell(
          ctx,
          cell,
          renderSettings,
          x,
          y,
          canvasState.asciiChars.current,
          canvasState.colors.current
        );
      }
    }
  };

  const drawBackground = () => {
    const canvas = canvasState.canvasRef.current;
    const bgCanvas = canvasState.bgCanvasRef.current;
    if (!canvas || !bgCanvas) return;

    const bgCtx = bgCanvas.getContext("2d");
    if (!bgCtx) return;

    // Clear background
    bgCtx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);

    // Only draw background in mixed mode with source image
    if (renderSettings.colorMode !== "mixed" || !canvasState.sourceImage.current) {
      return;
    }

    const { bitmap, width: srcW, height: srcH } = canvasState.sourceImage.current;
    const scale = bgScale();
    const blur = bgBlur();
    const offsetX = bgOffsetX();
    const offsetY = bgOffsetY();

    // Calculate scaled dimensions respecting fitMode
    const fitMode = canvasState.fitMode.current;
    const baseScale = fitMode === "cover"
      ? Math.max(canvas.width / srcW, canvas.height / srcH)
      : Math.min(canvas.width / srcW, canvas.height / srcH);
    const finalScale = baseScale * scale;
    const dw = srcW * finalScale;
    const dh = srcH * finalScale;
    const dx = (canvas.width - dw) / 2 + offsetX;
    const dy = (canvas.height - dh) / 2 + offsetY;

    // Apply blur filter
    bgCtx.filter = `blur(${blur}px)`;
    bgCtx.drawImage(bitmap, dx, dy, dw, dh);
    bgCtx.filter = "none";
  };

  const gridManager = useGridManager({
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
  });

  const drawing = useDrawing({
    canvasState,
    renderSettings,
    renderGrid,
    selectedSymbol,
    selectedPaletteColor,
    drawingMode: () => props.drawingMode,
  });

  const fileIO = useFileIO({
    canvasState,
    renderSettings,
    renderGrid,
    drawBackground,
    getCanvasDimensions: gridManager.getCanvasDimensions,
    setIsConverting,
    setHasSourceImage,
    blackPointVal: blackPoint,
    whitePointVal: whitePoint,
  });

  const handleStyleToggle = () => {
    const currentIndex = STYLES.indexOf(style());
    const nextIndex = (currentIndex + 1) % STYLES.length;
    const newStyle = STYLES[nextIndex] as RenderStyle;
    setStyle(newStyle);
    renderSettings.style = newStyle;

    if (newStyle === "Palette") {
      // Generate variable dimensions when entering Palette mode
      gridManager.handleShuffleDimensions(cellSizeRange());
    } else {
      // Reset variable dimensions when leaving Palette mode
      canvasState.variableDimensions.current = null;

      // Adjust cell size for the new style
      const currentCellSize = cellSize();
      const newCellSize = adjustCellSizeForStyle(currentCellSize, newStyle);

      if (newCellSize.width !== currentCellSize.width || newCellSize.height !== currentCellSize.height) {
        setCellSize(newCellSize);
        renderSettings.cellSize = newCellSize;
        gridManager.handleCellSizeChange(newCellSize);
      } else {
        requestAnimationFrame(renderGrid);
      }
    }
  };

  const handleColorModeToggle = () => {
    const modes: ColorMode[] = ["monochrome", "original", "mixed"];
    const currentIndex = modes.indexOf(colorMode());
    const nextIndex = (currentIndex + 1) % modes.length;
    const newMode = modes[nextIndex];
    setColorMode(newMode);
    renderSettings.colorMode = newMode;

    drawBackground();
    requestAnimationFrame(renderGrid);
  };

  const handleSetMixedMode = () => {
    setColorMode("mixed");
    renderSettings.colorMode = "mixed";
    drawBackground();
    requestAnimationFrame(renderGrid);
  };

  // handleContrastChange is now handled by gridManager.handleContrastChange

  const handleBgChange = (blur: number, scale: number, x: number, y: number) => {
    setBgBlur(blur);
    setBgScale(scale);
    setBgOffsetX(x);
    setBgOffsetY(y);
    canvasState.bgOffset.current = { x, y };
    drawBackground();
  };

  const handleToggleMode = () => {
    props.onToggleDrawingMode();
  };

  const handleModeSelect = (mode: DrawingModes) => {
    props.setMode(mode);
  };

  createEffect(() => {
    renderSettings.style = style();
  });

  // Sync render settings when color mode changes
  createEffect(() => {
    renderSettings.colorMode = colorMode();
  });

  // Sync render settings when cell size changes
  createEffect(() => {
    renderSettings.cellSize = cellSize();
  });

  // Handle theme changes (light/dark mode)
  createEffect(() => {
    const currentTheme = theme();
    renderSettings.invert = currentTheme === "light";
    gridManager.updateColors();
    requestAnimationFrame(renderGrid);
  });

  onMount(() => {
    const canvas = canvasState.canvasRef.current;
    const bgCanvas = canvasState.bgCanvasRef.current;
    if (!canvas || !bgCanvas) return;

    // Set canvas size to match container
    const container = canvas.parentElement;
    if (container) {
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      bgCanvas.width = rect.width;
      bgCanvas.height = rect.height;
    }

    // Set up canvas context
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.font = getFontForCellSize(renderSettings.cellSize.height);
      ctx.textBaseline = "top";
    }

    // Initialize grid
    gridManager.initGrid();

    // Add window resize listener
    const handleResize = () => {
      setIsResizing(true);
      gridManager.handleWindowResize();
    };
    window.addEventListener("resize", handleResize);

    // Add paste listener
    document.addEventListener("paste", fileIO.handlePaste);

    // Store cleanup references
    onCleanup(() => {
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("paste", fileIO.handlePaste);

      // Close ImageBitmap to free GPU memory
      if (canvasState.sourceImage.current?.bitmap) {
        canvasState.sourceImage.current.bitmap.close();
      }
    });
  });

  const contextValue: AsciiCanvasContextValue = {
    // Render settings
    style,
    setStyle,
    cellSize,
    setCellSize,
    cellSizeRange,
    setCellSizeRange,
    colorMode,
    setColorMode,

    // Drawing selection
    selectedSymbol,
    setSelectedSymbol,
    selectedPaletteColor,
    setSelectedPaletteColor,
    drawingMode: () => props.drawingMode,

    // Image controls
    hasSourceImage,
    blackPoint,
    whitePoint,
    bgBlur,
    bgScale,
    bgOffsetX,
    bgOffsetY,

    // Loading states
    isResizing,
    isConverting,

    // Handlers
    handlers: {
      onStyleToggle: handleStyleToggle,
      onColorModeToggle: handleColorModeToggle,
      onSetMixedMode: handleSetMixedMode,
      onCellSizeChange: (size) => {
        setCellSize(size);
        gridManager.handleCellSizeChange(size);
      },
      onCellSizeRangeChange: (range) => {
        setCellSizeRange(range);
        gridManager.handleCellSizeRangeChange(range);
      },
      onShuffleDimensions: () =>
        gridManager.handleShuffleDimensions(cellSizeRange()),
      onContrastChange: gridManager.handleContrastChange,
      onBgChange: handleBgChange,
      onReset: gridManager.handleReset,
      onClear: gridManager.handleClear,
      onDownloadPng: fileIO.handleDownloadPng,
      onDownloadTxt: fileIO.handleDownloadTxt,
      onImageUpload: fileIO.handleImageUpload,
      onModeSelect: handleModeSelect,
      onExit: handleToggleMode,
    },
  };

  return (
    <AsciiCanvasProvider value={contextValue}>
      <div class="relative w-full h-full">
        {/* Mobile warning */}
        <Show when={props.drawingMode}>
          <div class="md:hidden fixed inset-0 z-300 bg-background flex items-center
     justify-center p-8">
            <p class="text-foreground text-center">
              Drawing tool is only available on desktop devices.
              <br />
              <button
                class="mt-4 underline"
                onClick={handleToggleMode}
              >
                Go back
              </button>
            </p>
          </div>
        </Show>

        {/* Background canvas (for mixed mode) */}
        <canvas
          ref={(el) => (canvasState.bgCanvasRef.current = el)}
          class={`inset-0 z-0 w-full h-full ${props.drawingMode ? "fixed" :
            "absolute"}`}
        />

        {/* Main canvas */}
        <canvas
          ref={(el) => (canvasState.canvasRef.current = el)}
          class={`inset-0 z-10 w-full h-full cursor-crosshair ${props.drawingMode ?
            "fixed" : "absolute"}`}
          onMouseDown={drawing.handleStart}
          onMouseMove={drawing.handleDraw}
          onMouseUp={drawing.handleEnd}
          onMouseLeave={drawing.handleEnd}
          onTouchStart={drawing.handleStart}
          onTouchMove={drawing.handleDraw}
          onTouchEnd={drawing.handleEnd}
          onKeyDown={(e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === "s") {
              e.preventDefault();
              fileIO.handleDownloadPng();
            }
          }}
          tabIndex={0}
        />

        {/* Resizing indicator */}
        <ResizingIndicator isResizing={isResizing()} drawingMode={props.drawingMode} />

        {/* Toolbar */}
        <Show when={props.drawingMode}>
          <div class="hidden md:flex fixed top-4 right-4 left-4 justify-between p-2
     gap-2 z-200 bg-foreground/10 text-foreground rounded-2xl backdrop-blur">
            <DrawingTools />
            <DrawingControls />
          </div>
        </Show>
      </div>
    </AsciiCanvasProvider>
  );
}
