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
import { TextTypeDropdown } from "./TextTypeDropdown";
import { UploadImageButton } from "./UploadImageButton";
import { NotePermissions } from "./useNotePermission";

export interface NoteToolbarContentProps {
  openNoteId: string;
  editor: Editor;
  permissions: NotePermissions;
}

export function NoteViewToolbar(props: NoteToolbarContentProps) {
  const { openNoteId, editor, permissions } = props;

  const { t } = useTranslation();

  return (
    <Box display={"flex"} alignItems={"center"} flexGrow={1}>
      <TextTypeDropdown editor={editor} />
      <ToggleButtonGroup sx={{ mr: 1 }}>
        <Tooltip title={t("note.editor-toolbar.bold", "Bold")} enterDelay={300}>
          <ToggleButton
            size={"small"}
            value={"bold"}
            onClick={() => editor.chain().focus().toggleBold().run()}
            selected={editor.isActive("bold")}
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
          >
            <StrikeThroughIcon />
          </ToggleButton>
        </Tooltip>
      </ToggleButtonGroup>
      <ToggleButtonGroup sx={{ mr: 1 }}>
        <Tooltip
          title={t("note.editor-toolbar.bulleted-list", "Bulleted List")}
          enterDelay={300}
        >
          <ToggleButton
            size={"small"}
            value={"bullet list"}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            selected={editor.isActive("bulletList")}
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
          >
            <QuoteIcon />
          </ToggleButton>
        </Tooltip>
      </ToggleButtonGroup>
      <UploadImageButton noteId={openNoteId} editor={editor} />
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
    </Box>
  );
}
