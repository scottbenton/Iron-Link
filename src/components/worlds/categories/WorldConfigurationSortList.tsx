import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { PropsWithChildren } from "react";

export function WorldConfigurationSortList({
  items,
  onReorder,
  children,
}: PropsWithChildren<{
  items: { id: string; label: string }[];
  onReorder: (ids: string[]) => void;
}>) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );
  const name = (id: string | number) =>
    items.find((item) => item.id === id)?.label ?? "Item";
  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      accessibility={{
        announcements: {
          onDragStart: ({ active }) =>
            `Picked up ${name(active.id)}. Use the arrow keys to move, then press space to drop.`,
          onDragOver: ({ active, over }) =>
            over
              ? `${name(active.id)} is at position ${items.findIndex((item) => item.id === over.id) + 1} of ${items.length}.`
              : undefined,
          onDragEnd: ({ active, over }) =>
            over
              ? `${name(active.id)} moved to position ${items.findIndex((item) => item.id === over.id) + 1}.`
              : `Moving ${name(active.id)} canceled.`,
          onDragCancel: ({ active }) => `Moving ${name(active.id)} canceled.`,
        },
      }}
      onDragEnd={({ active, over }) => {
        if (!over || active.id === over.id) return;
        const from = items.findIndex((item) => item.id === active.id);
        const to = items.findIndex((item) => item.id === over.id);
        if (from >= 0 && to >= 0)
          onReorder(arrayMove(items, from, to).map((item) => item.id));
      }}
    >
      <SortableContext
        items={items.map((item) => item.id)}
        strategy={verticalListSortingStrategy}
      >
        {children}
      </SortableContext>
    </DndContext>
  );
}
