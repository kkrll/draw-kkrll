import { createEffect } from "solid-js";
import type { Filter } from "pixi.js";
import { usePixi } from "../context";
import { ModuleCard } from "../ModuleCard";

export function SlitScanModule() {
  const { modules, toggleModule, getFilter, getParameter, setParameter } = usePixi();

  const moduleConfig = () => modules().find((m) => m.id === "slitScan");
  const lines = () => getParameter("slitScan", "lines");
  const offset = () => getParameter("slitScan", "offset");
  const phase = () => getParameter("slitScan", "phase");
  const freq = () => getParameter("slitScan", "freq");

  createEffect(() => {
    const config = moduleConfig();
    if (!config?.enabled) return;

    const filter = getFilter<Filter>("slitScan");
    if (filter) {
      const u = filter.resources.slitRes.uniforms;
      u.uLines = lines();
      u.uOffset = offset();
      u.uPhase = phase();
      u.uFreq = freq();
    }
  });

  return (
    <ModuleCard
      title="Slit Scan"
      variant="custom"
      moduleId="slitScan"
      enabled={moduleConfig()?.enabled ?? false}
      onToggle={() => toggleModule("slitScan")}
    >
      <label class="flex flex-col gap-1">
        <span class="text-xs text-white/50">Lines: {lines()}</span>
        <input
          type="range"
          min="5"
          max="200"
          step="1"
          value={lines()}
          onInput={(e) => setParameter("slitScan", "lines", parseFloat(e.currentTarget.value))}
          class="w-full"
        />
      </label>

      <label class="flex flex-col gap-1">
        <span class="text-xs text-white/50">Offset: {offset().toFixed(2)}</span>
        <input
          type="range"
          min="0"
          max="0.5"
          step="0.01"
          value={offset()}
          onInput={(e) => setParameter("slitScan", "offset", parseFloat(e.currentTarget.value))}
          class="w-full"
        />
      </label>

      <label class="flex flex-col gap-1">
        <span class="text-xs text-white/50">Phase: {phase().toFixed(1)}</span>
        <input
          type="range"
          min="0"
          max="10"
          step="0.1"
          value={phase()}
          onInput={(e) => setParameter("slitScan", "phase", parseFloat(e.currentTarget.value))}
          class="w-full"
        />
      </label>

      <label class="flex flex-col gap-1">
        <span class="text-xs text-white/50">Frequency: {freq().toFixed(1)}</span>
        <input
          type="range"
          min="1"
          max="20"
          step="0.5"
          value={freq()}
          onInput={(e) => setParameter("slitScan", "freq", parseFloat(e.currentTarget.value))}
          class="w-full"
        />
      </label>
    </ModuleCard>
  );
}
