import BoldIcon from "@mui/icons-material/FormatBold";
import ItalicIcon from "@mui/icons-material/FormatItalic";
import BulletListIcon from "@mui/icons-material/FormatListBulleted";
import NumberedListIcon from "@mui/icons-material/FormatListNumbered";
import { Box, ToggleButton, ToggleButtonGroup, Tooltip } from "@mui/material";
import { Editor } from "@tiptap/react";
import { useTranslation } from "react-i18next";

// Basic formatting for a long text field. Notes keep their fuller toolbar,
// since images and headings belong to the entry's notes.
export function WorldEntryLongTextToolbar({ editor }: { editor: Editor }) {
  const { t } = useTranslation();
  if (!editor.isEditable) return null;

  const buttons = [
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
  ];

  return (
    <Box sx={{ p: 0.5, borderBottom: 1, borderColor: "divider" }}>
      <ToggleButtonGroup size="small">
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
    </Box>
  );
}
