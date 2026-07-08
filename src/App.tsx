import { createSignal, Show } from "solid-js";
import AsciiCanvas from "./components/AsciiCanvas";
import PixiPlayground from "./components/PixiPlayground";
import type { DrawingModes } from "./lib/types";
import "./index.css";
import "./styles/ascii.css";

export default function App() {
  const [mode, setMode] = createSignal<DrawingModes>("brush");

  // Simple routing: /pixi goes to playground
  const isPixiRoute = () => window.location.pathname === "/pixi";

  return (
    <Show
      when={!isPixiRoute()}
      fallback={<PixiPlayground />}
    >
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
    </Show>
  );
}
