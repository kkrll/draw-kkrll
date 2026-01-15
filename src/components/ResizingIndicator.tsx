import { Show } from "solid-js";
import type { DrawingModes } from "../lib/types";

interface ResizingIndicatorProps {
  isResizing: boolean;
  drawingMode: DrawingModes;
}

export default function ResizingIndicator(props: ResizingIndicatorProps) {
  return (
    <Show when={props.isResizing && props.drawingMode}>
      <div class="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm z-50 pointer-events-none">
        <div class="px-6 py-3 bg-foreground/10 text-foreground rounded-lg font-mono text-sm">
          Resizing canvas...
        </div>
      </div>
    </Show>
  );
}
