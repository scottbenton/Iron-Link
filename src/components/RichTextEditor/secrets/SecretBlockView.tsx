import DeleteIcon from "@mui/icons-material/DeleteOutline";
import LockIcon from "@mui/icons-material/LockOutlined";
import { Box, IconButton, Tooltip, Typography } from "@mui/material";
import { EditorContent } from "@tiptap/react";
import { useEffect } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";

import { SecretBlockView as SecretBlock } from "./secretsController";

export interface SecretBlockViewProps {
  block: SecretBlock;
  onMounted: (id: string) => void;
  onDelete: (id: string) => void;
}

// One secret block, drawn into its widget in the Guide's shared editor: a
// dashed inset labelled Secret, holding the block's own editor.
export function SecretBlockView(props: SecretBlockViewProps) {
  const { block, onMounted, onDelete } = props;
  const { t } = useTranslation();

  useEffect(() => {
    onMounted(block.id);
  }, [block.id, onMounted]);

  const label = t("notes.secrets.label", "Secret");

  return createPortal(
    <Box
      component="section"
      aria-label={label}
      sx={(theme) => ({
        my: 1.5,
        borderWidth: 1,
        borderStyle: "dashed",
        borderColor: theme.palette.text.secondary,
        borderRadius: `${theme.shape.borderRadius}px`,
        bgcolor: theme.palette.action.hover,
        ".ProseMirror": {
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
        color="text.secondary"
      >
        <LockIcon fontSize="inherit" />
        <Typography
          variant="overline"
          component="span"
          lineHeight={1.5}
          flexGrow={1}
        >
          {label}
        </Typography>
        <Tooltip title={t("notes.secrets.delete", "Delete secret")}>
          <IconButton
            size="small"
            aria-label={t("notes.secrets.delete", "Delete secret")}
            onClick={() => onDelete(block.id)}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
      <EditorContent editor={block.editor} />
    </Box>,
    block.dom,
  );
}
