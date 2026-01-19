import { createSignal, type ParentProps, Show } from "solid-js";

type ModuleCardProps = ParentProps<{
  title: string;
  variant?: "builtin" | "custom";
  moduleId: string;
  enabled: boolean;
  onToggle: () => void;
  onReorder: (fromId: string, toId: string) => void;
}>;

export function ModuleCard(props: ModuleCardProps) {
  const [isDragOver, setIsDragOver] = createSignal(false);
  const [isDragging, setIsDragging] = createSignal(false);

  const isCustom = () => props.variant === "custom";

  const handleDragStart = (e: DragEvent) => {
    e.dataTransfer?.setData("text/plain", props.moduleId);
    e.dataTransfer!.effectAllowed = "move";
    setIsDragging(true);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    e.dataTransfer!.dropEffect = "move";
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const fromId = e.dataTransfer?.getData("text/plain");
    if (fromId && fromId !== props.moduleId) {
      props.onReorder(fromId, props.moduleId);
    }
  };

  return (
    <div
      draggable={true}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      class={`rounded p-3 flex flex-col gap-3 transition-all cursor-grab active:cursor-grabbing ${
        isCustom()
          ? "border border-green-500/30 bg-green-900/10"
          : "border border-white/10"
      } ${isDragging() ? "opacity-50" : ""} ${
        isDragOver() ? "border-blue-400 border-2" : ""
      } ${!props.enabled ? "opacity-60" : ""}`}
    >
      <div class="flex items-center justify-between gap-2">
        <div class="flex items-center gap-2">
          {/* Drag handle */}
          <span class="text-white/30 select-none" title="Drag to reorder">
            ⋮⋮
          </span>
          <h3
            class={`text-sm font-medium ${
              isCustom() ? "text-green-400" : "text-white/80"
            }`}
          >
            {props.title}
          </h3>
        </div>

        {/* Toggle switch */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            props.onToggle();
          }}
          class={`relative w-9 h-5 rounded-full transition-colors ${
            props.enabled
              ? isCustom()
                ? "bg-green-500"
                : "bg-blue-500"
              : "bg-white/20"
          }`}
          title={props.enabled ? "Disable filter" : "Enable filter"}
        >
          <span
            class={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
              props.enabled ? "translate-x-4" : ""
            }`}
          />
        </button>
      </div>

      <Show when={props.enabled}>
        {props.children}
      </Show>
    </div>
  );
}
