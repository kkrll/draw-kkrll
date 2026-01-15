import { cn } from "../../lib/utils";

interface IconProps {
  stroke?: number;
  size?: number;
  class?: string;
}

export function Darken(props: IconProps) {
  return (
    <svg
      width={props.size ?? 16}
      height={props.size ?? 16}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      class={cn(
        "block select-none shrink-0 transition-all duration-100 text-foreground",
        props.class
      )}
    >
      <title>Darken</title>
      <circle cx="12" cy="12" r="2" fill="currentColor" />
      <path d="M7.5 7.5L1 1M7.5 7.5L7.5 3M7.5 7.5L3 7.5" stroke="currentColor" stroke-width={props.stroke ?? 1.5} />
      <path d="M7.5 16.5L1 23M7.5 16.5L7.5 21M7.5 16.5L3 16.5" stroke="currentColor" stroke-width={props.stroke ?? 1.5} />
      <path d="M16.5 7.5L23 1M16.5 7.5L21 7.5M16.5 7.5V3" stroke="currentColor" stroke-width={props.stroke ?? 1.5} />
      <path d="M16.5 16.5L23 23M16.5 16.5L21 16.5M16.5 16.5V21" stroke="currentColor" stroke-width={props.stroke ?? 1.5} />
    </svg>
  );
}

export function Lighten(props: IconProps) {
  return (
    <svg
      width={props.size ?? 16}
      height={props.size ?? 16}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      class={cn(
        "block select-none shrink-0 transition-all duration-100 text-foreground",
        props.class
      )}
    >
      <title>Lighten</title>
      <circle cx="12" cy="12" r="4.5" stroke="currentColor" stroke-width={props.stroke ?? 1.5} />
      <path d="M22.5 1.5L18 6M22.5 1.5L22.5 6M22.5 1.5L18 1.5" stroke="currentColor" stroke-width={props.stroke ?? 1.5} />
      <path d="M1.5 1.5L6 6M1.5 1.5L6 1.5M1.5 1.5V6" stroke="currentColor" stroke-width={props.stroke ?? 1.5} />
      <path d="M1.5 22.5L6 18M1.5 22.5L6 22.5M1.5 22.5V18" stroke="currentColor" stroke-width={props.stroke ?? 1.5} />
      <path d="M22.5 22.5L18 18M22.5 22.5L18 22.5M22.5 22.5V18" stroke="currentColor" stroke-width={props.stroke ?? 1.5} />
    </svg>
  );
}

export function Eraser(props: IconProps) {
  return (
    <svg
      width={props.size ?? 16}
      height={props.size ?? 16}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width={props.stroke ?? 1.5}
      stroke-linecap="round"
      stroke-linejoin="round"
      class={props.class}
    >
      <title>Erase</title>
      <g clip-path="url(#clip0_3957_45489)">
        <path d="M6.82419 13.5288L2.30016 19.0289L6.5 22.5L10.7422 22.5L13.4615 19.0982M6.82419 13.5288L14.9844 3.69531L21.614 9.2582L13.4615 19.0982M6.82419 13.5288L13.4615 19.0982" stroke="currentColor" />
        <path d="M2.24787 22.506L21.8003 22.5229" stroke="currentColor" />
      </g>
      <defs>
        <clipPath id="clip0_3957_45489">
          <rect width="24" height="24" fill="currentColor" />
        </clipPath>
      </defs>
    </svg>
  );
}

export function Brush(props: IconProps = {}) {
  return (
    <svg
      width={props.size ?? 16}
      height={props.size ?? 16}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentcolor"
      stroke-width={props.stroke ?? 1.5}
      stroke-linecap="round"
      stroke-linejoin="round"
      class={props.class}
    >
      <title>Brush</title>
      <path d="M14 15L11 18L8 15.5L10.5 12M14 15L23 1L10.5 12M14 15L10.5 12" stroke="currentColor" stroke-width={props.stroke ?? 1.5} />
      <path d="M4.5 17C5.49644 15.4986 7.00356 15.3347 8.00356 15.5014L11.0036 18C10.0036 24 -1.99644 22 1.00356 22C4.00356 22 3.50356 18.5014 4.5 17Z" stroke="currentColor" stroke-width={props.stroke ?? 1.5} />
    </svg>
  );
}

export function CloseIcon(props: IconProps = {}) {
  return (
    <svg
      width={props.size ?? 16}
      height={props.size ?? 16}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width={props.stroke ?? 1.5}
      stroke-linecap="round"
      stroke-linejoin="round"
      class={props.class}
    >
      <title>Close</title>
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

export function UploadPicture(props: IconProps = {}) {
  return (
    <svg
      width={props.size ?? 16}
      height={props.size ?? 16}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width={props.stroke ?? 1.5}
      stroke-linecap="round"
      stroke-linejoin="round"
      class={props.class}
    >
      <title>Upload picture (or just cmd+V it)</title>
      <rect x="1.5" y="1.5" width="21" height="21" stroke="currentColor" stroke-width={props.stroke ?? 1.5} />
      <rect x="1.5" y="1.5" width="21" height="16" stroke="currentColor" stroke-width={props.stroke ?? 1.5} />
      <circle cx="18.5" cy="5.5" r="2" stroke="currentColor" stroke-width={props.stroke ?? 1.5} />
      <path d="M1.5 12L6.5 7.5L12.5 12.5M8 17.5L12.5 12.5M12.5 12.5L15 10L22.5 16.5" stroke="currentColor" stroke-width={props.stroke ?? 1.5} />
    </svg>
  );
}
