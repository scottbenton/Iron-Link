import type { Editor } from "@tiptap/react";
import { useTranslation } from "react-i18next";

import {
  ToolbarButton,
  ToolbarGroup,
  ToolbarSeparator,
} from "ui/components/Toolbar";
import {
  ListBulletsIcon,
  ListNumbersIcon,
  MinusIcon,
  QuotesIcon,
  TextBIcon,
  TextIndentIcon,
  TextItalicIcon,
  TextOutdentIcon,
  TextStrikethroughIcon,
} from "ui/icons";

export interface FormattingControlsProps {
  editor: Editor;
}

/**
 * The text style and block controls of an editor's toolbar, for any
 * toolbar that should work like the Notes one. They render no toolbar of
 * their own, so they join whichever one holds them.
 */
export function FormattingControls(props: FormattingControlsProps) {
  const { editor } = props;
  const { t } = useTranslation();

  // The toolbar re-renders on every transaction, so these follow the caret.
  return (
    <>
      <ToolbarGroup
        aria-label={t("note.editor-toolbar.text-style", "Text style")}
      >
        <ToolbarButton
          label={t("note.editor-toolbar.bold", "Bold")}
          icon={<TextBIcon />}
          pressed={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
        />
        <ToolbarButton
          label={t("note.editor-toolbar.italic", "Italic")}
          icon={<TextItalicIcon />}
          pressed={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        />
        <ToolbarButton
          label={t("note.editor-toolbar.strikethrough", "Strikethrough")}
          icon={<TextStrikethroughIcon />}
          pressed={editor.isActive("strike")}
          onClick={() => editor.chain().focus().toggleStrike().run()}
        />
      </ToolbarGroup>
      <ToolbarSeparator />
      <ToolbarGroup aria-label={t("note.editor-toolbar.blocks", "Blocks")}>
        <ToolbarButton
          label={t("note.editor-toolbar.bulleted-list", "Bulleted List")}
          icon={<ListBulletsIcon />}
          pressed={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        />
        <ToolbarButton
          label={t("note.editor-toolbar.numbered-list", "Numbered List")}
          icon={<ListNumbersIcon />}
          pressed={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        />
        {/* Tab and Shift+Tab do this too, but a phone keyboard has no Tab. */}
        <ToolbarButton
          label={t("note.editor-toolbar.outdent", "Outdent")}
          icon={<TextOutdentIcon />}
          disabled={!editor.can().liftListItem("listItem")}
          onClick={() => editor.chain().focus().liftListItem("listItem").run()}
        />
        <ToolbarButton
          label={t("note.editor-toolbar.indent", "Indent")}
          icon={<TextIndentIcon />}
          disabled={!editor.can().sinkListItem("listItem")}
          onClick={() => editor.chain().focus().sinkListItem("listItem").run()}
        />
        <ToolbarButton
          label={t("note.editor-toolbar.horizontal-line", "Horizontal Line")}
          icon={<MinusIcon />}
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
        />
        <ToolbarButton
          label={t("note.editor-toolbar.quote", "Quote")}
          icon={<QuotesIcon />}
          pressed={editor.isActive("blockquote")}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        />
      </ToolbarGroup>
    </>
  );
}
