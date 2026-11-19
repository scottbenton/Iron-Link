import {
  FileTextIcon,
  FolderSimpleIcon,
  GlobeHemisphereWestIcon,
  PlusIcon,
  XIcon,
} from "@phosphor-icons/react";
import { ReactNode, useEffect, useRef, useState } from "react";

import { focusRing } from "ui/styles/focus";

import { css } from "styled-system/css";

import { Button } from "../../components/Button";
import { Drawer, DrawerBody, DrawerHeader } from "../../components/Drawer";
import { IconButton } from "../../components/IconButton";

export type OpenNoteType = "note" | "folder" | "world";

export interface OpenNote {
  id: string;
  label: string;
  type: OpenNoteType;
}

const typeIcons: Record<OpenNoteType, ReactNode> = {
  note: <FileTextIcon />,
  folder: <FolderSimpleIcon />,
  world: <GlobeHemisphereWestIcon />,
};

const listStyles = css({
  display: "flex",
  flexDirection: "column",
  gap: "1",
  margin: 0,
  padding: 0,
  listStyle: "none",
});

const rowStyles = css({
  display: "flex",
  alignItems: "center",
  gap: "1",
  borderRadius: "md",
  "&[data-current]": { background: "overlay.selected" },
});

const rowButtonStyles = css({
  boxSizing: "border-box",
  flex: "1 1 auto",
  minWidth: 0,
  minHeight: "56px",
  display: "flex",
  alignItems: "center",
  gap: "3",
  margin: 0,
  paddingInline: "2",
  border: 0,
  borderRadius: "md",
  background: "transparent",
  color: "fg.default",
  font: "inherit",
  fontWeight: "medium",
  textAlign: "start",
  cursor: "pointer",
  outline: "none",
  WebkitTapHighlightColor: "transparent",
  transition: "background-color token(durations.fast) linear",
  _hoverable: { _hover: { background: "overlay.hover" } },
  _active: { background: "overlay.pressed" },
  _focusVisible: focusRing.inset,
  "&[aria-current]": { fontWeight: "semibold" },
  "& [data-part=well]": {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flex: "none",
    width: "36px",
    height: "36px",
    borderRadius: "md",
    background: "bg.muted",
    color: "fg.muted",
    "& svg": { width: "icon.md", height: "icon.md" },
  },
  "& [data-part=label]": {
    minWidth: 0,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
});

const contentStyles = css({ display: "grid", gap: "2", minWidth: 0 });

const footerStyles = css({
  paddingBlockStart: "2",
  borderTop: "1px solid token(colors.border.subtle)",
});

const emptyStyles = css({
  margin: 0,
  paddingBlock: "4",
  color: "fg.muted",
  textAlign: "center",
});

export interface OpenNotesSheetProps {
  open: boolean;
  onClose: () => void;
  /** The open notes, folders and world pages, in tab order. */
  notes: OpenNote[];
  currentId: string | null;
  /** Shows a note; the sheet closes itself. */
  onSelect: (id: string) => void;
  /** Closes a note's tab. Focus moves to the row that takes its place. */
  onCloseNote: (id: string) => void;
  /** Left out where the person has no notes folder of their own. */
  onNewNote?: () => void;
  onAllNotes?: () => void;
  title?: string;
  newNoteLabel?: string;
  allNotesLabel?: string;
  closeNoteLabel?: (name: string) => string;
  emptyLabel?: string;
  closeLabel?: string;
}

/**
 * The phone's list of open notes, in place of the Notes tab strip, the way a
 * phone browser lists its tabs: a sheet from the bottom with a row per open
 * note, folder or world page, each with its own Close button beside it (a
 * sibling, never inside the row), plus New note and All notes. Opening it
 * puts focus on the open note.
 */
export function OpenNotesSheet(props: OpenNotesSheetProps) {
  const {
    open,
    onClose,
    notes,
    currentId,
    onSelect,
    onCloseNote,
    onNewNote,
    onAllNotes,
    title = "Open notes",
    newNoteLabel = "New note",
    allNotesLabel = "All notes",
    closeNoteLabel = (name) => `Close ${name}`,
    emptyLabel = "No notes open.",
    closeLabel = "Close",
  } = props;

  const rows = useRef(new Map<string, HTMLButtonElement>());
  const contentRef = useRef<HTMLDivElement>(null);
  const currentRef = useRef<HTMLButtonElement | null>(null);

  // Closing a row moves focus to the row that takes its place, or the one
  // before it, or the sheet's title once none is left.
  const [focusTarget, setFocusTarget] = useState<string | null>(null);
  useEffect(() => {
    if (focusTarget === null) return;
    const row = rows.current.get(focusTarget);
    if (row) {
      row.focus();
    } else {
      const heading = contentRef.current
        ?.closest("[role=dialog]")
        ?.querySelector<HTMLElement>("h2");
      if (heading) {
        heading.tabIndex = -1;
        heading.focus();
      }
    }
    setFocusTarget(null);
  }, [focusTarget, notes]);

  const closeNote = (id: string) => {
    const index = notes.findIndex((note) => note.id === id);
    const next = notes[index + 1] ?? notes[index - 1];
    onCloseNote(id);
    setFocusTarget(next?.id ?? "");
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      side="bottom"
      initialFocus={currentRef}
    >
      <DrawerHeader
        title={title}
        closeLabel={closeLabel}
        actions={
          onNewNote && (
            <Button size="sm" startIcon={<PlusIcon />} onClick={onNewNote}>
              {newNoteLabel}
            </Button>
          )
        }
      />
      <DrawerBody>
        <div ref={contentRef} className={contentStyles}>
          {notes.length === 0 ? (
            <p className={emptyStyles}>{emptyLabel}</p>
          ) : (
            <ul className={listStyles}>
              {notes.map((note) => {
                const isCurrent = note.id === currentId;
                return (
                  <li
                    key={note.id}
                    className={rowStyles}
                    data-current={isCurrent ? "" : undefined}
                  >
                    <button
                      type="button"
                      ref={(element) => {
                        if (element) rows.current.set(note.id, element);
                        else rows.current.delete(note.id);
                        if (isCurrent) currentRef.current = element;
                      }}
                      className={rowButtonStyles}
                      aria-current={isCurrent ? "true" : undefined}
                      onClick={() => {
                        onSelect(note.id);
                        onClose();
                      }}
                    >
                      <span data-part="well" aria-hidden>
                        {typeIcons[note.type]}
                      </span>
                      <span data-part="label">{note.label}</span>
                    </button>
                    <IconButton
                      label={closeNoteLabel(note.label)}
                      onClick={() => closeNote(note.id)}
                    >
                      <XIcon />
                    </IconButton>
                  </li>
                );
              })}
            </ul>
          )}
          {onAllNotes && (
            <div className={footerStyles}>
              <button
                type="button"
                className={rowButtonStyles}
                onClick={() => {
                  onAllNotes();
                  onClose();
                }}
              >
                <span data-part="well" aria-hidden>
                  <FolderSimpleIcon />
                </span>
                <span data-part="label">{allNotesLabel}</span>
              </button>
            </div>
          )}
        </div>
      </DrawerBody>
    </Drawer>
  );
}
