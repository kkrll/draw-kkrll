import { createSignal, createEffect } from "solid-js";
import type { Filter } from "pixi.js";
import { usePixi } from "../context";
import { ModuleCard } from "../ModuleCard";

const AXIS_OPTIONS = [
  { value: 0, label: "Vertical (Y)" },
  { value: 1, label: "Horizontal (X)" },
  { value: 2, label: "Radial" },
];

export function ProgressiveBlurModule() {
  const { modules, toggleModule, reorderModules, getFilter } = usePixi();
  const [blurMax, setBlurMax] = createSignal(15);
  const [gradStart, setGradStart] = createSignal(0.3);
  const [gradEnd, setGradEnd] = createSignal(1.0);
  const [axis, setAxis] = createSignal(0);

  const moduleConfig = () => modules().find((m) => m.id === "progressiveBlur");

  createEffect(() => {
    const config = moduleConfig();
    if (!config?.enabled) return;

    const filter = getFilter<Filter>("progressiveBlur");
    if (filter) {
      const u = filter.resources.progRes.uniforms;
      u.uVelocity = blurMax();
      u.uStart = gradStart();
      u.uEnd = gradEnd();
      u.uAxis = axis();
    }
  });

  return (
    <ModuleCard
      title="Progressive Blur (Custom)"
      variant="custom"
      moduleId="progressiveBlur"
      enabled={moduleConfig()?.enabled ?? false}
      onToggle={() => toggleModule("progressiveBlur")}
      onReorder={reorderModules}
    >
      <label class="flex flex-col gap-1">
        <span class="text-xs text-white/50">Max Blur: {blurMax()}</span>
        <input
          type="range"
          min="0"
          max="50"
          step="1"
          value={blurMax()}
          onInput={(e) => setBlurMax(parseFloat(e.currentTarget.value))}
          class="w-full"
        />
      </label>

      <label class="flex flex-col gap-1">
        <span class="text-xs text-white/50">Gradient Start: {(gradStart() * 100).toFixed(0)}%</span>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={gradStart()}
          onInput={(e) => setGradStart(parseFloat(e.currentTarget.value))}
          class="w-full"
        />
      </label>

      <label class="flex flex-col gap-1">
        <span class="text-xs text-white/50">Gradient End: {(gradEnd() * 100).toFixed(0)}%</span>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={gradEnd()}
          onInput={(e) => setGradEnd(parseFloat(e.currentTarget.value))}
          class="w-full"
        />
      </label>

      <label class="flex flex-col gap-1">
        <span class="text-xs text-white/50">Axis</span>
        <select
          value={axis()}
          onChange={(e) => setAxis(parseInt(e.currentTarget.value))}
          class="bg-white/10 border border-white/20 rounded px-2 py-1 text-sm"
        >
          {AXIS_OPTIONS.map((opt) => (
            <option value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </label>
    </ModuleCard>
  );
}
