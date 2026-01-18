/**
 * Symbol Selector Component (SolidJS)
 *
 * A popover control for adjusting brush thickness in the ASCII canvas.
 * Shows visual preview of current brush (ASCII character or dot circle).
 */

import { Show, createEffect } from "solid-js";
import { setupPopoverPosition } from "../lib/popoverPosition";
import { IMAGE_ASCII_CHARS } from "../lib/constants";
import { Brush } from "./ui/icons";
import type { RenderStyle } from "../lib/types";
import "../styles/ascii.css";

interface SymbolSelectorProps {
  selectedSymbol: number;
  onSelectSymbol: (index: number) => void;
  onModeSelect: () => void;
  isSelected: boolean;
  style: RenderStyle;
}

export default function SymbolSelector(props: SymbolSelectorProps) {
  const radius = () => props.selectedSymbol / 1.66;
  const maxLength = IMAGE_ASCII_CHARS.length - 1;
  let triggerRef: HTMLButtonElement | undefined;
  let popoverRef: HTMLDivElement | undefined;
  let positionSetup = false;

  createEffect(() => {
    if (props.isSelected && triggerRef && popoverRef && !positionSetup) {
      setupPopoverPosition(triggerRef, popoverRef);
      positionSetup = true;
    }
  });

  const getColor = (index: number) => {
    const val = Math.round((index * 255) / maxLength);
    return `rgb(${val}, ${val}, ${val})`;
  };

  return (
    <div class="popover-wrapper flex items-center gap-1 h-full">
      <div
        class={`anchor-brush flex gap-2 pl-2 duration-150 items-center py-1 min-h-8 min-w-8 h-full text-xs font-mono text-foreground rounded-xl transition-all ${
          props.isSelected
            ? "bg-background pr-1 max-w-32"
            : "bg-background/30 hover:bg-background/70 max-w-8 cursor-pointer"
        }`}
      >
        <button
          onClick={() => {
            if (!props.isSelected) props.onModeSelect();
          }}
          type="button"
          class="min-w-0 min-h-0 p-0 bg-transparent border-0"
        >
          <Brush />
        </button>
        <Show when={props.isSelected}>
          <button
            ref={(el) => (triggerRef = el)}
            type="button"
            popoverTarget="brush-slider"
            class={`cursor-pointer flex items-center h-6 w-6 justify-center font-mono text-xs rounded-lg text-center border-1 border-foreground-05 text-foreground transition-all duration-200 ${
              props.isSelected ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-3"
            }`}
            style={{
              "background-color":
                props.style === "Palette" ? getColor(props.selectedSymbol) : "var(--background-05)",
            }}
          >
            <Show when={props.style === "Dot"}>
              <svg width="24" height="24" viewBox="0 0 32 32">
                <title>brush size</title>
                <circle cx="16" cy="16" r={Math.min(radius(), 12)} fill="currentColor" />
              </svg>
            </Show>

            <Show when={props.style === "Ascii"}>
              <span class="leading-none">{IMAGE_ASCII_CHARS[props.selectedSymbol]}</span>
            </Show>
          </button>
        </Show>
      </div>

      <Show when={props.isSelected}>
        <div
          ref={(el) => (popoverRef = el)}
          class="brush-slider px-2 pt-2 pb-[1px] bg-background border border-foreground/20 rounded-2xl shadow-lg"
          popover="auto"
          id="brush-slider"
        >
          <input
            id="thickness-slider"
            type="range"
            min="0"
            max={IMAGE_ASCII_CHARS.length - 1}
            value={props.selectedSymbol}
            onInput={(e) => props.onSelectSymbol(Number(e.currentTarget.value))}
            class="w-full accent-foreground slider-tapered"
            aria-label={`Brush thickness: ${props.selectedSymbol}`}
          />
        </div>
      </Show>
    </div>
  );
}
