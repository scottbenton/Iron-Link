import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import {
  IconButton,
  ListItem,
  ListItemButton,
  ListItemText,
  Typography,
} from "@mui/material";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { useGameIdOptional } from "pages/games/gamePageLayout/hooks/useGameId";

import { useWorldOracles } from "hooks/useWorldOracles";

import { useWorldOracleFieldChanges } from "stores/worldOracleChanges.store";

import { IWorldFieldDefinition } from "services/worldFieldDefinitions.service";

import { getOracleChangeLabel } from "../oracleChanges/oracleChangeLabels";
import { WorldFieldOracleChangesMenu } from "./WorldFieldOracleChangesMenu";
import { getFieldTypeLabel } from "./categoryEditor.utils";

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
    getFieldTypeLabel(t, field),
    rules === 1
      ? t("worlds.fields.rule-count-one", "1 rule")
      : rules > 1
        ? t("worlds.fields.rule-count", "{{count}} rules", { count: rules })
        : undefined,
    field.gmOnly ? t("worlds.fields.gm-badge", "Guide only") : undefined,
    subtitle ? t("worlds.fields.subtitle-badge", "Subtitle") : undefined,
  ].filter(Boolean);

  // Saved oracles that moved under the linked games' playsets. Inside a game
  // the ones it caused are left out: its people chose them when saving.
  const gameId = useGameIdOptional();
  const oracleChanges = useWorldOracleFieldChanges(field.id, gameId);
  const { catalog } = useWorldOracles(field.worldId);
  const oracleLabels = useMemo(
    () =>
      Object.fromEntries(
        (catalog?.choices ?? []).map((choice) => [choice.id, choice.label]),
      ),
    [catalog],
  );
  const changeLines = oracleChanges.map((change) => {
    const values = {
      previous: getOracleChangeLabel(change.previousOracleId, oracleLabels),
      next: getOracleChangeLabel(change.nextOracleId, oracleLabels),
    };
    return change.ruleIndex === null
      ? t(
          "worlds.oracle-changes.field-moved",
          "Now rolls {{next}} instead of {{previous}}",
          values,
        )
      : t(
          "worlds.oracle-changes.rule-moved",
          "Rule {{number}} now rolls {{next}} instead of {{previous}}",
          { ...values, number: change.ruleIndex + 1 },
        );
  });
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
          secondary={
            <>
              {details.join(" · ")}
              {changeLines.map((line, index) => (
                <Typography
                  key={index}
                  component="span"
                  variant="body2"
                  color="warning.main"
                  display="block"
                >
                  {line}
                </Typography>
              ))}
            </>
          }
          slotProps={{
            primary: { sx: { overflowWrap: "anywhere" } },
            secondary: { sx: { overflowWrap: "anywhere" } },
          }}
        />
      </ListItemButton>
      {canEdit && oracleChanges.length > 0 && (
        <WorldFieldOracleChangesMenu
          label={label}
          changes={oracleChanges}
          disabled={busy || disabled}
          onChooseAnother={onEdit}
        />
      )}
    </ListItem>
  );
}
