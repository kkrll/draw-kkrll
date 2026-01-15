import { createSignal } from "solid-js";
import AsciiCanvas from "./components/AsciiCanvas";
import type { DrawingModes } from "./lib/types";
import "./index.css";
import "./styles/ascii.css";

export default function App() {
  const [mode, setMode] = createSignal<DrawingModes>("brush");

  return (
    <div class="w-full h-screen overflow-hidden bg-background text-foreground">
      <AsciiCanvas
        drawingMode={mode()}
        onToggleDrawingMode={() => {
          // Redirect to main site on exit
          window.location.href = "https://kkrll.com";
        }}
        setMode={setMode}
      />
    </div>
  );
}
