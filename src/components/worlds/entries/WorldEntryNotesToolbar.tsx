import AddPhotoIcon from "@mui/icons-material/AddPhotoAlternate";
import BoldIcon from "@mui/icons-material/FormatBold";
import ItalicIcon from "@mui/icons-material/FormatItalic";
import BulletListIcon from "@mui/icons-material/FormatListBulleted";
import NumberedListIcon from "@mui/icons-material/FormatListNumbered";
import QuoteIcon from "@mui/icons-material/FormatQuote";
import StrikeThroughIcon from "@mui/icons-material/FormatStrikethrough";
import TitleIcon from "@mui/icons-material/Title";
import {
  Box,
  IconButton,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
} from "@mui/material";
import { Editor } from "@tiptap/react";
import { ChangeEvent, useRef } from "react";
import { useTranslation } from "react-i18next";

import { useWorldEntriesStore } from "stores/worldEntries.store";

import {
  MAX_FILE_SIZE,
  MAX_FILE_SIZE_LABEL,
} from "repositories/storage.repository";

import { IWorldEntry } from "services/worldEntries.service";

// Formatting for an entry's Notes, and images stored with the entry so they
// are removed with it. Readers see no toolbar.
export function WorldEntryNotesToolbar({
  editor,
  entry,
  onError,
}: {
  editor: Editor;
  entry: Pick<IWorldEntry, "id" | "worldId">;
  onError: (cause: unknown) => void;
}) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const uploadEntryImage = useWorldEntriesStore(
    (store) => store.uploadEntryImage,
  );
  if (!editor.isEditable) return null;

  const groups = [
    [
      {
        value: "heading",
        label: t("worlds.entries.notes-heading", "Heading"),
        Icon: TitleIcon,
        active: editor.isActive("heading", { level: 2 }),
        toggle: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
      },
    ],
    [
      {
        value: "bold",
        label: t("note.editor-toolbar.bold", "Bold"),
        Icon: BoldIcon,
        active: editor.isActive("bold"),
        toggle: () => editor.chain().focus().toggleBold().run(),
      },
      {
        value: "italic",
        label: t("note.editor-toolbar.italic", "Italic"),
        Icon: ItalicIcon,
        active: editor.isActive("italic"),
        toggle: () => editor.chain().focus().toggleItalic().run(),
      },
      {
        value: "strikethrough",
        label: t("note.editor-toolbar.strikethrough", "Strikethrough"),
        Icon: StrikeThroughIcon,
        active: editor.isActive("strike"),
        toggle: () => editor.chain().focus().toggleStrike().run(),
      },
    ],
    [
      {
        value: "bullet list",
        label: t("note.editor-toolbar.bulleted-list", "Bulleted List"),
        Icon: BulletListIcon,
        active: editor.isActive("bulletList"),
        toggle: () => editor.chain().focus().toggleBulletList().run(),
      },
      {
        value: "number list",
        label: t("note.editor-toolbar.numbered-list", "Numbered List"),
        Icon: NumberedListIcon,
        active: editor.isActive("orderedList"),
        toggle: () => editor.chain().focus().toggleOrderedList().run(),
      },
      {
        value: "quote",
        label: t("note.editor-toolbar.quote", "Quote"),
        Icon: QuoteIcon,
        active: editor.isActive("blockquote"),
        toggle: () => editor.chain().focus().toggleBlockquote().run(),
      },
    ],
  ];

  const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (!file) return;
    if (file.size > MAX_FILE_SIZE) {
      onError(
        new Error(
          t(
            "worlds.entries.image-too-large",
            "That image is too large. The largest image you can upload is {{size}}.",
            { size: MAX_FILE_SIZE_LABEL },
          ),
        ),
      );
      return;
    }
    const { url } = await uploadEntryImage(entry.worldId, entry.id, file);
    editor.chain().focus().setImage({ src: url }).run();
  };

  const imageLabel = t("note.editor-toolbar.upload-image", "Upload Image");
  return (
    <Box
      sx={{
        p: 0.5,
        borderBottom: 1,
        borderColor: "divider",
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: 0.5,
      }}
    >
      {groups.map((buttons) => (
        <ToggleButtonGroup key={buttons[0].value} size="small">
          {buttons.map(({ value, label, Icon, active, toggle }) => (
            <Tooltip key={value} title={label} enterDelay={300}>
              <ToggleButton
                value={value}
                aria-label={label}
                selected={active}
                onClick={toggle}
                sx={{ border: "none" }}
              >
                <Icon fontSize="small" />
              </ToggleButton>
            </Tooltip>
          ))}
        </ToggleButtonGroup>
      ))}
      <Tooltip title={imageLabel} enterDelay={300}>
        <IconButton
          size="small"
          aria-label={imageLabel}
          onClick={() => inputRef.current?.click()}
        >
          <AddPhotoIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <input
        ref={inputRef}
        hidden
        type="file"
        accept="image/png,image/jpeg,image/gif,image/webp"
        onChange={(event) => {
          handleFile(event).catch(onError);
        }}
      />
    </Box>
  );
}
