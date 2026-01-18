/**
 * Cell Size Selector Component (SolidJS)
 *
 * A popover control for adjusting cell size in the ASCII canvas.
 * Behavior differs by mode:
 * - Dot mode: Square cells (width = height) via slider
 * - ASCII mode: Maintains ~10:16 aspect ratio via slider
 * - Palette mode: Variable cell dimensions with range inputs + Shuffle
 */

import { createSignal, createEffect, Show, onMount } from "solid-js";
import { setupPopoverPosition } from "../lib/popoverPosition";
import { DEFAULT_CELL_WIDTH, MAX_CELL_SIZE, MIN_CELL_SIZE } from "../lib/constants";
import type { CellSize, CellSizeRange, RenderStyle } from "../lib/types";
import "../styles/ascii.css";

interface CellSizeSelectorProps {
  cellSize: CellSize;
  onCellSizeChange: (size: CellSize) => void;
  style: RenderStyle;
  cellSizeRange?: CellSizeRange;
  onCellSizeRangeChange?: (range: CellSizeRange) => void;
  onShuffle?: () => void;
}

/**
 * Calculate cell size based on a single "size" value and the current style.
 */
function calculateCellSize(width: number, style: RenderStyle, height?: number): CellSize {
  if (style === "Ascii") {
    return { width: width, height: Math.round(width * 2) };
  }
  return { width: width, height: height || width };
}

function getSizeValue(cellSize: CellSize): number {
  return cellSize.width;
}

export default function CellSizeSelector(props: CellSizeSelectorProps) {
  const currentSize = () => getSizeValue(props.cellSize);
  let buttonRef: HTMLButtonElement | undefined;
  let popoverRef: HTMLDivElement | undefined;

  onMount(() => {
    setupPopoverPosition(buttonRef, popoverRef);
  });

  // Local state for range inputs (Palette mode)
  const [minWidthInput, setMinWidthInput] = createSignal(
    props.cellSizeRange?.minWidth.toString() ?? DEFAULT_CELL_WIDTH.toString()
  );
  const [maxWidthInput, setMaxWidthInput] = createSignal(
    props.cellSizeRange?.maxWidth.toString() ?? DEFAULT_CELL_WIDTH.toString()
  );
  const [minHeightInput, setMinHeightInput] = createSignal(
    props.cellSizeRange?.minHeight.toString() ?? DEFAULT_CELL_WIDTH.toString()
  );
  const [maxHeightInput, setMaxHeightInput] = createSignal(
    props.cellSizeRange?.maxHeight.toString() ?? DEFAULT_CELL_WIDTH.toString()
  );

  const handleSizeChange = (value: number) => {
    const newCellSize = calculateCellSize(value, props.style);
    props.onCellSizeChange(newCellSize);
  };

  const validateValue = (value: string, min: number, max: number): number => {
    const num = Number(value);
    if (Number.isNaN(num)) return min;
    return Math.max(min, Math.min(max, Math.floor(num)));
  };

  const commitRangeChange = () => {
    if (!props.onCellSizeRangeChange) return;

    const minW = validateValue(minWidthInput(), 1, 2000);
    const maxW = validateValue(maxWidthInput(), 1, 2000);
    const minH = validateValue(minHeightInput(), 1, 2000);
    const maxH = validateValue(maxHeightInput(), 1, 2000);

    setMinWidthInput(minW.toString());
    setMaxWidthInput(maxW.toString());
    setMinHeightInput(minH.toString());
    setMaxHeightInput(maxH.toString());

    const newRange: CellSizeRange = {
      minWidth: Math.min(minW, maxW),
      maxWidth: Math.max(minW, maxW),
      minHeight: Math.min(minH, maxH),
      maxHeight: Math.max(minH, maxH),
    };

    props.onCellSizeRangeChange(newRange);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter") {
      commitRangeChange();
      (e.currentTarget as HTMLInputElement).blur();
    }
  };

  // Sync local state when cellSizeRange changes externally
  createEffect(() => {
    if (!props.cellSizeRange) return;
    setMinWidthInput(props.cellSizeRange.minWidth.toString());
    setMaxWidthInput(props.cellSizeRange.maxWidth.toString());
    setMinHeightInput(props.cellSizeRange.minHeight.toString());
    setMaxHeightInput(props.cellSizeRange.maxHeight.toString());
  });

  const getDisplayText = () => {
    if (props.style === "Palette" && props.cellSizeRange) {
      const isUniform =
        props.cellSizeRange.minWidth === props.cellSizeRange.maxWidth &&
        props.cellSizeRange.minHeight === props.cellSizeRange.maxHeight;
      if (isUniform) {
        return `${props.cellSizeRange.minWidth}×${props.cellSizeRange.minHeight}`;
      }
      return "Random";
    }
    return `${props.cellSize.width}×${props.cellSize.height}`;
  };

  return (
    <div class="popover-wrapper h-full">
      <button
        ref={(el) => (buttonRef = el)}
        popoverTarget="slider"
        class="anchor-cell-size flex cursor-pointer gap-1 items-center bg-background/30 hover:bg-background/70 px-3 py-1 h-full rounded-xl"
        aria-label={`Cell size: ${getDisplayText()} pixels`}
      >
        <label class="text-xs font-mono font-medium text-foreground-07 whitespace-nowrap">
          Cell:
        </label>
        <span class="font-mono text-xs text-right tabular-nums">{getDisplayText()}</span>
      </button>

      <div
        ref={(el) => (popoverRef = el)}
        class="cell-slider px-2 pt-2 pb-[1px] bg-background border border-foreground/20 rounded-2xl shadow-lg"
        popover="auto"
        id="slider"
      >
        <Show
          when={props.style === "Palette"}
          fallback={
            <input
              id="cell-size-slider"
              type="range"
              min={MIN_CELL_SIZE}
              max={MAX_CELL_SIZE}
              value={currentSize()}
              onInput={(e) => handleSizeChange(Number(e.currentTarget.value))}
              class="w-full accent-foreground slider-tapered"
              aria-label={`Cell size: ${currentSize()} pixels`}
            />
          }
        >
          {/* Palette mode: range inputs with shuffle button */}
          <div class="flex flex-col gap-2 pb-2">
            {/* Width range */}
            <div class="flex gap-2 items-center">
              <label class="text-xs font-mono text-foreground-07 w-6">W:</label>
              <input
                type="number"
                min={1}
                max={2000}
                value={minWidthInput()}
                onInput={(e) => setMinWidthInput(e.currentTarget.value)}
                onKeyDown={handleKeyDown}
                onBlur={commitRangeChange}
                class="w-16 px-2 py-1 text-xs font-mono bg-background-05 border border-foreground-05 rounded-xl text-foreground"
                aria-label="Minimum width"
                placeholder="from"
              />
              <span class="text-xs text-foreground-07">→</span>
              <input
                type="number"
                min={1}
                max={2000}
                value={maxWidthInput()}
                onInput={(e) => setMaxWidthInput(e.currentTarget.value)}
                onKeyDown={handleKeyDown}
                onBlur={commitRangeChange}
                class="w-16 px-2 py-1 text-xs font-mono bg-background-05 border border-foreground-05 rounded-xl text-foreground"
                aria-label="Maximum width"
                placeholder="to"
              />
            </div>
            {/* Height range */}
            <div class="flex gap-2 items-center">
              <label class="text-xs font-mono text-foreground-07 w-6">H:</label>
              <input
                type="number"
                min={1}
                max={2000}
                value={minHeightInput()}
                onInput={(e) => setMinHeightInput(e.currentTarget.value)}
                onKeyDown={handleKeyDown}
                onBlur={commitRangeChange}
                class="w-16 px-2 py-1 text-xs font-mono bg-background-05 border border-foreground-05 rounded-xl text-foreground"
                aria-label="Minimum height"
                placeholder="from"
              />
              <span class="text-xs text-foreground-07">→</span>
              <input
                type="number"
                min={1}
                max={2000}
                value={maxHeightInput()}
                onInput={(e) => setMaxHeightInput(e.currentTarget.value)}
                onKeyDown={handleKeyDown}
                onBlur={commitRangeChange}
                class="w-16 px-2 py-1 text-xs font-mono bg-background-05 border border-foreground-05 rounded-xl text-foreground"
                aria-label="Maximum height"
                placeholder="to"
              />
            </div>
            {/* Shuffle button */}
            <button
              type="button"
              onClick={() => props.onShuffle?.()}
              class="px-2 py-2 mt-1 text-xs font-mono bg-background-05 hover:bg-background-07 border border-foreground-05 rounded-xl text-foreground transition-colors"
            >
              Shuffle
            </button>
          </div>
        </Show>
      </div>
    </div>
  );
}

/**
 * Helper to get default cell size for a given style
 */
export function getDefaultCellSize(style: RenderStyle): CellSize {
  if (style === "Dot") {
    return { width: 8, height: 8 };
  }
  return { width: 10, height: 16 };
}

/**
 * Helper to adjust cell size when switching styles
 */
export function adjustCellSizeForStyle(currentSize: CellSize, newStyle: RenderStyle): CellSize {
  return calculateCellSize(currentSize.width, newStyle);
}
