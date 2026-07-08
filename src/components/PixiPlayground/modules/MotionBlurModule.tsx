import { createEffect } from "solid-js";
import type { Filter } from "pixi.js";
import { usePixi } from "../context";
import { ModuleCard } from "../ModuleCard";

export function MotionBlurModule() {
  const { modules, toggleModule, getFilter, getParameter, setParameter } = usePixi();

  const moduleConfig = () => modules().find((m) => m.id === "motionBlur");
  const velocity = () => getParameter("motionBlur", "velocity");
  const angle = () => getParameter("motionBlur", "angle");

  createEffect(() => {
    const config = moduleConfig();
    if (!config?.enabled) return;

    const filter = getFilter<Filter>("motionBlur");
    if (filter) {
      filter.resources.motionRes.uniforms.uVelocity = velocity();
      filter.resources.motionRes.uniforms.uAngle = angle();
    }
  });

  return (
    <ModuleCard
      title="Motion Blur"
      variant="custom"
      moduleId="motionBlur"
      enabled={moduleConfig()?.enabled ?? false}
      onToggle={() => toggleModule("motionBlur")}
    >
      <label class="flex flex-col gap-1">
        <span class="text-xs text-white/50">Velocity: {velocity()}</span>
        <input
          type="range"
          min="0"
          max="20"
          step="0.25"
          value={velocity()}
          onInput={(e) => setParameter("motionBlur", "velocity", parseFloat(e.currentTarget.value))}
          class="w-full"
        />
      </label>
      <label class="flex flex-col gap-1">
        <span class="text-xs text-white/50">Angle: {angle()}°</span>
        <input
          type="range"
          min="0"
          max="360"
          step="1"
          value={angle()}
          onInput={(e) => setParameter("motionBlur", "angle", parseFloat(e.currentTarget.value))}
          class="w-full"
        />
      </label>
    </ModuleCard>
  );
}
