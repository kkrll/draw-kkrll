import type { ParentProps } from "solid-js";

type ModuleCardProps = ParentProps<{
  title: string;
  variant?: "default" | "custom";
}>;

export function ModuleCard(props: ModuleCardProps) {
  const isCustom = () => props.variant === "custom";

  return (
    <div
      class={`rounded p-3 flex flex-col gap-3 ${
        isCustom()
          ? "border border-green-500/30 bg-green-900/10"
          : "border border-white/10"
      }`}
    >
      <h3
        class={`text-sm font-medium ${
          isCustom() ? "text-green-400" : "text-white/80"
        }`}
      >
        {props.title}
      </h3>
      {props.children}
    </div>
  );
}
