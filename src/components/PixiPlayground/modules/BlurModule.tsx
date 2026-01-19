import { createSignal, createEffect } from "solid-js";
import type { BlurFilter } from "pixi.js";
import { usePixi } from "../context";
import { ModuleCard } from "../ModuleCard";

export function BlurModule() {
  const { modules, toggleModule, reorderModules, getFilter } = usePixi();
  const [blur, setBlur] = createSignal(0);

  const moduleConfig = () => modules().find((m) => m.id === "blur");

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
      title="Blur (Built-in)"
      variant="builtin"
      moduleId="blur"
      enabled={moduleConfig()?.enabled ?? false}
      onToggle={() => toggleModule("blur")}
      onReorder={reorderModules}
    >
      <label class="flex flex-col gap-1">
        <span class="text-xs text-white/50">Strength: {blur()}</span>
        <input
          type="range"
          min="0"
          max="20"
          step="0.5"
          value={blur()}
          onInput={(e) => setBlur(parseFloat(e.currentTarget.value))}
          class="w-full"
        />
      </label>
    </ModuleCard>
  );
}
