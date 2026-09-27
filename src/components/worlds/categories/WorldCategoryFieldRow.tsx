import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import {
  Box,
  Chip,
  IconButton,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import { useTranslation } from "react-i18next";

import { IWorldFieldDefinition } from "services/worldFieldDefinitions.service";

import { FIELD_TYPE_LABELS } from "./categoryEditor.utils";

export function WorldCategoryFieldRow({
  field,
  label,
  subtitle,
  canEdit,
  canDelete,
  disabled,
  busy,
  onEdit,
  onDelete,
}: {
  field: IWorldFieldDefinition;
  label: string;
  subtitle: boolean;
  canEdit: boolean;
  canDelete: boolean;
  disabled: boolean;
  busy: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { t } = useTranslation();
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id, disabled: !canEdit || disabled });
  const editLabel = canEdit
    ? t("worlds.fields.edit-label", "Edit {{label}}", { label })
    : t("worlds.fields.view-label", "Configure {{label}}", { label });
  const deleteLabel = t("worlds.fields.delete-label", "Delete {{label}}", {
    label,
  });
  const dragLabel = t("worlds.fields.reorder-label", "Reorder {{label}}", {
    label,
  });
  return (
    <Paper
      ref={setNodeRef}
      role="group"
      aria-label={`${label} field`}
      variant="outlined"
      style={{ transform: CSS.Transform.toString(transform), transition }}
      sx={{
        p: 1.5,
        position: "relative",
        zIndex: isDragging ? 1 : undefined,
        opacity: isDragging ? 0.7 : 1,
      }}
    >
      <Stack direction="row" alignItems="center" gap={1}>
        {canEdit && (
          <Tooltip title={dragLabel}>
            <span>
              <IconButton
                ref={setActivatorNodeRef}
                {...attributes}
                {...listeners}
                aria-label={dragLabel}
                disabled={disabled}
                sx={{ cursor: "grab", touchAction: "none" }}
              >
                <DragIndicatorIcon />
              </IconButton>
            </span>
          </Tooltip>
        )}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography fontWeight="bold">{label}</Typography>
          <Stack direction="row" flexWrap="wrap" gap={0.5} sx={{ mt: 0.5 }}>
            <Chip
              size="small"
              label={t(
                `worlds.fields.type-${field.type}`,
                FIELD_TYPE_LABELS[field.type],
              )}
            />
            {field.configuration.rules.length > 0 && (
              <Chip
                size="small"
                label={
                  field.configuration.rules.length === 1
                    ? t("worlds.fields.rule-count-one", "1 rule")
                    : t("worlds.fields.rule-count", "{{count}} rules", {
                        count: field.configuration.rules.length,
                      })
                }
              />
            )}
            {field.gmOnly && (
              <Chip
                size="small"
                label={t("worlds.fields.gm-badge", "GM only")}
              />
            )}
            {subtitle && (
              <Chip
                size="small"
                label={t("worlds.fields.subtitle-badge", "Subtitle")}
              />
            )}
          </Stack>
        </Box>
        <Tooltip title={editLabel}>
          <span>
            <IconButton
              aria-label={editLabel}
              disabled={busy || (canEdit && disabled)}
              onClick={onEdit}
            >
              {canEdit ? <EditOutlinedIcon /> : <SettingsOutlinedIcon />}
            </IconButton>
          </span>
        </Tooltip>
        {canDelete && (
          <Tooltip title={deleteLabel}>
            <span>
              <IconButton
                color="error"
                aria-label={deleteLabel}
                disabled={disabled}
                onClick={onDelete}
              >
                <DeleteOutlineIcon />
              </IconButton>
            </span>
          </Tooltip>
        )}
      </Stack>
    </Paper>
  );
}
