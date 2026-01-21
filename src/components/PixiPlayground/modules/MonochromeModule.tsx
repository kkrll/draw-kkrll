import { createEffect } from "solid-js";
import type { Filter } from "pixi.js";
import { usePixi } from "../context";
import { ModuleCard } from "../ModuleCard";

export function MonochromeModule() {
  const { modules, toggleModule, reorderModules, getFilter, getParameter, setParameter } = usePixi();

  const moduleConfig = () => modules().find((m) => m.id === "monochrome");
  const blackPt = () => getParameter("monochrome", "blackPt");
  const whitePt = () => getParameter("monochrome", "whitePt");
  const midPt = () => getParameter("monochrome", "midPt");

  createEffect(() => {
    const config = moduleConfig();
    if (!config?.enabled) return;

    const filter = getFilter<Filter>("monochrome");
    if (filter) {
      const u = filter.resources.monoRes.uniforms;
      u.uBlack = blackPt();
      u.uWhite = whitePt();
      u.uMid = midPt();
    }
  });

  return (
    <ModuleCard
      title="Monochrome (Custom)"
      variant="custom"
      moduleId="monochrome"
      enabled={moduleConfig()?.enabled ?? false}
      onToggle={() => toggleModule("monochrome")}
      onReorder={reorderModules}
    >
      <label class="flex flex-col gap-1">
        <span class="text-xs text-white/50">Black Point: {blackPt().toFixed(2)}</span>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={blackPt()}
          onInput={(e) => setParameter("monochrome", "blackPt", parseFloat(e.currentTarget.value))}
          class="w-full"
        />
      </label>

      <label class="flex flex-col gap-1">
        <span class="text-xs text-white/50">White Point: {whitePt().toFixed(2)}</span>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={whitePt()}
          onInput={(e) => setParameter("monochrome", "whitePt", parseFloat(e.currentTarget.value))}
          class="w-full"
        />
      </label>

      <label class="flex flex-col gap-1">
        <span class="text-xs text-white/50">Mid Point (Gamma): {midPt().toFixed(2)}</span>
        <input
          type="range"
          min="0.01"
          max="0.99"
          step="0.01"
          value={midPt()}
          onInput={(e) => setParameter("monochrome", "midPt", parseFloat(e.currentTarget.value))}
          class="w-full"
        />
      </label>
    </ModuleCard>
  );
}
