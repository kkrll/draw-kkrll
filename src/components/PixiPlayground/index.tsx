import { onMount, onCleanup, createSignal, createEffect, For, type JSX } from "solid-js";
import { Application, Sprite, Assets, BlurFilter, ColorMatrixFilter, Filter, GlProgram, Texture } from "pixi.js";
import { PixiContext, type ModuleConfig } from "./context";
import { defaultVertex } from "./shaders/defaultVertex";
import { halftoneFrag } from "./shaders/halftone";
import { grainFrag } from "./shaders/grain";
import { highContrastFrag } from "./shaders/highContrast";
import { motionBlurFrag } from "./shaders/motionBlur";
import { progressiveBlurFrag } from "./shaders/progressiveMotionBlur";
import { monochromeFrag } from "./shaders/monochrome";
import { BlurModule } from "./modules/BlurModule";
import { ColorMatrixModule } from "./modules/ColorMatrixModule";
import { HalftoneModule } from "./modules/HalftoneModule";
import { GrainModule } from "./modules/GrainModule";
import { HighContrastModule } from "./modules/HighContrastModule";
import { MotionBlurModule } from "./modules/MotionBlurModule";
import { ProgressiveBlurModule } from "./modules/ProgressiveBlurModule";
import { MonochromeModule } from "./modules/MonochromeModule";

// Module component registry - maps module IDs to their UI components
const MODULE_COMPONENTS: Record<string, () => JSX.Element> = {
  blur: BlurModule,
  colorMatrix: ColorMatrixModule,
  halftone: HalftoneModule,
  grain: GrainModule,
  highContrast: HighContrastModule,
  motionBlur: MotionBlurModule,
  progressiveBlur: ProgressiveBlurModule,
  monochrome: MonochromeModule,
};

export default function PixiPlayground() {
  let containerRef: HTMLDivElement | undefined;

  // Signals for context
  const [app, setApp] = createSignal<Application | undefined>(undefined);
  const [sprite, setSprite] = createSignal<Sprite | undefined>(undefined);
  const [modules, setModules] = createSignal<ModuleConfig[]>([]);
  const [ready, setReady] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);

  // Helper: Toggle module enabled state
  const toggleModule = (id: string) => {
    setModules((prev) =>
      prev.map((m) => (m.id === id ? { ...m, enabled: !m.enabled } : m))
    );
  };

  // Helper: Reorder modules by swapping positions
  const reorderModules = (fromId: string, toId: string) => {
    setModules((prev) => {
      const fromIndex = prev.findIndex((m) => m.id === fromId);
      const toIndex = prev.findIndex((m) => m.id === toId);
      if (fromIndex === -1 || toIndex === -1) return prev;

      const newModules = [...prev];
      // Swap order values
      const fromOrder = newModules[fromIndex].order;
      newModules[fromIndex] = { ...newModules[fromIndex], order: newModules[toIndex].order };
      newModules[toIndex] = { ...newModules[toIndex], order: fromOrder };

      return newModules;
    });
  };

  // Helper: Get filter by ID with type casting
  const getFilter = <T extends Filter = Filter>(id: string): T | undefined => {
    const mod = modules().find((m) => m.id === id);
    return mod?.filter as T | undefined;
  };

  // Effect: Sync sprite.filters whenever modules change
  createEffect(() => {
    const s = sprite();
    const m = modules();
    if (!s) return;

    // Build filter array from enabled modules, sorted by order
    s.filters = m
      .filter((mod) => mod.enabled)
      .sort((a, b) => a.order - b.order)
      .map((mod) => mod.filter);
  });

  // Handle pasted images
  const handlePaste = async (e: ClipboardEvent) => {
    const currentApp = app();
    const currentSprite = sprite();
    const currentModules = modules();
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

          // Update halftone resolution uniform
          const halftoneModule = currentModules.find((m) => m.id === "halftone");
          if (halftoneModule) {
            const size = Math.max(currentSprite.width, currentSprite.height);
            halftoneModule.filter.resources.halftoneRes.uniforms.uResolution = [size, size];
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
      const spriteSize = Math.max(pixiSprite.width, pixiSprite.height);
      const blurFilter = new BlurFilter({ strength: 0 });
      const colorMatrixFilter = new ColorMatrixFilter();

      const halftoneFilter = new Filter({
        glProgram: new GlProgram({
          vertex: defaultVertex,
          fragment: halftoneFrag,
        }),
        resources: {
          halftoneRes: {
            uGridSize: { value: 10, type: "f32" },
            uSpread: { value: 0.5, type: "f32" },
            uResolution: { value: [spriteSize, spriteSize], type: "vec2<f32>" },
          },
        },
      });

      const grainFilter = new Filter({
        glProgram: new GlProgram({
          vertex: defaultVertex,
          fragment: grainFrag,
        }),
        resources: {
          grainRes: {
            uGrain: { value: 0.3, type: "f32" },
          },
        },
      });

      const highContrastFilter = new Filter({
        glProgram: new GlProgram({
          vertex: defaultVertex,
          fragment: highContrastFrag,
        }),
        resources: {
          contrastRes: {
            uContrast: { value: 1.0, type: "f32" },
          },
        },
      });

      const motionBlurFilter = new Filter({
        glProgram: new GlProgram({
          vertex: defaultVertex,
          fragment: motionBlurFrag,
        }),
        resources: {
          motionRes: {
            uVelocity: { value: 5, type: "f32" },
            uAngle: { value: 0, type: "f32" },
          },
        },
      });

      const progressiveBlurFilter = new Filter({
        glProgram: new GlProgram({
          vertex: defaultVertex,
          fragment: progressiveBlurFrag,
        }),
        resources: {
          progRes: {
            uVelocity: { value: 15, type: "f32" },
            uAngle: { value: 90, type: "f32" },
            uStart: { value: 0.3, type: "f32" },
            uEnd: { value: 1.0, type: "f32" },
            uAxis: { value: 0, type: "i32" },
          },
        },
      });

      const monochromeFilter = new Filter({
        glProgram: new GlProgram({
          vertex: defaultVertex,
          fragment: monochromeFrag,
        }),
        resources: {
          monoRes: {
            uBlack: { value: 0.0, type: "f32" },
            uWhite: { value: 1.0, type: "f32" },
            uMid: { value: 0.5, type: "f32" },
          },
        },
      });

      // Create module configs with initial order
      const initialModules: ModuleConfig[] = [
        { id: "blur", name: "Blur", variant: "builtin", enabled: true, order: 0, filter: blurFilter },
        { id: "colorMatrix", name: "Color Matrix", variant: "builtin", enabled: true, order: 1, filter: colorMatrixFilter },
        { id: "halftone", name: "Halftone", variant: "custom", enabled: true, order: 2, filter: halftoneFilter },
        { id: "grain", name: "Grain", variant: "custom", enabled: false, order: 3, filter: grainFilter },
        { id: "highContrast", name: "High Contrast", variant: "custom", enabled: false, order: 4, filter: highContrastFilter },
        { id: "motionBlur", name: "Motion Blur", variant: "custom", enabled: false, order: 5, filter: motionBlurFilter },
        { id: "progressiveBlur", name: "Progressive Blur", variant: "custom", enabled: false, order: 6, filter: progressiveBlurFilter },
        { id: "monochrome", name: "Monochrome", variant: "custom", enabled: false, order: 7, filter: monochromeFilter },
      ];

      pixiApp.stage.addChild(pixiSprite);

      // Update signals
      setApp(pixiApp);
      setSprite(pixiSprite);
      setModules(initialModules);

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

  // Get modules sorted by order for rendering
  const sortedModules = () => [...modules()].sort((a, b) => a.order - b.order);

  return (
    <PixiContext.Provider value={{ app, sprite, modules, setModules, ready, toggleModule, reorderModules, getFilter }}>
      <div class="w-full h-screen bg-[#1a1a1a] text-white flex">
        <div ref={containerRef} class="flex-1 relative" />

        <div class="w-72 p-4 bg-[#252525] flex flex-col gap-4 overflow-y-auto">
          <h2 class="text-lg font-medium border-b border-white/10 pb-2">
            Pixi Playground
          </h2>

          <p class="text-xs text-white/40">
            Cmd/Ctrl+V to paste an image
          </p>

          <p class="text-xs text-white/40">
            Drag modules to reorder filter stack
          </p>

          {error() && (
            <p class="text-red-400 text-sm">{error()}</p>
          )}

          {ready() && (
            <For each={sortedModules()}>
              {(mod) => {
                const Component = MODULE_COMPONENTS[mod.id];
                return Component ? <Component /> : null;
              }}
            </For>
          )}
        </div>
      </div>
    </PixiContext.Provider>
  );
}
