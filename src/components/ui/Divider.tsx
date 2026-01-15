import { JSX } from "solid-js";

interface DividerProps {
  vertical?: boolean;
  class?: string;
}

export default function Divider(props: DividerProps) {
  return (
    <div
      class={`${props.vertical ? "w-px h-full" : "h-px w-full"} ${props.class ?? "bg-foreground-07"}`}
    />
  );
}
