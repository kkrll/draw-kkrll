import { createSignal, createEffect } from "solid-js";
import type { Filter } from "pixi.js";
import { usePixi } from "../context";
import { ModuleCard } from "../ModuleCard";

export function HalftoneModule() {
  const { modules, toggleModule, reorderModules, getFilter } = usePixi();
  const [dotSize, setDotSize] = createSignal(10);
  const [spread, setSpread] = createSignal(0.5);

  const moduleConfig = () => modules().find((m) => m.id === "halftone");

  createEffect(() => {
    const config = moduleConfig();
    if (!config?.enabled) return;

    const halftoneFilter = getFilter<Filter>("halftone");
    if (halftoneFilter) {
      halftoneFilter.resources.halftoneRes.uniforms.uGridSize = dotSize();
      halftoneFilter.resources.halftoneRes.uniforms.uSpread = spread();
    }
  });

  return (
    <ModuleCard
      title="Halftone (Custom Shader)"
      variant="custom"
      moduleId="halftone"
      enabled={moduleConfig()?.enabled ?? false}
      onToggle={() => toggleModule("halftone")}
      onReorder={reorderModules}
    >
      <label class="flex flex-col gap-1">
        <span class="text-xs text-white/50">Dot Size: {dotSize()}px</span>
        <input
          type="range"
          min="2"
          max="50"
          step="1"
          value={dotSize()}
          onInput={(e) => setDotSize(parseFloat(e.currentTarget.value))}
          class="w-full"
        />
      </label>
      <label class="flex flex-col gap-1">
        <span class="text-xs text-white/50">Gooeyness: {spread().toFixed(2)}</span>
        <input
          type="range"
          min="0.1"
          max="1.5"
          step="0.01"
          value={spread()}
          onInput={(e) => setSpread(parseFloat(e.currentTarget.value))}
          class="w-full"
        />
      </label>
    </ModuleCard>
  );
}
