/**
 * Palette Color Picker Component (SolidJS)
 *
 * An elegant control for selecting colors in Palette mode.
 * Shows a color swatch preview that opens native HTML5 color picker.
 */

import { Show } from "solid-js";
import { Brush } from "./ui/icons";
import "../styles/ascii.css";

interface PaletteColorPickerProps {
  selectedColor: string;
  onSelectColor: (color: string) => void;
  onModeSelect: () => void;
  isSelected: boolean;
}

export default function PaletteColorPicker(props: PaletteColorPickerProps) {
  let colorInputRef: HTMLInputElement | undefined;

  return (
    <div class="flex items-center gap-1 h-full">
      <div
        class={`flex gap-2 pl-2 duration-150 items-center py-1 min-h-8 min-w-8 h-full text-xs font-mono text-foreground rounded-xl transition-all ${
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
            type="button"
            onClick={() => colorInputRef?.click()}
            class={`cursor-pointer flex items-center h-6 w-6 justify-center rounded-lg border border-foreground/20 transition-all duration-200 ${
              props.isSelected ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-3"
            }`}
            style={{ "background-color": props.selectedColor }}
            title={props.selectedColor}
            aria-label={`Selected color: ${props.selectedColor}`}
          >
            {/* Hidden native color input */}
            <input
              ref={(el) => (colorInputRef = el)}
              type="color"
              value={props.selectedColor}
              onInput={(e) => props.onSelectColor(e.currentTarget.value)}
              class="absolute opacity-0 w-0 h-0 pointer-events-none"
              aria-hidden="true"
            />
          </button>
        </Show>
      </div>
    </div>
  );
}
