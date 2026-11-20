import { DotsThreeIcon, ShareNetworkIcon } from "@phosphor-icons/react";
import { useState } from "react";

import { Stack } from "ui/primitives";

import { css } from "styled-system/css";

import { BreadcrumbItem, Breadcrumbs } from "../../components/Breadcrumbs";
import { NoteTabPanel, NoteTabs } from "../../components/Tabs";
import { Text } from "../../components/Text";
import { ActionToolbar, ActionToolbarIconButton } from "../ActionToolbar";

/* ------------------------------------------------------------------------ */
/* Notes                                                                    */
/* ------------------------------------------------------------------------ */

const openNotes = [
  { id: "session-4", label: "Session 4: The Drowned Archive" },
  { id: "vows", label: "Kira's Vows" },
  { id: "salvagers", label: "The Salvagers" },
];

/**
 * The note's toolbar, inset like the other columns' contents and kept to
 * the note's own width, so on a wide column the breadcrumbs and actions sit
 * over the text rather than at the column's far edges.
 */
const noteToolbarStyles = css({
  boxSizing: "border-box",
  maxWidth: "prose",
  paddingInline: "4",
  paddingBlockStart: "3",
  marginInline: "auto",
});

const noteBodyStyles = css({
  boxSizing: "border-box",
  maxWidth: "prose",
  paddingInline: "4",
  paddingBlock: "5",
  marginInline: "auto",
});

/** The open notes as tabs, each with its toolbar, as in the live app. */
export function NotesColumn() {
  const [notes, setNotes] = useState(openNotes);
  const [value, setValue] = useState<string | null>("session-4");
  const close = (id: string) => {
    const index = notes.findIndex((note) => note.id === id);
    const next = notes.filter((note) => note.id !== id);
    setNotes(next);
    if (id === value) {
      setValue(next[Math.min(index, next.length - 1)]?.id ?? null);
    }
  };
  return (
    <NoteTabs
      tabs={notes}
      value={value}
      onValueChange={setValue}
      onClose={close}
      onAdd={() => {}}
      className={css({ height: "100%" })}
    >
      {notes.map((note) => (
        <NoteTabPanel key={note.id} value={note.id}>
          <div className={noteToolbarStyles}>
            <ActionToolbar
              label="Note Actions"
              breadcrumbs={
                <Breadcrumbs>
                  <BreadcrumbItem href="#notes">Notes</BreadcrumbItem>
                  <BreadcrumbItem href="#sessions">Sessions</BreadcrumbItem>
                  <BreadcrumbItem current>{note.label}</BreadcrumbItem>
                </Breadcrumbs>
              }
            >
              <ActionToolbarIconButton label="Share Note">
                <ShareNetworkIcon />
              </ActionToolbarIconButton>
              <ActionToolbarIconButton label="More Note Actions">
                <DotsThreeIcon weight="bold" />
              </ActionToolbarIconButton>
            </ActionToolbar>
          </div>
          <Stack gap="3" className={noteBodyStyles}>
            <Text variant="h3" as="h3">
              {note.label}
            </Text>
            <Text>
              Kira and Orrin reached the archive at low tide. The lower stacks
              were already under water, and something had dragged the shelves
              into a barricade across the reading room.
            </Text>
            <Text>
              Orrin swore an iron vow to recover the starchart before the next
              flood. Kira is less sure it is still there: the salvager they met
              at the dock was carrying a tube of the same stamped leather.
            </Text>
            <Text>
              Open threads: who hired the salvager, why the archive keepers
              left, and what is moving under the water in the east wing.
            </Text>
          </Stack>
        </NoteTabPanel>
      ))}
      {notes.length === 0 && (
        <Stack alignItems="center" gap="3" padding="8">
          <Text color="muted">No notes open.</Text>
        </Stack>
      )}
    </NoteTabs>
  );
}
