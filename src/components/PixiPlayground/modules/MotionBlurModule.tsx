import { createSignal, createEffect } from "solid-js";
import type { Filter } from "pixi.js";
import { usePixi } from "../context";
import { ModuleCard } from "../ModuleCard";

export function MotionBlurModule() {
  const { modules, toggleModule, reorderModules, getFilter } = usePixi();
  const [velocity, setVelocity] = createSignal(1);
  const [angle, setAngle] = createSignal(0);

  const moduleConfig = () => modules().find((m) => m.id === "motionBlur");

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
      title="Motion Blur (Custom)"
      variant="custom"
      moduleId="motionBlur"
      enabled={moduleConfig()?.enabled ?? false}
      onToggle={() => toggleModule("motionBlur")}
      onReorder={reorderModules}
    >
      <label class="flex flex-col gap-1">
        <span class="text-xs text-white/50">Velocity: {velocity()}</span>
        <input
          type="range"
          min="-10"
          max="20"
          step="1"
          value={velocity()}
          onInput={(e) => setVelocity(parseFloat(e.currentTarget.value))}
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
          onInput={(e) => setAngle(parseFloat(e.currentTarget.value))}
          class="w-full"
        />
      </label>
    </ModuleCard>
  );
}
