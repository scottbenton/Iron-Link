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
import { ReactNode, useState } from "react";
import { useTranslation } from "react-i18next";

export function WorldConfigurationSortList<T extends { id: string }>({
  items,
  getLabel,
  onReorder,
  renderItem,
}: {
  items: T[];
  getLabel: (item: T) => string;
  // While a returned promise is pending, the dropped order stays on screen.
  // Afterwards the list shows `items` again: the saved order, or the old one
  // if saving failed.
  onReorder: (ids: string[]) => Promise<unknown> | void;
  renderItem: (item: T, index: number) => ReactNode;
}) {
  const { t } = useTranslation();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const [pendingIds, setPendingIds] = useState<string[]>();
  const itemsById = new Map(items.map((item) => [item.id, item]));
  const ordered =
    pendingIds?.length === items.length &&
    pendingIds.every((id) => itemsById.has(id))
      ? pendingIds.map((id) => itemsById.get(id) as T)
      : items;

  const name = (id: string | number) => {
    const item = itemsById.get(String(id));
    return item ? getLabel(item) : String(id);
  };
  const position = (id: string | number) =>
    ordered.findIndex((item) => item.id === id) + 1;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      accessibility={{
        announcements: {
          onDragStart: ({ active }) =>
            t(
              "worlds.sort.picked-up",
              "Picked up {{name}}. Use the arrow keys to move, then press space to drop.",
              { name: name(active.id) },
            ),
          onDragOver: ({ active, over }) =>
            over
              ? t(
                  "worlds.sort.over",
                  "{{name}} is at position {{position}} of {{count}}.",
                  {
                    name: name(active.id),
                    position: position(over.id),
                    count: ordered.length,
                  },
                )
              : undefined,
          onDragEnd: ({ active, over }) =>
            over
              ? t(
                  "worlds.sort.dropped",
                  "{{name}} moved to position {{position}}.",
                  {
                    name: name(active.id),
                    position: position(over.id),
                  },
                )
              : t("worlds.sort.canceled", "Moving {{name}} canceled.", {
                  name: name(active.id),
                }),
          onDragCancel: ({ active }) =>
            t("worlds.sort.canceled", "Moving {{name}} canceled.", {
              name: name(active.id),
            }),
        },
      }}
      onDragEnd={({ active, over }) => {
        if (!over || active.id === over.id) return;
        const from = ordered.findIndex((item) => item.id === active.id);
        const to = ordered.findIndex((item) => item.id === over.id);
        if (from < 0 || to < 0) return;
        const ids = arrayMove(ordered, from, to).map((item) => item.id);
        const saving = onReorder(ids);
        if (saving) {
          setPendingIds(ids);
          saving
            .catch(() => {})
            .finally(() =>
              setPendingIds((current) =>
                current === ids ? undefined : current,
              ),
            );
        }
      }}
    >
      <SortableContext
        items={ordered.map((item) => item.id)}
        strategy={verticalListSortingStrategy}
      >
        {ordered.map(renderItem)}
      </SortableContext>
    </DndContext>
  );
}
