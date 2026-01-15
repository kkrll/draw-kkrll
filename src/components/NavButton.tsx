import { JSX } from "solid-js";

interface NavButtonProps {
  text: string;
  onClick: () => void;
  isSelected?: boolean;
  disabled?: boolean;
  "aria-label"?: string;
  icon?: JSX.Element;
  popoverTarget?: string;
  class?: string;
}

export default function NavButton(props: NavButtonProps) {
  return (
    <button
      popoverTarget={props.popoverTarget}
      type="button"
      onClick={props.onClick}
      disabled={props.disabled}
      aria-label={props["aria-label"]}
      class={`cursor-pointer flex justify-center items-center py-1 min-h-8 h-full text-xs font-mono text-foreground rounded-xl transition-colors ${
        props.disabled
          ? "opacity-50 cursor-not-allowed bg-background/30"
          : props.isSelected
            ? "bg-background pointer-none"
            : "bg-background/30 hover:bg-background/70"
      } ${props.icon ? "w-8" : "px-3"} ${props.class ?? ""}`}
    >
      {props.icon ? props.icon : props.text}
    </button>
  );
}
