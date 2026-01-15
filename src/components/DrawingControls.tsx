/**
 * Drawing Controls Component (SolidJS)
 *
 * Action buttons for the drawing toolbar.
 */

import Divider from "./ui/Divider";
import ImageControlsPopover from "./ImageControlsPopover";
import NavButton from "./NavButton";
import { CloseIcon } from "./ui/icons";
import type { ColorMode } from "../lib/types";

interface DrawingControlsProps {
  onDownloadPng: () => void;
  onDownloadTxt: () => void;
  onExit: () => void;
  onImageUpload: (file: File) => void;
  onReset: () => void;
  onClear: () => void;
  isConverting: boolean;
  blackPoint: number;
  whitePoint: number;
  onBlackPointChange: (value: number) => void;
  onWhitePointChange: (value: number) => void;
  bgBlur: number;
  bgScale: number;
  bgOffsetX: number;
  bgOffsetY: number;
  onBgBlurChange: (value: number) => void;
  onBgScaleChange: (value: number) => void;
  onBgOffsetChange: (x: number, y: number) => void;
  hasSourceImage: boolean;
  colorMode: ColorMode;
  onSetMixedMode: () => void;
}

export default function DrawingControls(props: DrawingControlsProps) {
  return (
    <div class="flex gap-1 animate-[fadeIn_200ms_ease-in-out]">
      <ImageControlsPopover
        blackPoint={props.blackPoint}
        whitePoint={props.whitePoint}
        onBlackPointChange={props.onBlackPointChange}
        onWhitePointChange={props.onWhitePointChange}
        onImageUpload={props.onImageUpload}
        onReset={props.onReset}
        isConverting={props.isConverting}
        bgBlur={props.bgBlur}
        bgScale={props.bgScale}
        bgOffsetX={props.bgOffsetX}
        bgOffsetY={props.bgOffsetY}
        onBgBlurChange={props.onBgBlurChange}
        onBgScaleChange={props.onBgScaleChange}
        onBgOffsetChange={props.onBgOffsetChange}
        hasSourceImage={props.hasSourceImage}
        colorMode={props.colorMode}
        onSetMixedMode={props.onSetMixedMode}
      />
      <Divider vertical class="bg-foreground-07/20 mx-2" />
      <NavButton text="Save as PNG" onClick={props.onDownloadPng} />
      <NavButton text="Save as TXT" onClick={props.onDownloadTxt} />
      <Divider vertical class="bg-foreground-07/20 mx-2" />
      <NavButton text="Clear" onClick={props.onClear} />
      <Divider vertical class="bg-foreground-07/20 mx-2" />
      <NavButton text="Exit" onClick={props.onExit} icon={<CloseIcon />} />
    </div>
  );
}
