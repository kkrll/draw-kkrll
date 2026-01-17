import { createContext, useContext, type JSX } from "solid-js";
import type { AsciiCanvasContextValue } from "./types";

const AsciiCanvasContext = createContext<AsciiCanvasContextValue>()

export function AsciiCanvasProvider(props: {
  value: AsciiCanvasContextValue;
  children: JSX.Element
}) {
  return (
    <AsciiCanvasContext.Provider value={props.value}>
      {props.children}
    </AsciiCanvasContext.Provider>
  )
}

export function useAsciiCanvas(): AsciiCanvasContextValue {
  const context = useContext(AsciiCanvasContext);
  if (!context) {
    throw new Error("useAsciiCanvas must be used within AsciiCanvasProvider")
  }
  return context
}
