import { onMount, onCleanup, createSignal } from "solid-js";
import { Application, Sprite, Assets, BlurFilter, ColorMatrixFilter, Filter, GlProgram, Texture } from "pixi.js";
import { PixiContext, type PixiFilters } from "./context";
import { defaultVertex } from "./shaders/defaultVertex";
import { halftoneFrag } from "./shaders/halftone";
import { BlurModule } from "./modules/BlurModule";
import { ColorMatrixModule } from "./modules/ColorMatrixModule";
import { HalftoneModule } from "./modules/HalftoneModule";

export default function PixiPlayground() {
  let containerRef: HTMLDivElement | undefined;

  // Signals for context
  const [app, setApp] = createSignal<Application | undefined>(undefined);
  const [sprite, setSprite] = createSignal<Sprite | undefined>(undefined);
  const [filters, setFilters] = createSignal<PixiFilters>({
    blur: undefined,
    colorMatrix: undefined,
    halftone: undefined,
  });
  const [ready, setReady] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);

  // Handle pasted images
  const handlePaste = async (e: ClipboardEvent) => {
    const currentApp = app();
    const currentSprite = sprite();
    const currentFilters = filters();
    if (!currentApp || !currentSprite) return;

    const items = e.clipboardData?.items;
    if (!items) return;

    for (const item of items) {
      if (item.type.startsWith("image/")) {
        e.preventDefault();

        const blob = item.getAsFile();
        if (!blob) continue;

        const url = URL.createObjectURL(blob);

        try {
          const img = new Image();
          img.src = url;
          await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
          });

          const newTexture = Texture.from(img);
          URL.revokeObjectURL(url);

          currentSprite.texture = newTexture;

          const scale = Math.min(
            (window.innerWidth * 0.6) / currentSprite.texture.width,
            (window.innerHeight * 0.8) / currentSprite.texture.height
          );
          currentSprite.scale.set(scale);
          currentSprite.x = currentApp.screen.width / 2;
          currentSprite.y = currentApp.screen.height / 2;

          // Update halftone resolution
          if (currentFilters.halftone) {
            const size = Math.max(currentSprite.width, currentSprite.height);
            currentFilters.halftone.resources.halftoneRes.uniforms.uResolution = [size, size];
          }
        } catch (err) {
          console.error("Failed to load pasted image:", err);
        }

        break;
      }
    }
  };

  onMount(async () => {
    if (!containerRef) return;

    try {
      const pixiApp = new Application();
      await pixiApp.init({
        background: "#1a1a1a",
        resizeTo: containerRef,
        antialias: true,
        preference: "webgl",
      });

      containerRef.appendChild(pixiApp.canvas);

      const texture = await Assets.load("/tst/unnamed.jpg");
      const pixiSprite = new Sprite(texture);

      const scale = Math.min(
        (window.innerWidth * 0.6) / pixiSprite.width,
        (window.innerHeight * 0.8) / pixiSprite.height
      );
      pixiSprite.scale.set(scale);
      pixiSprite.anchor.set(0.5);
      pixiSprite.x = pixiApp.screen.width / 2;
      pixiSprite.y = pixiApp.screen.height / 2;

      // Initialize filters
      const blurFilter = new BlurFilter({ strength: 0 });
      const colorMatrix = new ColorMatrixFilter();
      const halftoneFilter = new Filter({
        glProgram: new GlProgram({
          vertex: defaultVertex,
          fragment: halftoneFrag,
        }),
        resources: {
          halftoneRes: {
            uGridSize: { value: 10, type: "f32" },
            uSpread: { value: 0.5, type: "f32" },
            uResolution: {
              value: [Math.max(pixiSprite.width, pixiSprite.height), Math.max(pixiSprite.width, pixiSprite.height)],
              type: "vec2<f32>",
            },
          },
        },
      });

      pixiSprite.filters = [blurFilter, colorMatrix, halftoneFilter];
      pixiApp.stage.addChild(pixiSprite);

      // Update signals
      setApp(pixiApp);
      setSprite(pixiSprite);
      setFilters({
        blur: blurFilter,
        colorMatrix: colorMatrix,
        halftone: halftoneFilter,
      });

      document.addEventListener("paste", handlePaste);
      setReady(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to initialize");
      console.error(e);
    }
  });

  onCleanup(() => {
    document.removeEventListener("paste", handlePaste);
    app()?.destroy(true, { children: true, texture: true });
  });

  return (
    <PixiContext.Provider value={{ app, sprite, filters, ready }}>
      <div class="w-full h-screen bg-[#1a1a1a] text-white flex">
        <div ref={containerRef} class="flex-1 relative" />

        <div class="w-72 p-4 bg-[#252525] flex flex-col gap-4 overflow-y-auto">
          <h2 class="text-lg font-medium border-b border-white/10 pb-2">
            Pixi Playground
          </h2>

          <p class="text-xs text-white/40">
            Cmd/Ctrl+V to paste an image
          </p>

          {error() && (
            <p class="text-red-400 text-sm">{error()}</p>
          )}

          {ready() && (
            <>
              <HalftoneModule />
              <BlurModule />
              <ColorMatrixModule />
            </>
          )}
        </div>
      </div>
    </PixiContext.Provider>
  );
}
