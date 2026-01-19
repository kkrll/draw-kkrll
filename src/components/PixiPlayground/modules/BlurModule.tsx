import { createSignal, createEffect } from "solid-js";
import { usePixi } from "../context";
import { ModuleCard } from "../ModuleCard";

export function BlurModule() {
  const { filters, ready } = usePixi();
  const [blur, setBlur] = createSignal(0);

  createEffect(() => {
    if (!ready()) return;
    const blurFilter = filters().blur;
    if (blurFilter) {
      blurFilter.strength = blur();
    }
  });

  return (
    <ModuleCard title="Blur (Built-in)">
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
