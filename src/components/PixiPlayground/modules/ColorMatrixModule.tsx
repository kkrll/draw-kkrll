import { createSignal, createEffect } from "solid-js";
import type { ColorMatrixFilter } from "pixi.js";
import { usePixi } from "../context";
import { ModuleCard } from "../ModuleCard";

export function ColorMatrixModule() {
  const { modules, toggleModule, reorderModules, getFilter } = usePixi();
  const [saturation, setSaturation] = createSignal(0);
  const [hue, setHue] = createSignal(0);
  const [contrast, setContrast] = createSignal(0);

  const moduleConfig = () => modules().find((m) => m.id === "colorMatrix");

  createEffect(() => {
    const config = moduleConfig();
    if (!config?.enabled) return;

    const colorMatrix = getFilter<ColorMatrixFilter>("colorMatrix");
    if (colorMatrix) {
      colorMatrix.reset();
      colorMatrix.saturate(saturation(), false);
      colorMatrix.hue(hue(), true);
      colorMatrix.contrast(contrast(), true);
    }
  });

  return (
    <ModuleCard
      title="Color Matrix (Built-in)"
      variant="builtin"
      moduleId="colorMatrix"
      enabled={moduleConfig()?.enabled ?? false}
      onToggle={() => toggleModule("colorMatrix")}
      onReorder={reorderModules}
    >
      <label class="flex flex-col gap-1">
        <span class="text-xs text-white/50">
          Saturation: {saturation().toFixed(2)}
        </span>
        <input
          type="range"
          min="-1"
          max="1"
          step="0.01"
          value={saturation()}
          onInput={(e) => setSaturation(parseFloat(e.currentTarget.value))}
          class="w-full"
        />
      </label>
      <label class="flex flex-col gap-1">
        <span class="text-xs text-white/50">Hue: {hue()}°</span>
        <input
          type="range"
          min="0"
          max="360"
          step="1"
          value={hue()}
          onInput={(e) => setHue(parseFloat(e.currentTarget.value))}
          class="w-full"
        />
      </label>
      <label class="flex flex-col gap-1">
        <span class="text-xs text-white/50">Contrast: {contrast().toFixed(2)}</span>
        <input
          type="range"
          min="-1"
          max="2"
          step="0.01"
          value={contrast()}
          onInput={(e) => setContrast(parseFloat(e.currentTarget.value))}
          class="w-full"
        />
      </label>
    </ModuleCard>
  );
}
