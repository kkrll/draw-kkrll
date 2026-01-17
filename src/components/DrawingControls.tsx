import Divider from "./ui/Divider";
import ImageControlsPopover from "./ImageControlsPopover";
import NavButton from "./NavButton";
import { CloseIcon } from "./ui/icons";
import { useAsciiCanvas } from "./AsciiCanvas/context";

export default function DrawingControls() {
  const {
    style,
    colorMode,
    hasSourceImage,
    blackPoint,
    whitePoint,
    bgBlur,
    bgScale,
    bgOffsetX,
    bgOffsetY,
    isConverting,
    handlers,
  } = useAsciiCanvas();

  return (
    <div class="flex gap-1 animate-[fadeIn_200ms_ease-in-out]">
      <ImageControlsPopover
        blackPoint={blackPoint()}
        whitePoint={whitePoint()}
        onBlackPointChange={(v) => handlers.onContrastChange(v, whitePoint())}
        onWhitePointChange={(v) => handlers.onContrastChange(blackPoint(), v)}
        onImageUpload={handlers.onImageUpload}
        onReset={handlers.onReset}
        isConverting={isConverting()}
        bgBlur={bgBlur()}
        bgScale={bgScale()}
        bgOffsetX={bgOffsetX()}
        bgOffsetY={bgOffsetY()}
        onBgBlurChange={(v) => handlers.onBgChange(v, bgScale(), bgOffsetX(),
          bgOffsetY())}
        onBgScaleChange={(v) => handlers.onBgChange(bgBlur(), v, bgOffsetX(),
          bgOffsetY())}
        onBgOffsetChange={(x, y) => handlers.onBgChange(bgBlur(), bgScale(), x, y)}
        hasSourceImage={hasSourceImage()}
        colorMode={colorMode()}
        onSetMixedMode={handlers.onSetMixedMode}
      />
      <Divider vertical class="bg-foreground-07/20 mx-2" />
      <NavButton text="Save as PNG" onClick={handlers.onDownloadPng} />
      <NavButton text="Save as TXT" onClick={handlers.onDownloadTxt}
        disabled={style() !== "Ascii"} />
      <Divider vertical class="bg-foreground-07/20 mx-2" />
      <NavButton text="Clear" onClick={handlers.onClear} />
      <Divider vertical class="bg-foreground-07/20 mx-2" />
      <NavButton text="Exit" onClick={handlers.onExit} icon={<CloseIcon />} />
    </div>
  );
}
