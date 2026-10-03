import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import {
  IconButton,
  ListItem,
  ListItemButton,
  ListItemText,
} from "@mui/material";
import { useTranslation } from "react-i18next";

import { IWorldFieldDefinition } from "services/worldFieldDefinitions.service";

import { FIELD_TYPE_LABELS } from "./categoryEditor.utils";

export function WorldCategoryFieldRow({
  field,
  label,
  subtitle,
  canEdit,
  disabled,
  busy,
  divider,
  onEdit,
}: {
  field: IWorldFieldDefinition;
  label: string;
  subtitle: boolean;
  canEdit: boolean;
  disabled: boolean;
  busy: boolean;
  divider: boolean;
  onEdit: () => void;
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
  const dragLabel = t("worlds.fields.reorder-label", "Reorder {{label}}", {
    label,
  });
  const rules = field.configuration.rules.length;
  const details = [
    t(`worlds.fields.type-${field.type}`, FIELD_TYPE_LABELS[field.type]),
    rules === 1
      ? t("worlds.fields.rule-count-one", "1 rule")
      : rules > 1
        ? t("worlds.fields.rule-count", "{{count}} rules", { count: rules })
        : undefined,
    field.gmOnly ? t("worlds.fields.gm-badge", "Guide only") : undefined,
    subtitle ? t("worlds.fields.subtitle-badge", "Subtitle") : undefined,
  ].filter(Boolean);
  return (
    <ListItem
      ref={setNodeRef}
      disablePadding
      divider={divider}
      aria-label={t("worlds.fields.field-group", "{{label}} field", { label })}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      sx={{
        position: "relative",
        zIndex: isDragging ? 1 : undefined,
        bgcolor: isDragging ? "background.paper" : undefined,
        boxShadow: isDragging ? 4 : undefined,
      }}
    >
      {canEdit && (
        <IconButton
          ref={setActivatorNodeRef}
          {...attributes}
          {...listeners}
          size="small"
          aria-label={dragLabel}
          title={dragLabel}
          disabled={disabled}
          sx={{ ml: 1, cursor: "grab", touchAction: "none" }}
        >
          <DragIndicatorIcon fontSize="small" />
        </IconButton>
      )}
      <ListItemButton
        aria-label={editLabel}
        disabled={busy || (canEdit && disabled)}
        onClick={onEdit}
        sx={{ py: 0.75, pl: canEdit ? 1 : 2 }}
      >
        <ListItemText
          primary={label}
          secondary={details.join(" · ")}
          slotProps={{
            primary: { sx: { overflowWrap: "anywhere" } },
          }}
        />
      </ListItemButton>
    </ListItem>
  );
}
