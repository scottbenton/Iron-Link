import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import { Box, IconButton, Stack, Tooltip } from "@mui/material";
import type { PropsWithChildren } from "react";
import { useTranslation } from "react-i18next";

export function WorldSortableFieldRule({
  id,
  index,
  readOnly,
  disabled,
  children,
}: PropsWithChildren<{
  id: string;
  index: number;
  readOnly: boolean;
  disabled: boolean;
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
  return (
    <Stack
      ref={setNodeRef}
      direction="row"
      alignItems="flex-start"
      role="group"
      aria-label={t("worlds.fields.rule-number", "Rule {{number}}", {
        number: index + 1,
      })}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      sx={{ position: "relative", zIndex: isDragging ? 1 : undefined }}
    >
      {!readOnly && (
        <Tooltip title={label}>
          <span>
            <IconButton
              ref={setActivatorNodeRef}
              {...attributes}
              {...listeners}
              aria-label={label}
              disabled={disabled}
              sx={{ cursor: "grab", touchAction: "none", mt: 0.5 }}
            >
              <DragIndicatorIcon />
            </IconButton>
          </span>
        </Tooltip>
      )}
      <Box sx={{ flex: 1, minWidth: 0 }}>{children}</Box>
    </Stack>
  );
}
