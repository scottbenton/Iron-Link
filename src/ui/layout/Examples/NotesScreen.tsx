import {
  ArrowCounterClockwiseIcon,
  CheckIcon,
  DotsThreeIcon,
  FileTextIcon,
  ImageSquareIcon,
  LinkSimpleIcon,
  ListBulletsIcon,
  PlusIcon,
  ShareNetworkIcon,
  TextBIcon,
  TextItalicIcon,
} from "@phosphor-icons/react";
import { FocusEvent, useRef, useState } from "react";

import { Stack } from "ui/primitives";
import { focusRing } from "ui/styles/focus";

import { css } from "styled-system/css";

import { BreadcrumbItem, Breadcrumbs } from "../../components/Breadcrumbs";
import { Button } from "../../components/Button";
import { Text } from "../../components/Text";
import {
  Toolbar,
  ToolbarButton,
  ToolbarGroup,
  ToolbarSeparator,
} from "../../components/Toolbar";
import { OpenNotesBar, OpenNotesSheet } from "../../game/OpenNotes";
import type { OpenNote } from "../../game/OpenNotes";
import { ActionToolbar, ActionToolbarIconButton } from "../ActionToolbar";

/* ------------------------------------------------------------------------ */
/* Notes                                                                    */
/* ------------------------------------------------------------------------ */

const sampleOpenNotes: OpenNote[] = [
  { id: "session-4", label: "Session 4: The Drowned Archive", type: "note" },
  { id: "vows", label: "Kira's Vows", type: "note" },
  { id: "salvagers", label: "The Salvagers", type: "note" },
  { id: "bleakhold", label: "Bleakhold Station", type: "world" },
];

const playerNotes = [
  { id: "session-3", label: "Session 3: Salt and Static" },
  { id: "session-4", label: "Session 4: The Drowned Archive" },
  { id: "vows", label: "Kira's Vows" },
  { id: "salvagers", label: "The Salvagers" },
];

const allNotesTab: OpenNote = {
  id: "all-notes",
  label: "Kira Vale's Notes",
  type: "folder",
};

const noteStripStyles = css({ paddingInline: "4", paddingBlockStart: "3" });

const noteBodyStyles = css({
  display: "grid",
  gap: "3",
  paddingInline: "4",
  paddingBlockStart: "4",
  paddingBlockEnd: "var(--phone-page-foot, token(spacing.8))",
  "&[data-editing]": {
    // Clear of the toolbar and the keyboard while typing.
    paddingBlockEnd: "calc(var(--keyboard-height) + 72px)",
  },
});

const editorStyles = css({
  display: "grid",
  gap: "3",
  minHeight: "160px",
  borderRadius: "sm",
  outline: "none",
  fontFamily: "body",
  fontSize: "md",
  lineHeight: "relaxed",
  "& p": { margin: 0 },
  _focusVisible: focusRing.outset,
});

/**
 * The formatting bar rides on the keyboard: placed over the shell's foot,
 * raised by the keyboard's height. It sits in the page right after the
 * note's breadcrumbs, so it is read before the text.
 */
const formatBarStyles = css({
  position: "absolute",
  zIndex: "sticky",
  insetInline: 0,
  bottom: "var(--keyboard-height)",
  display: "flex",
  alignItems: "center",
  gap: "1",
  paddingInline: "2",
  paddingBlock: "1",
  borderTop: "1px solid token(colors.border.default)",
  background: "bg.surface",
  "& [data-part=tools]": {
    flex: "1 1 auto",
    minWidth: 0,
    overflowX: "auto",
    scrollbarWidth: "none",
    flexWrap: "nowrap",
  },
  // 44px targets: the bar is only ever on a phone.
  "& [data-part=tools] button": { minWidth: "touch", minHeight: "touch" },
});

/**
 * A stand-in for the on-screen keyboard, so the editing story shows where
 * the toolbar sits. Not part of the design.
 */
const keyboardStyles = css({
  position: "absolute",
  zIndex: "sticky",
  insetInline: 0,
  bottom: 0,
  height: "var(--keyboard-height)",
  display: "grid",
  placeItems: "center",
  background:
    "repeating-linear-gradient(45deg, token(colors.bg.emphasized) 0 8px, token(colors.bg.muted) 8px 16px)",
  borderTop: "1px solid token(colors.border.default)",
  color: "fg.muted",
  fontSize: "sm",
});

export function NotesScreen(props: {
  editing: boolean;
  onEditingChange: (editing: boolean) => void;
}) {
  const { editing, onEditingChange } = props;
  const [notes, setNotes] = useState(sampleOpenNotes);
  const [currentId, setCurrentId] = useState<string | null>("session-4");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [marks, setMarks] = useState<string[]>([]);
  const editorRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);

  const current = notes.find((note) => note.id === currentId) ?? null;

  // Editing lasts while focus is in the text or the bar.
  const handleBlur = (event: FocusEvent) => {
    const next = event.relatedTarget;
    if (
      next instanceof Node &&
      (editorRef.current?.contains(next) || barRef.current?.contains(next))
    ) {
      return;
    }
    onEditingChange(false);
  };
  const stopEditing = () => {
    onEditingChange(false);
    editorRef.current?.blur();
  };

  const toggleMark = (mark: string) =>
    setMarks((current) =>
      current.includes(mark)
        ? current.filter((item) => item !== mark)
        : [...current, mark],
    );

  const openNote = (id: string) => {
    const known = playerNotes.find((note) => note.id === id);
    if (known && !notes.some((note) => note.id === id)) {
      setNotes((current) => [...current, { ...known, type: "note" }]);
    }
    setCurrentId(id);
  };

  return (
    <>
      <OpenNotesBar
        title={current?.label ?? "Notes"}
        count={notes.length}
        listOpen={sheetOpen}
        onOpenList={() => setSheetOpen(true)}
      />
      <OpenNotesSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        notes={notes}
        currentId={currentId}
        onSelect={setCurrentId}
        onCloseNote={(id) => {
          const index = notes.findIndex((note) => note.id === id);
          const next = notes.filter((note) => note.id !== id);
          setNotes(next);
          if (id === currentId) {
            setCurrentId(next[Math.min(index, next.length - 1)]?.id ?? null);
          }
        }}
        onNewNote={() => setSheetOpen(false)}
        onAllNotes={() => {
          if (!notes.some((note) => note.id === allNotesTab.id)) {
            setNotes((existing) => [...existing, allNotesTab]);
          }
          setCurrentId(allNotesTab.id);
        }}
      />

      {current?.type === "folder" ? (
        <Stack gap="2" padding="4">
          <Text variant="h3" as="h3">
            {current.label}
          </Text>
          {playerNotes.map((note) => (
            <Button
              key={note.id}
              variant="ghost"
              startIcon={<FileTextIcon />}
              onClick={() => openNote(note.id)}
              className={css({ justifyContent: "flex-start" })}
            >
              {note.label}
            </Button>
          ))}
        </Stack>
      ) : current ? (
        <>
          <div className={noteStripStyles}>
            <ActionToolbar
              label="Note Actions"
              breadcrumbs={
                <Breadcrumbs>
                  <BreadcrumbItem href="#notes">Notes</BreadcrumbItem>
                  <BreadcrumbItem current>{current.label}</BreadcrumbItem>
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

          {editing && (
            <div
              ref={barRef}
              className={formatBarStyles}
              onBlur={handleBlur}
              // Pressing a button keeps the text, and the keyboard, focused.
              onMouseDown={(event) => {
                if ((event.target as HTMLElement).closest("button")) {
                  event.preventDefault();
                }
              }}
            >
              <Toolbar
                aria-label="Formatting"
                variant="plain"
                data-part="tools"
              >
                <ToolbarGroup aria-label="Text style">
                  <ToolbarButton
                    label="Bold"
                    icon={<TextBIcon />}
                    pressed={marks.includes("bold")}
                    onClick={() => toggleMark("bold")}
                  />
                  <ToolbarButton
                    label="Italic"
                    icon={<TextItalicIcon />}
                    pressed={marks.includes("italic")}
                    onClick={() => toggleMark("italic")}
                  />
                </ToolbarGroup>
                <ToolbarSeparator />
                <ToolbarGroup aria-label="Insert">
                  <ToolbarButton
                    label="Bulleted List"
                    icon={<ListBulletsIcon />}
                  />
                  <ToolbarButton label="Link" icon={<LinkSimpleIcon />} />
                  <ToolbarButton label="Image" icon={<ImageSquareIcon />} />
                  <ToolbarButton
                    label="Undo"
                    icon={<ArrowCounterClockwiseIcon />}
                  />
                </ToolbarGroup>
              </Toolbar>
              <Button
                variant="primary"
                size="sm"
                startIcon={<CheckIcon />}
                onClick={stopEditing}
                className={css({ flex: "none" })}
              >
                Done editing
              </Button>
            </div>
          )}

          <div
            className={noteBodyStyles}
            data-editing={editing ? "" : undefined}
          >
            <Text variant="h3" as="h3">
              {current.label}
            </Text>
            <div
              ref={editorRef}
              className={editorStyles}
              role="textbox"
              aria-multiline="true"
              aria-label={`${current.label} text`}
              contentEditable
              suppressContentEditableWarning
              onFocus={() => onEditingChange(true)}
              onBlur={handleBlur}
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  event.preventDefault();
                  stopEditing();
                }
              }}
            >
              <p>
                Kira and Orrin reached the archive at low tide. The lower stacks
                were already under water, and something had dragged the shelves
                into a barricade across the reading room.
              </p>
              <p>
                Orrin swore an iron vow to recover the starchart before the next
                flood. Kira is less sure it is still there: the salvager they
                met at the dock was carrying a tube of the same stamped leather.
              </p>
              <p>
                Open threads: who hired the salvager, why the archive keepers
                left, and what is moving under the water in the east wing.
              </p>
            </div>
          </div>

          {editing && (
            <div className={keyboardStyles} aria-hidden>
              On-screen keyboard
            </div>
          )}
        </>
      ) : (
        <Stack alignItems="center" gap="3" padding="8">
          <Text color="muted">No notes open.</Text>
          <Button startIcon={<PlusIcon />} onClick={() => setSheetOpen(true)}>
            Open a note
          </Button>
        </Stack>
      )}
    </>
  );
}
