import BoldIcon from "@mui/icons-material/FormatBold";
import ItalicIcon from "@mui/icons-material/FormatItalic";
import BulletListIcon from "@mui/icons-material/FormatListBulleted";
import NumberedListIcon from "@mui/icons-material/FormatListNumbered";
import QuoteIcon from "@mui/icons-material/FormatQuote";
import StrikeThroughIcon from "@mui/icons-material/FormatStrikethrough";
import HorizontalRuleIcon from "@mui/icons-material/HorizontalRule";
import { Box, ToggleButton, ToggleButtonGroup, Tooltip } from "@mui/material";
import { Editor } from "@tiptap/react";
import { useTranslation } from "react-i18next";

import { NoteToolbarActionsMenu } from "./NoteToolbarActionsMenu";
import { UploadImageButton } from "./UploadImageButton";
import { NotePermissions } from "./useNotePermission";

export interface CommonToolbarItemsProps {
  editor: Editor;
  openNoteId: string;
  permissions: NotePermissions;
  hideBorders?: boolean;
}

export function CommonToolbarItems(props: CommonToolbarItemsProps) {
  const { editor, openNoteId, permissions, hideBorders } = props;

  const { t } = useTranslation();

  const sx = hideBorders
    ? {
        border: "none",
      }
    : {};

  return (
    <>
      <ToggleButtonGroup>
        <Tooltip title={t("note.editor-toolbar.bold", "Bold")} enterDelay={300}>
          <ToggleButton
            size={"small"}
            value={"bold"}
            onClick={() => editor.chain().focus().toggleBold().run()}
            selected={editor.isActive("bold")}
            sx={sx}
          >
            <BoldIcon />
          </ToggleButton>
        </Tooltip>

        <Tooltip
          title={t("note.editor-toolbar.italic", "Italic")}
          enterDelay={300}
        >
          <ToggleButton
            size={"small"}
            value={"italic"}
            onClick={() => editor.chain().focus().toggleItalic().run()}
            selected={editor.isActive("italic")}
            sx={sx}
          >
            <ItalicIcon />
          </ToggleButton>
        </Tooltip>

        <Tooltip
          title={t("note.editor-toolbar.strikethrough", "Strikethrough")}
          enterDelay={300}
        >
          <ToggleButton
            size={"small"}
            value={"strikethrough"}
            onClick={() => editor.chain().focus().toggleStrike().run()}
            selected={editor.isActive("strike")}
            sx={sx}
          >
            <StrikeThroughIcon />
          </ToggleButton>
        </Tooltip>
      </ToggleButtonGroup>
      <ToggleButtonGroup>
        <Tooltip
          title={t("note.editor-toolbar.bulleted-list", "Bulleted List")}
          enterDelay={300}
        >
          <ToggleButton
            size={"small"}
            value={"bullet list"}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            selected={editor.isActive("bulletList")}
            sx={sx}
          >
            <BulletListIcon />
          </ToggleButton>
        </Tooltip>
        <Tooltip
          title={t("note.editor-toolbar.numbered-list", "Numbered List")}
          enterDelay={300}
        >
          <ToggleButton
            size={"small"}
            value={"number list"}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            selected={editor.isActive("orderedList")}
            sx={sx}
          >
            <NumberedListIcon />
          </ToggleButton>
        </Tooltip>
        <Tooltip
          title={t("note.editor-toolbar.horizontal-line", "Horizontal Line")}
          enterDelay={300}
        >
          <ToggleButton
            size={"small"}
            value={"horizontal rule"}
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            sx={sx}
          >
            <HorizontalRuleIcon />
          </ToggleButton>
        </Tooltip>
        <Tooltip
          title={t("note.editor-toolbar.quote", "Quote")}
          enterDelay={300}
        >
          <ToggleButton
            size={"small"}
            value={"quote"}
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            sx={sx}
          >
            <QuoteIcon />
          </ToggleButton>
        </Tooltip>
      </ToggleButtonGroup>
      <UploadImageButton noteId={openNoteId} editor={editor} />{" "}
      <Box
        flexGrow={1}
        display="flex"
        justifyContent={"flex-end"}
        alignItems="center"
      >
        <NoteToolbarActionsMenu
          openNoteId={openNoteId}
          permissions={permissions}
        />
      </Box>
    </>
  );
}
