import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import { Box, IconButton, Stack, Tooltip } from "@mui/material";
import type { PropsWithChildren } from "react";
import { useTranslation } from "react-i18next";

export function WorldSortableFieldRule({
  id,
  index,
  readOnly,
  disabled,
  onRemove,
  children,
}: PropsWithChildren<{
  id: string;
  index: number;
  readOnly: boolean;
  disabled: boolean;
  onRemove: () => void;
}>) {
  const { t } = useTranslation();
  const {
    setNodeRef,
    setActivatorNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled });
  const label = t("worlds.fields.reorder-rule", "Reorder rule {{number}}", {
    number: index + 1,
  });
  const removeLabel = t(
    "worlds.fields.remove-rule-named",
    "Remove rule {{number}}",
    {
      number: index + 1,
    },
  );
  return (
    <Stack
      ref={setNodeRef}
      direction="row"
      alignItems="flex-start"
      spacing={0.5}
      role="group"
      aria-label={t("worlds.fields.rule-number", "Rule {{number}}", {
        number: index + 1,
      })}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      sx={{ position: "relative", zIndex: isDragging ? 1 : undefined }}
    >
      {!readOnly && (
        <IconButton
          ref={setActivatorNodeRef}
          {...attributes}
          {...listeners}
          size="small"
          aria-label={label}
          title={label}
          disabled={disabled}
          sx={{ cursor: "grab", touchAction: "none", mt: 1.25 }}
        >
          <DragIndicatorIcon fontSize="small" />
        </IconButton>
      )}
      <Box sx={{ flex: 1, minWidth: 0 }}>{children}</Box>
      {!readOnly && (
        <Tooltip title={removeLabel}>
          <span>
            <IconButton
              size="small"
              aria-label={removeLabel}
              disabled={disabled}
              onClick={onRemove}
              sx={{ mt: 1.25 }}
            >
              <DeleteOutlineIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
      )}
    </Stack>
  );
}
