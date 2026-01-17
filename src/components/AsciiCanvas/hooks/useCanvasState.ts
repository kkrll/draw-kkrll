import type { ColorCharCell, Colors, SourceImage, VariableCellDimensions } from
  "../../../lib/types";
import type { EditOverlay } from "../../../lib/types";
import type { CanvasState } from "../types";
import { IMAGE_ASCII_CHARS } from "../../../lib/constants";

interface MutableRef<T> {
  current: T
}

export function useCanvasState(): CanvasState {
  const canvasRef: MutableRef<HTMLCanvasElement | undefined> = { current: undefined }
  const bgCanvasRef: MutableRef<HTMLCanvasElement | undefined> = { current: undefined }
  const grid: MutableRef<ColorCharCell[]> = { current: [] }
  const colors: MutableRef<Colors> = { current: { bg: "#111111", fg: "#ffffff" } }
  const asciiChars: MutableRef<string[]> = { current: [...IMAGE_ASCII_CHARS] }
  const sourceImage: MutableRef<SourceImage | null> = { current: null }
  const fitMode: MutableRef<"cover" | "contain"> = { current: "cover" }
  const editOverlay: MutableRef<EditOverlay | null> = { current: null }
  const variableDimensions: MutableRef<VariableCellDimensions | null> = { current: null }
  const bgOffset: MutableRef<{ x: number; y: number }> = { current: { x: 0, y: 0 } }

  return {
    canvasRef,
    bgCanvasRef,
    grid,
    colors,
    asciiChars,
    sourceImage,
    fitMode,
    editOverlay,
    variableDimensions,
    bgOffset,
  }
}
