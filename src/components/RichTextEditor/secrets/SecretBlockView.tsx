import DeleteIcon from "@mui/icons-material/DeleteOutline";
import LockIcon from "@mui/icons-material/Lock";
import { Box, IconButton, Tooltip, Typography } from "@mui/material";
import { EditorContent } from "@tiptap/react";
import { MouseEvent, useEffect } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";

import { SecretBlockView as SecretBlock } from "./secretsController";
import type { SecretsAudience } from "./useSecretsCompanion";

export interface SecretBlockViewProps {
  block: SecretBlock;
  // Who can read the surface while players can't; null once they can.
  sharedOnlyWith: SecretsAudience | null;
  onMounted: (id: string) => void;
  // Left out where the Guide may not edit the surface.
  onDelete?: (id: string) => void;
}

// One secret block, drawn into its widget in the Guide's shared editor: a
// dashed inset labelled Secret, holding the block's own editor. While the
// note isn't shared with players yet, it says so, since the secret then
// looks no different from the rest of the note.
export function SecretBlockView(props: SecretBlockViewProps) {
  const { block, sharedOnlyWith, onMounted, onDelete } = props;
  const { t } = useTranslation();

  useEffect(() => {
    onMounted(block.id);
  }, [block.id, onMounted]);

  const label = t("notes.secrets.label", "Secret");

  // The label and note are not text to edit: a press on them goes to the
  // block's own text instead of putting a caret beside them.
  const handleMouseDown = (event: MouseEvent) => {
    const target = event.target as Node;
    if (
      block.editor.view.dom.contains(target) ||
      (target instanceof Element && target.closest("button"))
    ) {
      return;
    }
    event.preventDefault();
    if (block.editor.isEditable) block.editor.commands.focus("start");
  };

  return createPortal(
    <Box
      component="section"
      aria-label={label}
      onMouseDown={handleMouseDown}
      sx={(theme) => ({
        my: 1.5,
        borderWidth: 1,
        borderStyle: "dashed",
        borderColor: theme.palette.text.secondary,
        borderRadius: `${theme.shape.borderRadius}px`,
        bgcolor: theme.palette.action.hover,
        userSelect: "none",
        ".ProseMirror": {
          userSelect: "text",
          minHeight: "unset",
          px: 1.5,
          py: 1,
          mx: 0,
        },
      })}
    >
      <Box
        display="flex"
        alignItems="center"
        gap={0.5}
        pl={1.5}
        pr={0.5}
        pt={0.5}
        minHeight={34}
        color="text.secondary"
      >
        <LockIcon fontSize="inherit" />
        <Typography
          variant="overline"
          component="span"
          lineHeight={1.5}
          whiteSpace="nowrap"
          flexGrow={1}
        >
          {label}
        </Typography>
        {onDelete && (
          <Tooltip title={t("notes.secrets.delete", "Delete secret")}>
            <IconButton
              size="small"
              aria-label={t("notes.secrets.delete", "Delete secret")}
              onClick={() => onDelete(block.id)}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Box>
      {sharedOnlyWith && (
        <Typography
          variant="caption"
          component="p"
          color="text.secondary"
          px={1.5}
        >
          {sharedOnlyWith === "you"
            ? t(
                "notes.secrets.shared-only-with-you",
                "Shared only with you so far. Players won't see this secret once it's shared.",
              )
            : t(
                "notes.secrets.shared-only-with-guides",
                "Shared only with Guides so far. Players won't see this secret once it's shared.",
              )}
        </Typography>
      )}
      <EditorContent editor={block.editor} />
    </Box>,
    block.dom,
  );
}
