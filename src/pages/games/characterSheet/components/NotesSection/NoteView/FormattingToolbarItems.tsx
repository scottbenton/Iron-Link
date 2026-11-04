import BoldIcon from "@mui/icons-material/FormatBold";
import OutdentIcon from "@mui/icons-material/FormatIndentDecrease";
import IndentIcon from "@mui/icons-material/FormatIndentIncrease";
import ItalicIcon from "@mui/icons-material/FormatItalic";
import BulletListIcon from "@mui/icons-material/FormatListBulleted";
import NumberedListIcon from "@mui/icons-material/FormatListNumbered";
import QuoteIcon from "@mui/icons-material/FormatQuote";
import StrikeThroughIcon from "@mui/icons-material/FormatStrikethrough";
import HorizontalRuleIcon from "@mui/icons-material/HorizontalRule";
import { Box, ToggleButton, ToggleButtonGroup, Tooltip } from "@mui/material";
import { Editor } from "@tiptap/react";
import { useTranslation } from "react-i18next";

export interface FormattingToolbarItemsProps {
  editor: Editor;
  hideBorders?: boolean;
}

// The text formatting groups of the Notes toolbar, shared with any editor
// that should look like Notes.
export function FormattingToolbarItems(props: FormattingToolbarItemsProps) {
  const { editor, hideBorders } = props;

  const { t } = useTranslation();
  const indentLabel = t("note.editor-toolbar.indent", "Indent");
  const outdentLabel = t("note.editor-toolbar.outdent", "Outdent");

  // A disabled button draws its own border unless told not to.
  const sx = hideBorders
    ? {
        border: "none",
        "&.Mui-disabled": { border: "none" },
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
        {/* Tab and Shift-Tab do this too, but a phone keyboard has no Tab.
            The toolbar re-renders on every transaction, so these follow the
            caret. A disabled button takes no hover, so its tooltip sits on a
            wrapper. */}
        <Tooltip title={indentLabel} enterDelay={300}>
          <Box component="span" display="flex">
            <ToggleButton
              size={"small"}
              value={"indent"}
              aria-label={indentLabel}
              onClick={() =>
                editor.chain().focus().sinkListItem("listItem").run()
              }
              disabled={!editor.can().sinkListItem("listItem")}
              sx={sx}
            >
              <IndentIcon />
            </ToggleButton>
          </Box>
        </Tooltip>
        <Tooltip title={outdentLabel} enterDelay={300}>
          <Box component="span" display="flex">
            <ToggleButton
              size={"small"}
              value={"outdent"}
              aria-label={outdentLabel}
              onClick={() =>
                editor.chain().focus().liftListItem("listItem").run()
              }
              disabled={!editor.can().liftListItem("listItem")}
              sx={sx}
            >
              <OutdentIcon />
            </ToggleButton>
          </Box>
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
            selected={editor.isActive("blockquote")}
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            sx={sx}
          >
            <QuoteIcon />
          </ToggleButton>
        </Tooltip>
      </ToggleButtonGroup>
    </>
  );
}
