import { createContext, useContext, Accessor } from "solid-js";
import type { Application, Sprite, BlurFilter, ColorMatrixFilter, Filter } from "pixi.js";

export type PixiFilters = {
  blur: BlurFilter | undefined;
  colorMatrix: ColorMatrixFilter | undefined;
  halftone: Filter | undefined;
};

export type PixiContextType = {
  app: Accessor<Application | undefined>;
  sprite: Accessor<Sprite | undefined>;
  filters: Accessor<PixiFilters>;
  ready: Accessor<boolean>;
};

export const PixiContext = createContext<PixiContextType>();

export function usePixi() {
  const context = useContext(PixiContext);
  if (!context) {
    throw new Error("usePixi must be used within a PixiContext.Provider");
  }
  return context;
}
