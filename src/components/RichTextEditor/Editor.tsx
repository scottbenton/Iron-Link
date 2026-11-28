import { EditorContent, Editor as TTEditor } from "@tiptap/react";
import { CSSProperties, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "ui/components/Button";
import { Box } from "ui/primitives";

import type {
  RichTextToolbarProps,
  SecretsToolbarState,
} from "./richTextToolbar";
import { ToolbarClearanceContext } from "./toolbarClearance";

// ProseMirror's default scroll margin, kept on the other three sides.
const DEFAULT_SCROLL_MARGIN = 5;

export interface EditorProps {
  outlined?: boolean;
  editable?: boolean;
  editor: TTEditor | null;
  // The editor the toolbar acts on, when it isn't `editor`: a secret block
  // holding the caret.
  toolbarEditor?: TTEditor | null;
  secrets?: SecretsToolbarState;
  Toolbar: React.FC<RichTextToolbarProps>;
  saving?: boolean;
  minHeight?: number;
  // Pad the text on both sides by the notes pane's gutter. Without it the
  // text only keeps room on the right, on wider screens.
  inset?: boolean;
  // Grow the text to fill the rest of a flex column, so the whole space below
  // the toolbar takes a click. minHeight is then the text's smallest height.
  fill?: boolean;
  // The text's name ("Note text"). With it, an editable editor gets a link
  // before the toolbar that skips straight to the text, so keyboard and screen
  // reader users need not step through every formatting button first. The
  // accessible name itself is set where the editor is created.
  label?: string;
}

// Hidden until focused, like Skip to Content.
const skipLinkStyles = {
  position: "absolute",
  zIndex: 1,
  margin: "2",
  "&:not(:focus-within)": {
    width: "1px",
    height: "1px",
    padding: 0,
    margin: "-1px",
    overflow: "hidden",
    clip: "rect(0, 0, 0, 0)",
    clipPath: "inset(50%)",
    whiteSpace: "nowrap",
    border: 0,
  },
} as const;

const savingStyles = {
  position: "absolute",
  top: "2",
  right: "2",
  zIndex: 1,
  paddingInline: "1.5",
  borderRadius: "sm",
  border: "1px solid token(colors.border.subtle)",
  background: "bg.surface",
  color: "fg.muted",
  fontSize: "xs",
  opacity: 0,
  transition:
    "opacity token(durations.normal) linear, visibility token(durations.normal) linear",
  "&[data-saving]": { opacity: 1 },
} as const;

// The text and everything in it. The editor's own options decide these
// attributes: data-outlined, data-editable, data-fill, data-inset and
// data-clearance (a phone toolbar covering the bottom of the window).
const textStyles = {
  flexGrow: 1,
  overflowY: "auto",
  "--editor-block-pad": "token(spacing.4)",
  "&[data-outlined]:not([data-editable])": { "--editor-block-pad": "0px" },
  "&[data-fill]": { display: "flex", flexDirection: "column" },
  "& > div": { height: "100%", overflowX: "hidden" },
  "&[data-fill] > div": {
    flexGrow: 1,
    display: "flex",
    flexDirection: "column",
  },
  "&[data-outlined] > div": {
    minHeight: "0",
    display: "flex",
    flexDirection: "column",
  },
  "&[data-outlined][data-editable] > div": {
    minHeight: "var(--editor-min-height)",
  },
  "& .ProseMirror": {
    minHeight: "100%",
    border: "1px solid transparent",
    wordBreak: "break-word",
    maxWidth: "100%",
    flexGrow: 1,
    paddingBlock: "var(--editor-block-pad)",
    paddingRight: { base: "0", md: "4" },
    // The text is the last thing in whatever scrolls it (this box, the
    // Notes tab or the window), so room under it lets its end scroll clear
    // of a phone toolbar. Without one, phones keep the extra room they
    // have always had.
    paddingBottom: { base: "12", md: "var(--editor-block-pad)" },
    _focus: { outline: "none" },
    "& > .is-empty::before": {
      content: "attr(data-placeholder)",
      float: "left",
      color: "fg.disabled",
      pointerEvents: "none",
      height: 0,
    },
    "& > :first-of-type": { marginTop: 0 },
    "& > *": { maxWidth: "65ch" },
    "& > p:last-child": { marginBottom: 0 },
  },
  "&[data-inset] .ProseMirror": { paddingInline: { base: "2", sm: "4" } },
  "&[data-clearance] .ProseMirror": {
    paddingBottom: "calc(var(--editor-block-pad) + var(--toolbar-clearance))",
  },
  "&:not([data-outlined]) .ProseMirror": { marginInline: "auto" },
  // Flex items shrink to their content around auto margins.
  "&[data-fill] .ProseMirror": { width: "100%", minHeight: "0" },
  "&[data-fill][data-editable] .ProseMirror": {
    minHeight: "var(--editor-min-height)",
  },
  "& blockquote": {
    borderLeft: "3px solid token(colors.border.default)",
    paddingLeft: "1",
    marginInline: "4",
  },
  "& hr": { color: "border.default" },
  // Tiptap draws it black, which disappears in dark mode.
  "& .ProseMirror-gapcursor:after": { borderTopColor: "currentColor" },
  "& p": { marginBottom: 0 },
  "& .collaboration-cursor__caret": {
    borderLeft: "1px solid #0d0d0d",
    borderRight: "1px solid #0d0d0d",
    marginLeft: "-1px",
    marginRight: "-1px",
    pointerEvents: "none",
    position: "relative",
    wordBreak: "normal",
  },
  // The name above the caret.
  "& .collaboration-cursor__label": {
    borderRadius: "sm",
    borderBottomLeftRadius: 0,
    color: "#000000aa",
    fontSize: "xs",
    left: "-1px",
    lineHeight: "normal",
    paddingInline: "1",
    paddingBlock: "0.5",
    position: "absolute",
    top: "-1.4em",
    userSelect: "none",
    whiteSpace: "nowrap",
  },
} as const;

function flag(value: unknown) {
  return value ? "" : undefined;
}

export function Editor(props: EditorProps) {
  const {
    outlined,
    editable,
    editor,
    toolbarEditor,
    secrets,
    Toolbar,
    saving,
    minHeight = 300,
    inset,
    fill,
    label,
  } = props;

  const { t } = useTranslation();

  const toolbar = editor && (
    <Toolbar editor={toolbarEditor ?? editor} secrets={secrets} />
  );

  // What a phone toolbar covers at the bottom of the window while it shows.
  // It reports a settled value, once per keyboard open or close.
  const [clearance, setClearance] = useState(0);
  // Scrolling the caret into view keeps it above the toolbar, in the note and
  // in a secret block holding the caret. Always set, even at 0: ProseMirror
  // merges new props over old ones, so a prop left out would keep the last
  // clearance.
  useEffect(() => {
    for (const target of [editor, toolbarEditor]) {
      if (!target || target.isDestroyed) continue;
      target.setOptions({
        editorProps: {
          ...target.options.editorProps,
          scrollThreshold: { top: 0, right: 0, left: 0, bottom: clearance },
          scrollMargin: {
            top: DEFAULT_SCROLL_MARGIN,
            right: DEFAULT_SCROLL_MARGIN,
            left: DEFAULT_SCROLL_MARGIN,
            bottom: clearance + DEFAULT_SCROLL_MARGIN,
          },
        },
      });
    }
    // New margins only apply to the next scroll, and the browser lifts the
    // caret above the keyboard but not above the toolbar, so scroll now.
    const caretEditor = toolbarEditor ?? editor;
    if (clearance > 0 && caretEditor?.isFocused && !caretEditor.isDestroyed) {
      caretEditor.commands.scrollIntoView();
    }
  }, [editor, toolbarEditor, clearance]);

  const skipToText = editor && label && editable && (
    <Box css={skipLinkStyles}>
      <Button variant="primary" onClick={() => editor.chain().focus().run()}>
        {t("notes.skip-to-text", "Skip to {{label}}", {
          label: label.toLocaleLowerCase(),
        })}
      </Button>
    </Box>
  );

  return (
    <ToolbarClearanceContext.Provider value={setClearance}>
      {!outlined && skipToText}
      {!outlined && toolbar}

      <Box
        display="flex"
        flexDirection="column"
        css={
          outlined
            ? {
                height: "100%",
                borderRadius: "md",
                border: editable
                  ? "1px solid token(colors.border.default)"
                  : "none",
              }
            : { flexGrow: 1, overflow: "hidden" }
        }
      >
        {outlined && skipToText}
        {outlined && toolbar}
        <Box position="relative">
          <Box
            data-saving={flag(saving)}
            css={savingStyles}
            // Inline, so it is hidden from screen readers while idle.
            style={{ visibility: saving ? "visible" : "hidden" }}
          >
            {t("common.saving", "Saving")}
          </Box>
        </Box>
        <Box
          data-outlined={flag(outlined)}
          data-editable={flag(editable)}
          data-fill={flag(fill)}
          data-inset={flag(inset)}
          data-clearance={flag(clearance > 0)}
          css={textStyles}
          style={
            {
              "--editor-min-height": `${minHeight}px`,
              "--toolbar-clearance": `${clearance}px`,
            } as CSSProperties
          }
        >
          <EditorContent editor={editor} />
        </Box>
      </Box>
    </ToolbarClearanceContext.Provider>
  );
}
