import type { Accessor, Setter } from "solid-js";
import type {
  ColorCharCell,
  CellSize,
  CellSizeRange,
  ColorMode,
  RenderStyle,
  DrawingModes,
  SourceImage,
  Colors,
  VariableCellDimensions,
  RenderSettings,
  EditOverlay
} from "../../lib/types";

export interface AsciiCanvasContextValue {
  // Render settings (signals)
  style: Accessor<RenderStyle>;
  setStyle: Setter<RenderStyle>;
  cellSize: Accessor<CellSize>;
  setCellSize: Setter<CellSize>;
  cellSizeRange: Accessor<CellSizeRange>;
  setCellSizeRange: Setter<CellSizeRange>;
  colorMode: Accessor<ColorMode>;
  setColorMode: Setter<ColorMode>;

  // Drawing selection (signals)
  selectedSymbol: Accessor<number>;
  setSelectedSymbol: Setter<number>;
  selectedPaletteColor: Accessor<string>;
  setSelectedPaletteColor: Setter<string>;
  drawingMode: Accessor<DrawingModes>;

  // Image controls (signals)
  hasSourceImage: Accessor<boolean>;
  blackPoint: Accessor<number>;
  whitePoint: Accessor<number>;
  bgBlur: Accessor<number>;
  bgScale: Accessor<number>;
  bgOffsetX: Accessor<number>;
  bgOffsetY: Accessor<number>;

  // Loading states (signals)
  isResizing: Accessor<boolean>;
  isConverting: Accessor<boolean>;

  // Handlers (functions provided by main component)
  handlers: AsciiCanvasHandlers;
}

export interface AsciiCanvasHandlers {
  onStyleToggle: () => void;
  onColorModeToggle: () => void;
  onSetMixedMode: () => void;
  onCellSizeChange: (size: CellSize) => void;
  onCellSizeRangeChange: (range: CellSizeRange) => void;
  onShuffleDimensions: () => void;
  onContrastChange: (black: number, white: number) => void;
  onBgChange: (blur: number, scale: number, x: number, y: number) => void;
  onReset: () => void;
  onClear: () => void;
  onDownloadPng: () => void;
  onDownloadTxt: () => void;
  onImageUpload: (file: File) => void;
  onModeSelect: (mode: DrawingModes) => void;
  onExit: () => void;
}

// Canvas state returned by useCanvasState
export interface CanvasState {
  canvasRef: { current: HTMLCanvasElement | undefined };
  bgCanvasRef: { current: HTMLCanvasElement | undefined };
  grid: { current: ColorCharCell[] };
  colors: { current: Colors };
  asciiChars: { current: string[] };
  sourceImage: { current: SourceImage | null };
  fitMode: { current: "cover" | "contain" };
  editOverlay: { current: EditOverlay | null };
  variableDimensions: { current: VariableCellDimensions | null };
  bgOffset: { current: { x: number; y: number } };
}

// Shared dependencies for hooks
export interface HookDependencies {
  canvasState: CanvasState;
  renderSettings: RenderSettings;
  renderGrid: () => void;
}
