/**
 * 2D Offset Control Component (SolidJS)
 *
 * A draggable control for setting X/Y offset values.
 */

import { onMount, onCleanup } from "solid-js";

interface OffsetControl2DProps {
  offsetX: number;
  offsetY: number;
  onChange: (x: number, y: number) => void;
  disabled?: boolean;
}

const CONTAINER_SIZE = 120;
const HANDLE_SIZE = 20;
const OFFSET_RANGE = 960;

export default function OffsetControl2D(props: OffsetControl2DProps) {
  let containerRef: HTMLDivElement | undefined;
  let isDragging = false;

  const offsetToPixel = (offset: number) => {
    return ((offset + OFFSET_RANGE) / (OFFSET_RANGE * 2)) * CONTAINER_SIZE;
  };

  const pixelToOffset = (pixel: number) => {
    return (pixel / CONTAINER_SIZE) * (OFFSET_RANGE * 2) - OFFSET_RANGE;
  };

  const handlePosition = (clientX: number, clientY: number) => {
    if (!containerRef || props.disabled) return;

    const rect = containerRef.getBoundingClientRect();
    let x = clientX - rect.left;
    let y = clientY - rect.top;

    x = Math.max(0, Math.min(CONTAINER_SIZE, x));
    y = Math.max(0, Math.min(CONTAINER_SIZE, y));

    const newOffsetX = Math.round(pixelToOffset(x));
    const newOffsetY = Math.round(pixelToOffset(y));

    props.onChange(newOffsetX, newOffsetY);
  };

  const handleMouseDown = (e: MouseEvent) => {
    if (props.disabled) return;
    isDragging = true;
    handlePosition(e.clientX, e.clientY);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    handlePosition(e.clientX, e.clientY);
  };

  const handleMouseUp = () => {
    isDragging = false;
  };

  const handleTouchStart = (e: TouchEvent) => {
    if (props.disabled) return;
    isDragging = true;
    const touch = e.touches[0];
    handlePosition(touch.clientX, touch.clientY);
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    const touch = e.touches[0];
    handlePosition(touch.clientX, touch.clientY);
  };

  const handleTouchEnd = () => {
    isDragging = false;
  };

  onMount(() => {
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("touchmove", handleTouchMove, { passive: false });
    document.addEventListener("touchend", handleTouchEnd);
  });

  onCleanup(() => {
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
    document.removeEventListener("touchmove", handleTouchMove);
    document.removeEventListener("touchend", handleTouchEnd);
  });

  const handleX = () => offsetToPixel(props.offsetX);
  const handleY = () => offsetToPixel(props.offsetY);

  return (
    <div class="flex flex-col gap-2">
      <div
        ref={(el) => (containerRef = el)}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        class={`relative bg-background-07 border border-foreground/20 rounded-xl ${
          props.disabled ? "opacity-50 cursor-not-allowed" : "cursor-crosshair"
        }`}
        style={{
          width: `${CONTAINER_SIZE}px`,
          height: `${CONTAINER_SIZE}px`,
        }}
      >
        {/* Center crosshairs */}
        <div
          class="absolute bg-foreground/10"
          style={{
            left: `${CONTAINER_SIZE / 2 - 0.5}px`,
            top: "0",
            width: "1px",
            height: `${CONTAINER_SIZE}px`,
          }}
        />
        <div
          class="absolute bg-foreground/10"
          style={{
            left: "0",
            top: `${CONTAINER_SIZE / 2 - 0.5}px`,
            width: `${CONTAINER_SIZE}px`,
            height: "1px",
          }}
        />

        {/* Draggable handle */}
        <div
          class="absolute rounded-full cursor-grab bg-foreground border-2 border-background shadow-lg pointer-events-none"
          style={{
            width: `${HANDLE_SIZE}px`,
            height: `${HANDLE_SIZE}px`,
            left: `${handleX() - HANDLE_SIZE / 2}px`,
            top: `${handleY() - HANDLE_SIZE / 2}px`,
          }}
        />
      </div>
    </div>
  );
}
