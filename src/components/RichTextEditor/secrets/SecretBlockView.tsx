import { EditorContent } from "@tiptap/react";
import { MouseEvent, useEffect } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";

import { IconButton } from "ui/components/IconButton";
import { SecretCard } from "ui/game/SecretCard";
import { TrashIcon } from "ui/icons";
import { Box } from "ui/primitives";

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
      marginBlock="3"
      userSelect="none"
      onMouseDown={handleMouseDown}
      css={{
        "& .ProseMirror": {
          userSelect: "text",
          minHeight: "unset",
          padding: 0,
          margin: 0,
        },
      }}
    >
      <SecretCard
        label={label}
        action={
          onDelete && (
            <IconButton
              size="sm"
              label={t("notes.secrets.delete", "Delete secret")}
              onClick={() => onDelete(block.id)}
            >
              <TrashIcon />
            </IconButton>
          )
        }
        note={
          sharedOnlyWith === "you"
            ? t(
                "notes.secrets.shared-only-with-you",
                "Shared only with you so far. Players won't see this secret once it's shared.",
              )
            : sharedOnlyWith === "guides"
              ? t(
                  "notes.secrets.shared-only-with-guides",
                  "Shared only with Guides so far. Players won't see this secret once it's shared.",
                )
              : undefined
        }
      >
        <EditorContent editor={block.editor} />
      </SecretCard>
    </Box>,
    block.dom,
  );
}
