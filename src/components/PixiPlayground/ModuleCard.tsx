import { type ParentProps, Show } from "solid-js";
import { createSortable, useDragDropContext } from "@thisbeyond/solid-dnd";

type ModuleCardProps = ParentProps<{
  title: string;
  variant?: "builtin" | "custom";
  moduleId: string;
  enabled: boolean;
  onToggle: () => void;
}>;

export function ModuleCard(props: ModuleCardProps) {
  const sortable = createSortable(props.moduleId);
  const [state] = useDragDropContext()!;

  const isCustom = () => props.variant === "custom";

  return (
    <div class="relative">
      {/* Drop indicator line */}
      <div
        class="absolute -top-1.5 left-0 right-0 h-0.5 bg-blue-500 rounded-full transition-opacity"
        classList={{
          "opacity-100": sortable.isActiveDroppable,
          "opacity-0": !sortable.isActiveDroppable,
        }}
      />
      <div
        ref={sortable.ref}
        class={`p-2 flex flex-col gap-3 rounded-2xl border border-white/10 ${!props.enabled ? "opacity-60" : ""} ${props.enabled && "bg-white/8"}`}
        classList={{
          "opacity-25": sortable.isActiveDraggable,
          "transition-transform": !!state.active.draggable,
        }}
      >
        <div class="flex items-center justify-between gap-2">
          <div class="flex items-center gap-2">
            {/* Drag handle */}
            <span
              {...sortable.dragActivators}
              class="text-white/30 select-none cursor-grab active:cursor-grabbing touch-none"
              title="Drag to reorder"
            >
              ⋮⋮
            </span>
            <h3
              class={`text-xs font-medium text-white/80 uppercase`}
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
            class={`relative w-9 h-5 rounded-full transition-colors ${props.enabled
              ? "bg-white/50"
              : "bg-white/20"
              }`}
            title={props.enabled ? "Disable filter" : "Enable filter"}
          >
            <span
              class={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${props.enabled ? "translate-x-4" : ""
                }`}
            />
          </button>
        </div>

        <Show when={props.enabled}>
          {props.children}
        </Show>
      </div>
    </div>
  );
}
