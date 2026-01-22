import { createEffect } from "solid-js";
import type { BlurFilter } from "pixi.js";
import { usePixi } from "../context";
import { ModuleCard } from "../ModuleCard";

export function BlurModule() {
  const { modules, toggleModule, getFilter, getParameter, setParameter } = usePixi();

  const moduleConfig = () => modules().find((m) => m.id === "blur");
  const blur = () => getParameter("blur", "strength");

  createEffect(() => {
    const config = moduleConfig();
    if (!config?.enabled) return;

    const blurFilter = getFilter<BlurFilter>("blur");
    if (blurFilter) {
      blurFilter.strength = blur();
    }
  });

  return (
    <ModuleCard
      title="Blur"
      variant="builtin"
      moduleId="blur"
      enabled={moduleConfig()?.enabled ?? false}
      onToggle={() => toggleModule("blur")}
    >
      <label class="flex flex-col gap-1">
        <span class="text-xs text-white/50">Strength: {blur()}</span>
        <input
          type="range"
          min="0"
          max="20"
          step="0.5"
          value={blur()}
          onInput={(e) => setParameter("blur", "strength", parseFloat(e.currentTarget.value))}
          class="w-full"
        />
      </label>
    </ModuleCard>
  );
}
