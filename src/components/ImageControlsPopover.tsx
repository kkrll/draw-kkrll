/**
 * Image Controls Popover Component (SolidJS)
 *
 * A popover control for:
 * - Uploading images
 * - Adjusting black point / white point
 * - Background image controls
 * - Resetting canvas
 */

import { Show } from "solid-js";
import { UploadPicture } from "./ui/icons";
import Divider from "./ui/Divider";
import NavButton from "./NavButton";
import OffsetControl2D from "./OffsetControl2D";
import type { ColorMode } from "../lib/types";
import "../styles/ascii.css";

interface ImageControlsPopoverProps {
  blackPoint: number;
  whitePoint: number;
  onBlackPointChange: (value: number) => void;
  onWhitePointChange: (value: number) => void;
  onImageUpload: (file: File) => void;
  onReset: () => void;
  isConverting: boolean;
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

export default function ImageControlsPopover(props: ImageControlsPopoverProps) {
  let fileInputRef: HTMLInputElement | undefined;

  const handleFileChange = (e: Event) => {
    const input = e.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      props.onImageUpload(file);
      if (fileInputRef) {
        fileInputRef.value = "";
      }
    }
  };

  const handleUploadClick = () => {
    fileInputRef?.click();
  };

  return (
    <div class="h-full">
      <NavButton
        popoverTarget="image-controls"
        text="Image controls"
        class="anchor-image-controls"
        icon={<UploadPicture stroke={1} />}
        onClick={() => {}}
      />

      <div
        class="image-controls-popover p-3 bg-background border border-foreground/20 rounded-2xl shadow-lg min-w-48"
        popover="auto"
        id="image-controls"
      >
        {/* Upload Button */}
        <button
          type="button"
          onClick={handleUploadClick}
          class="w-full flex items-center justify-center gap-2 cursor-pointer py-2 text-xs font-mono text-foreground rounded-xl bg-background-07 hover:bg-background-05 mb-3"
        >
          {props.isConverting ? "Converting..." : "Upload image"}
        </button>
        <input
          ref={(el) => (fileInputRef = el)}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          style={{ display: "none" }}
        />

        <Divider class="bg-foreground-05/50 my-3" />

        {/* Black Point Slider */}
        <div class="mb-4">
          <label
            for="black-point-slider"
            class="text-xs font-mono font-medium text-foreground-07 block mb-2"
          >
            Black point
          </label>
          <input
            id="black-point-slider"
            type="range"
            min={0}
            max={50}
            value={Math.round(props.blackPoint * 100)}
            onInput={(e) => props.onBlackPointChange(Number(e.currentTarget.value) / 100)}
            class="w-full accent-foreground slider-tapered"
          />
        </div>

        {/* White Point Slider */}
        <div class="mb-3">
          <label
            for="white-point-slider"
            class="text-xs font-mono font-medium text-foreground-07 block mb-2"
          >
            White point
          </label>
          <input
            id="white-point-slider"
            type="range"
            min={50}
            max={100}
            value={Math.round(props.whitePoint * 100)}
            onInput={(e) => props.onWhitePointChange(Number(e.currentTarget.value) / 100)}
            class="w-full accent-foreground slider-tapered"
          />
        </div>

        <Divider class="bg-foreground-05/50 my-3" />

        {/* Background Image Section */}
        <div class="relative">
          {/* Blur Slider */}
          <div class="mb-4">
            <label
              for="bg-blur-slider"
              class="text-xs font-mono font-medium text-foreground-07 block mb-2"
            >
              Blur
            </label>
            <input
              id="bg-blur-slider"
              type="range"
              min={0}
              max={20}
              step={1}
              value={props.bgBlur}
              onInput={(e) => props.onBgBlurChange(Number(e.currentTarget.value))}
              class="w-full accent-foreground slider-tapered"
              disabled={!props.hasSourceImage}
            />
          </div>

          {/* Offset and Scale Controls */}
          <div class="mb-3">
            <div class="flex justify-between items-center mb-2">
              <label class="text-xs font-mono font-medium text-foreground-07">Offset</label>
              <label class="text-xs font-mono font-medium text-foreground-07">
                {Math.round(props.bgScale * 100)}%
              </label>
            </div>

            <div class="flex gap-3 items-center">
              <OffsetControl2D
                offsetX={props.bgOffsetX}
                offsetY={props.bgOffsetY}
                onChange={props.onBgOffsetChange}
                disabled={!props.hasSourceImage}
              />

              {/* Vertical Scale Slider */}
              <div class="relative" style={{ width: "24px", height: "120px" }}>
                <input
                  id="bg-scale-slider"
                  type="range"
                  min={0.5}
                  max={3}
                  step={0.1}
                  value={props.bgScale}
                  onInput={(e) => props.onBgScaleChange(Number(e.currentTarget.value))}
                  class="accent-foreground slider-vertical"
                  disabled={!props.hasSourceImage}
                />
              </div>
            </div>
          </div>

          {/* Overlay when not in mixed mode */}
          <Show when={props.colorMode !== "mixed"}>
            <div class="absolute inset-0 bg-overlay backdrop-blur-sm border-background-05 border-1 rounded-lg flex flex-col items-center justify-center gap-3 p-4">
              <p class="text-xs font-mono text-center text-foreground-07">
                Image is not displayed in this mode
              </p>
              <button
                type="button"
                onClick={props.onSetMixedMode}
                class="w-full flex items-center justify-center gap-2 cursor-pointer py-2 text-xs font-mono text-foreground rounded-xl bg-background-07 hover:bg-background-05 mb-3"
              >
                Mixed mode
              </button>
            </div>
          </Show>
        </div>

        <Divider class="bg-foreground-05/50 my-3" />

        {/* Reset Button */}
        <button
          type="button"
          onClick={props.onReset}
          class="w-full flex items-center justify-center cursor-pointer py-2 text-xs font-mono text-foreground rounded-xl bg-background/30 hover:bg-background/70"
        >
          Reset
        </button>
      </div>
    </div>
  );
}
