/**
 * Color Mode Toggle Component (SolidJS)
 *
 * Toggles between original colors and monochrome rendering.
 * Disabled when no source image is loaded (no color data available).
 */

import { Match, Switch } from "solid-js";
import NavButton from "./NavButton";
import type { ColorMode } from "../lib/types";

interface ColorModeToggleProps {
  colorMode: ColorMode;
  onToggle: () => void;
  disabled?: boolean;
}

function MonoIcon() {
  return (
    <svg
      width={16}
      height={16}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      class="block select-none shrink-0 transition-all duration-100 text-foreground"
    >
      <title>Monochrome</title>
      <rect x="2" y="2" width="6" height="6" rx="2" fill="#BCBCBC" />
      <rect x="9" y="2" width="6" height="6" rx="2" fill="#898887" />
      <rect x="16" y="2" width="6" height="6" rx="2" fill="#585756" />
      <rect x="2" y="9" width="6" height="6" rx="2" fill="#898887" />
      <rect x="9" y="9" width="6" height="6" rx="2" fill="#585756" />
      <rect x="16" y="9" width="6" height="6" rx="2" fill="#404040" />
      <rect x="2" y="16" width="6" height="6" rx="2" fill="#585756" />
      <rect x="9" y="16" width="6" height="6" rx="2" fill="#404040" />
      <rect x="16" y="16" width="6" height="6" rx="2" fill="#2A2A2A" />
    </svg>
  );
}

function ColourIcon() {
  return (
    <svg
      width={16}
      height={16}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      class="block select-none shrink-0 transition-all duration-100 text-foreground"
    >
      <title>Coloured</title>
      <rect x="2" y="2" width="6" height="6" rx="2" fill="#FFB007" />
      <rect x="9" y="2" width="6" height="6" rx="2" fill="#E67700" />
      <rect x="16" y="2" width="6" height="6" rx="2" fill="#E60000" />
      <rect x="2" y="9" width="6" height="6" rx="2" fill="#7EDD03" />
      <rect x="9" y="9" width="6" height="6" rx="2" fill="#C7C7C7" />
      <rect x="16" y="9" width="6" height="6" rx="2" fill="#8112B9" />
      <rect x="2" y="16" width="6" height="6" rx="2" fill="#03DD61" />
      <rect x="9" y="16" width="6" height="6" rx="2" fill="#0594C0" />
      <rect x="16" y="16" width="6" height="6" rx="2" fill="#0303FF" />
    </svg>
  );
}

function OverlayIcon() {
  return (
    <svg
      width={16}
      height={16}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      class="block select-none shrink-0 transition-all duration-100 text-foreground"
    >
      <title>Overlay</title>
      <rect x="1" y="1" width="22" height="22" rx="4" fill="url(#paint0_linear_overlay)" fill-opacity="0.5" />
      <path d="M8.5 16.5039L15.5 7.50197M8.5 16.5039H10.5M8.5 16.5039L7 16.5016M15.5 7.50197L17 7.50201M15.5 7.50197L13.5 7.50201M8.5 7.50034L15.5 16.5016M8.5 7.50034L10.5 7.50197M8.5 7.50034L7 7.50197M15.5 16.5016L17 16.5039M15.5 16.5016L13.5 16.5039" stroke="white" />
      <defs>
        <linearGradient id="paint0_linear_overlay" x1="12" y1="1" x2="12" y2="23" gradientUnits="userSpaceOnUse">
          <stop stop-color="#FF8345" />
          <stop offset="1" stop-color="#4252FF" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export default function ColorModeToggle(props: ColorModeToggleProps) {
  const getIcon = () => (
    <Switch fallback={<MonoIcon />}>
      <Match when={props.colorMode === "original"}>
        <ColourIcon />
      </Match>
      <Match when={props.colorMode === "mixed"}>
        <OverlayIcon />
      </Match>
    </Switch>
  );

  return (
    <NavButton
      text="Colour mode"
      onClick={props.onToggle}
      disabled={props.disabled}
      icon={getIcon()}
      aria-label={`Color mode: ${props.colorMode}. Click to toggle.`}
    />
  );
}
