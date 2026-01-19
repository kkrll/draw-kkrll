import { createSignal, createEffect } from "solid-js";
import type { Filter } from "pixi.js";
import { usePixi } from "../context";
import { ModuleCard } from "../ModuleCard";

export function HighContrastModule() {
  const { modules, toggleModule, reorderModules, getFilter } = usePixi();
  const [contrast, setContrast] = createSignal(1.0);

  const moduleConfig = () => modules().find((m) => m.id === "highContrast");

  createEffect(() => {
    const config = moduleConfig();
    if (!config?.enabled) return;

    const filter = getFilter<Filter>("highContrast");
    if (filter) {
      filter.resources.contrastRes.uniforms.uContrast = contrast();
    }
  });

  return (
    <ModuleCard
      title="High Contrast (Custom)"
      variant="custom"
      moduleId="highContrast"
      enabled={moduleConfig()?.enabled ?? false}
      onToggle={() => toggleModule("highContrast")}
      onReorder={reorderModules}
    >
      <label class="flex flex-col gap-1">
        <span class="text-xs text-white/50">Contrast: {contrast().toFixed(2)}</span>
        <input
          type="range"
          min="0.5"
          max="3"
          step="0.01"
          value={contrast()}
          onInput={(e) => setContrast(parseFloat(e.currentTarget.value))}
          class="w-full"
        />
      </label>
    </ModuleCard>
  );
}
