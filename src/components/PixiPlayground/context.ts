import { createContext, useContext, Accessor, Setter } from "solid-js";
import type { Application, Sprite, BlurFilter, ColorMatrixFilter, Filter } from "pixi.js";

export type ModuleConfig = {
  id: string;
  name: string;
  variant: "builtin" | "custom";
  enabled: boolean;
  order: number;
  filter: Filter | BlurFilter | ColorMatrixFilter;
};

export type PixiContextType = {
  app: Accessor<Application | undefined>;
  sprite: Accessor<Sprite | undefined>;
  modules: Accessor<ModuleConfig[]>;
  setModules: Setter<ModuleConfig[]>;
  ready: Accessor<boolean>;
  // Helper functions
  toggleModule: (id: string) => void;
  reorderModules: (fromId: string, toId: string) => void;
  getFilter: <T extends Filter = Filter>(id: string) => T | undefined;
};

export const PixiContext = createContext<PixiContextType>();

export function usePixi() {
  const context = useContext(PixiContext);
  if (!context) {
    throw new Error("usePixi must be used within a PixiContext.Provider");
  }
  return context;
}
