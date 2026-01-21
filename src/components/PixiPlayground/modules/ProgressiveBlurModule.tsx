import { createEffect } from "solid-js";
import type { Filter } from "pixi.js";
import { usePixi } from "../context";
import { ModuleCard } from "../ModuleCard";

const AXIS_OPTIONS = [
  { value: 0, label: "Vertical (Y)" },
  { value: 1, label: "Horizontal (X)" },
  { value: 2, label: "Radial" },
];

export function ProgressiveBlurModule() {
  const { modules, toggleModule, getFilter, getParameter, setParameter } = usePixi();

  const moduleConfig = () => modules().find((m) => m.id === "progressiveBlur");
  const blurMax = () => getParameter("progressiveBlur", "blurMax");
  const gradStart = () => getParameter("progressiveBlur", "gradStart");
  const gradEnd = () => getParameter("progressiveBlur", "gradEnd");
  const axis = () => getParameter("progressiveBlur", "axis");
  const angle = () => getParameter("progressiveBlur", "angle");

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
      u.uAngle = angle();
    }
  });

  return (
    <ModuleCard
      title="Progressive Blur"
      variant="custom"
      moduleId="progressiveBlur"
      enabled={moduleConfig()?.enabled ?? false}
      onToggle={() => toggleModule("progressiveBlur")}
    >
      <label class="flex flex-col gap-1">
        <span class="text-xs text-white/50">Max Blur: {blurMax()}</span>
        <input
          type="range"
          min="0"
          max="10"
          step="0.05"
          value={blurMax()}
          onInput={(e) => setParameter("progressiveBlur", "blurMax", parseFloat(e.currentTarget.value))}
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
          onInput={(e) => setParameter("progressiveBlur", "gradStart", parseFloat(e.currentTarget.value))}
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
          onInput={(e) => setParameter("progressiveBlur", "gradEnd", parseFloat(e.currentTarget.value))}
          class="w-full"
        />
      </label>

      <label class="flex flex-col gap-1">
        <span class="text-xs text-white/50">Axis</span>
        <select
          value={axis()}
          onChange={(e) => setParameter("progressiveBlur", "axis", parseInt(e.currentTarget.value))}
          class="bg-white/10 border border-white/20 rounded px-2 py-1 text-sm"
        >
          {AXIS_OPTIONS.map((opt) => (
            <option value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </label>

      <label class="flex flex-col gap-1">
        <span class="text-xs text-white/50">Angle: {angle()}°</span>
        <input
          type="range"
          min="0"
          max="360"
          step="1"
          value={angle()}
          onInput={(e) => setParameter("progressiveBlur", "angle", parseFloat(e.currentTarget.value))}
          class="w-full"
        />
      </label>
    </ModuleCard>
  );
}
