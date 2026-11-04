import { Box, Button, Fade } from "@mui/material";
import type { ResponsiveStyleValue } from "@mui/system";
import { EditorContent, Editor as TTEditor } from "@tiptap/react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { useIsMobile } from "hooks/useIsMobile";

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
  // Side padding for the text. Without it the text only keeps room on the
  // right.
  contentPx?: ResponsiveStyleValue<number>;
  // Grow the text to fill the rest of a flex column, so the whole space below
  // the toolbar takes a click. minHeight is then the text's smallest height.
  fill?: boolean;
  // Names the editable text for screen readers ("Note text"). With it, an
  // editable editor also gets a link before the toolbar that skips straight to
  // the text, so keyboard and screen reader users need not step through every
  // formatting button first.
  label?: string;
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
    contentPx,
    fill,
    label,
  } = props;

  const { t } = useTranslation();

  const isMobile = useIsMobile();
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

  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    const { attributes } = editor.options.editorProps;
    const otherAttributes: Record<string, string> = {
      ...(typeof attributes === "object" ? attributes : {}),
    };
    delete otherAttributes.role;
    delete otherAttributes["aria-multiline"];
    delete otherAttributes["aria-label"];
    editor.setOptions({
      editorProps: {
        ...editor.options.editorProps,
        attributes:
          label && editable
            ? {
                ...otherAttributes,
                role: "textbox",
                "aria-multiline": "true",
                "aria-label": label,
              }
            : otherAttributes,
      },
    });
  }, [editor, label, editable]);

  const skipToText = editor && label && editable && (
    <Button
      variant={"contained"}
      onClick={() => editor.chain().focus().run()}
      sx={{
        position: "absolute",
        zIndex: 1,
        m: 1,
        // Hidden until focused, like Skip to Content.
        "&:not(:focus)": {
          width: "1px",
          height: "1px",
          p: 0,
          m: "-1px",
          overflow: "hidden",
          clip: "rect(0, 0, 0, 0)",
          clipPath: "inset(50%)",
          whiteSpace: "nowrap",
          border: 0,
        },
      }}
    >
      {t("notes.skip-to-text", "Skip to {{label}}", {
        label: label.toLocaleLowerCase(),
      })}
    </Button>
  );

  return (
    <ToolbarClearanceContext.Provider value={setClearance}>
      {!outlined && skipToText}
      {!outlined && toolbar}

      <Box
        sx={(theme) =>
          outlined
            ? {
                height: "100%",
                display: "flex",
                flexDirection: "column",
                borderWidth: editable ? 1 : 0,
                borderStyle: "solid",
                borderColor: theme.palette.divider,
                borderRadius: `${theme.shape.borderRadius}px`,
              }
            : {
                flexGrow: 1,
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
              }
        }
      >
        {outlined && skipToText}
        {outlined && toolbar}
        <Box position={"relative"}>
          <Fade in={saving}>
            <Box
              position={"absolute"}
              top={(theme) => theme.spacing(1)}
              right={(theme) => theme.spacing(1)}
              bgcolor={(theme) => theme.palette.grey[600]}
              color={"white"}
              borderRadius={(theme) => `${theme.shape.borderRadius}px`}
              px={0.5}
            >
              Saving...
            </Box>
          </Fade>
        </Box>
        <Box
          flexGrow={1}
          sx={(theme) => ({
            overflowY: "auto",
            ...(fill ? { display: "flex", flexDirection: "column" } : {}),
            ">div": {
              height: "100%",
              overflowX: "hidden",
              ...(fill
                ? { flexGrow: 1, display: "flex", flexDirection: "column" }
                : {}),
              ...(outlined
                ? {
                    minHeight: editable ? `${minHeight}px` : 0,
                    display: "flex",
                    flexDirection: "column",
                  }
                : {}),
            },
            ".ProseMirror": {
              minHeight: "100%",
              borderWidth: 1,
              borderStyle: "solid",
              borderColor: "transparent",
              wordBreak: "break-word",
              maxWidth: "100%",
              flexGrow: 1,

              py: editable || !outlined ? 2 : 0,
              ...(contentPx !== undefined
                ? { px: contentPx }
                : { pr: isMobile ? 0 : 2 }),
              // The text is the last thing in whatever scrolls it (this box,
              // the Notes tab or the window), so room under it lets its end
              // scroll clear of a phone toolbar. Without one, phones keep the
              // extra room they have always had.
              pb:
                clearance > 0
                  ? `calc(${theme.spacing(editable || !outlined ? 2 : 0)} + ${clearance}px)`
                  : isMobile
                    ? 6
                    : undefined,

              mx: !outlined ? "auto" : undefined,
              // Flex items shrink to their content around auto margins.
              ...(fill
                ? { width: "100%", minHeight: editable ? minHeight : 0 }
                : {}),

              "&:focus": {
                outline: "none",
              },
              "&>.is-empty::before": {
                content: "attr(data-placeholder)",
                float: "left",
                color: theme.palette.action.disabled,
                pointerEvents: "none",
                height: 0,
              },
              "&.ProseMirror>:first-of-type": {
                marginTop: 0,
              },
              "& > *": {
                maxWidth: "65ch",
              },
              "&.ProseMirror>p:last-child": {
                marginBottom: 0,
              },
            },
            blockquote: {
              borderLeft: `3px solid ${theme.palette.divider}`,
              paddingLeft: 0.5,
              marginX: 2,
            },
            hr: {
              color: theme.palette.divider,
            },
            // Tiptap draws it black, which disappears in dark mode.
            ".ProseMirror-gapcursor:after": {
              borderTopColor: "currentColor",
            },
            p: {
              marginBottom: 0,
            },
            ".collaboration-cursor__caret": {
              borderLeft: "1px solid #0d0d0d",
              borderRight: "1px solid #0d0d0d",
              marginLeft: "-1px",
              marginRight: "-1px",
              pointerEvents: "none",
              position: "relative",
              wordBreak: "normal",
            },

            /* Render the username above the caret */
            ".collaboration-cursor__label": {
              borderRadius: `${theme.shape.borderRadius}px`,
              borderBottomLeftRadius: 0,
              color: "#000000aa",
              ...theme.typography.caption,
              left: "-1px",
              lineHeight: "normal",
              px: 0.5,
              py: 0.25,
              position: "absolute",
              top: "-1.4em",
              userSelect: "none",
              whiteSpace: "nowrap",
            },
          })}
        >
          <EditorContent editor={editor} />
        </Box>
      </Box>
    </ToolbarClearanceContext.Provider>
  );
}
