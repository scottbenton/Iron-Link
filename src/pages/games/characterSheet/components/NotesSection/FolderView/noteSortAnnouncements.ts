import type { Announcements, ScreenReaderInstructions } from "@dnd-kit/core";
import type { TFunction } from "i18next";

// dnd-kit's default announcements read out the dragged note's id (a UUID)
// in English; these read its title and position instead.
export function getNoteSortAccessibility(
  t: TFunction,
  orderedIds: string[],
  getTitle: (id: string) => string | undefined,
): {
  announcements: Announcements;
  screenReaderInstructions: ScreenReaderInstructions;
} {
  const name = (id: string | number) =>
    getTitle(String(id)) || t("common.unknown", "Unknown");
  const position = (id: string | number) => orderedIds.indexOf(String(id)) + 1;
  const canceled = (id: string | number) =>
    t("notes.sort.canceled", "Moving {{name}} canceled.", { name: name(id) });

  return {
    screenReaderInstructions: {
      draggable: t(
        "notes.sort.instructions",
        "To move this note, press space or enter. Use the arrow keys to move it, then press space or enter again to drop it, or escape to cancel.",
      ),
    },
    announcements: {
      onDragStart: ({ active }) =>
        t(
          "notes.sort.picked-up",
          "Picked up {{name}}, at position {{position}} of {{count}}.",
          {
            name: name(active.id),
            position: position(active.id),
            count: orderedIds.length,
          },
        ),
      onDragOver: ({ active, over }) =>
        over
          ? t(
              "notes.sort.over",
              "{{name}} is at position {{position}} of {{count}}.",
              {
                name: name(active.id),
                position: position(over.id),
                count: orderedIds.length,
              },
            )
          : undefined,
      onDragEnd: ({ active, over }) =>
        over
          ? t(
              "notes.sort.dropped",
              "{{name}} moved to position {{position}} of {{count}}.",
              {
                name: name(active.id),
                position: position(over.id),
                count: orderedIds.length,
              },
            )
          : canceled(active.id),
      onDragCancel: ({ active }) => canceled(active.id),
    },
  };
}
