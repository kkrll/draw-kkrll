import { createEffect } from "solid-js";
import type { Filter } from "pixi.js";
import { usePixi } from "../context";
import { ModuleCard } from "../ModuleCard";

export function GrainModule() {
  const { modules, toggleModule, reorderModules, getFilter, getParameter, setParameter } = usePixi();

  const moduleConfig = () => modules().find((m) => m.id === "grain");
  const grain = () => getParameter("grain", "grain");

  createEffect(() => {
    const config = moduleConfig();
    if (!config?.enabled) return;

    const filter = getFilter<Filter>("grain");
    if (filter) {
      filter.resources.grainRes.uniforms.uGrain = grain();
    }
  });

  return (
    <ModuleCard
      title="Grain (Custom Shader)"
      variant="custom"
      moduleId="grain"
      enabled={moduleConfig()?.enabled ?? false}
      onToggle={() => toggleModule("grain")}
      onReorder={reorderModules}
    >
      <label class="flex flex-col gap-1">
        <span class="text-xs text-white/50">Amount: {grain().toFixed(2)}</span>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={grain()}
          onInput={(e) => setParameter("grain", "grain", parseFloat(e.currentTarget.value))}
          class="w-full"
        />
      </label>
    </ModuleCard>
  );
}
