import { createEffect } from "solid-js";
import type { Filter } from "pixi.js";
import { usePixi } from "../context";
import { ModuleCard } from "../ModuleCard";

export function HalftoneModule() {
  const { modules, toggleModule, getFilter, getParameter, setParameter } = usePixi();

  const moduleConfig = () => modules().find((m) => m.id === "halftone");
  const dotSize = () => getParameter("halftone", "dotSize");
  const spread = () => getParameter("halftone", "spread");

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
      title="Halftone"
      variant="custom"
      moduleId="halftone"
      enabled={moduleConfig()?.enabled ?? false}
      onToggle={() => toggleModule("halftone")}
    >
      <label class="flex flex-col gap-1">
        <span class="text-xs text-white/50">Dot Size: {dotSize()}px</span>
        <input
          type="range"
          min="2"
          max="50"
          step="1"
          value={dotSize()}
          onInput={(e) => setParameter("halftone", "dotSize", parseFloat(e.currentTarget.value))}
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
          onInput={(e) => setParameter("halftone", "spread", parseFloat(e.currentTarget.value))}
          class="w-full"
        />
      </label>
    </ModuleCard>
  );
}
