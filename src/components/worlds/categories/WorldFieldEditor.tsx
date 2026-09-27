import {
  Alert,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import deepEqual from "fast-deep-equal";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import {
  areWorldFieldTypesCompatible,
  createWorldFieldConfiguration,
} from "lib/worldFieldRules";

import {
  IWorldFieldDefinition,
  OracleBinding,
  WorldFieldType,
} from "services/worldFieldDefinitions.service";

import { WorldFieldFallbackEditor } from "./WorldFieldFallbackEditor";
import { WorldFieldRuleEditor } from "./WorldFieldRuleEditor";
import {
  editorError,
  fieldChoiceLabel,
  validateFieldDraft,
} from "./categoryEditor.utils";

export type FieldDraft = Pick<
  IWorldFieldDefinition,
  "label" | "type" | "gmOnly" | "configuration"
> & { binding: OracleBinding | null };

export function WorldFieldEditor({
  worldId,
  field,
  fields,
  valueCount,
  readOnly,
  onSave,
  onClose,
}: {
  worldId: string;
  field?: IWorldFieldDefinition;
  fields: IWorldFieldDefinition[];
  valueCount: number;
  readOnly: boolean;
  onSave: (draft: FieldDraft, createNew: boolean) => Promise<void>;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const [draft, setDraft] = useState<FieldDraft>({
    label: field?.label ?? "",
    type: field?.type ?? WorldFieldType.Text,
    gmOnly: field?.gmOnly ?? false,
    binding: field?.binding ?? null,
    configuration: field?.configuration ?? createWorldFieldConfiguration(),
  });
  const initialDraft = useRef(draft).current;
  const hasChanges =
    !field || !deepEqual({ ...draft, label: draft.label.trim() }, initialDraft);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();
  const disabled = readOnly || saving;
  const incompatible =
    !!field &&
    valueCount > 0 &&
    !areWorldFieldTypesCompatible(field.type, draft.type);
  const rules = draft.configuration.rules;
  const {
    sourceFields,
    invalidCondition,
    invalidRuleLabel,
    gmDependency,
    affected,
  } = validateFieldDraft(draft, fields, field?.id, incompatible);
  const configuration = (changes: Partial<FieldDraft["configuration"]>) =>
    setDraft({
      ...draft,
      configuration: { ...draft.configuration, ...changes },
    });
  const moveRule = (index: number, offset: number) => {
    const next = [...rules];
    [next[index], next[index + offset]] = [next[index + offset], next[index]];
    configuration({ rules: next });
  };
  const save = async (createNew = false) => {
    if (!createNew && !hasChanges) return;
    setSaving(true);
    setError(undefined);
    try {
      await onSave({ ...draft, label: draft.label.trim() }, createNew);
      onClose();
    } catch (cause) {
      setError(
        editorError(
          cause,
          t(
            "worlds.fields.save-error",
            "Could not save this field. Please try again.",
          ),
        ),
      );
    } finally {
      setSaving(false);
    }
  };
  return (
    <Dialog open fullWidth maxWidth="md" onClose={saving ? undefined : onClose}>
      <DialogTitle>
        {readOnly
          ? t("worlds.fields.view", "Field configuration")
          : field
            ? t("worlds.fields.edit", "Edit field")
            : t("worlds.fields.add", "Add field")}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField
            autoFocus
            required
            label={t("worlds.fields.label", "Field label")}
            value={draft.label}
            disabled={disabled}
            onChange={(event) =>
              setDraft({ ...draft, label: event.target.value })
            }
          />
          <TextField
            select
            label={t("worlds.fields.type", "Field type")}
            value={draft.type}
            disabled={disabled}
            onChange={(event) =>
              setDraft({ ...draft, type: event.target.value as WorldFieldType })
            }
          >
            <MenuItem value={WorldFieldType.Text}>
              {t("worlds.fields.text", "Text")}
            </MenuItem>
            <MenuItem value={WorldFieldType.RichText}>
              {t("worlds.fields.rich-text", "Rich text")}
            </MenuItem>
            <MenuItem value={WorldFieldType.OracleText}>
              {t("worlds.fields.oracle-text", "Oracle text")}
            </MenuItem>
            <MenuItem value={WorldFieldType.Tags}>
              {t("worlds.fields.tags", "Tags")}
            </MenuItem>
            <MenuItem value={WorldFieldType.Number}>
              {t("worlds.fields.number", "Number")}
            </MenuItem>
          </TextField>
          {incompatible && (
            <Alert severity="warning">
              {t(
                "worlds.fields.incompatible-type",
                "This field has {{count}} stored values. This type change cannot preserve them. Create a new field to keep the existing field and its values.",
                { count: valueCount },
              )}
            </Alert>
          )}
          <FormControlLabel
            control={
              <Checkbox
                checked={draft.gmOnly}
                disabled={disabled}
                onChange={(_, checked) =>
                  setDraft({ ...draft, gmOnly: checked })
                }
              />
            }
            label={t(
              "worlds.fields.gm-only",
              "GM only (also changes access to existing values)",
            )}
          />
          {gmDependency && (
            <Alert severity="error">
              {t(
                "worlds.fields.gm-dependency",
                "This field uses a GM-only source. Make this field GM only or choose another source.",
              )}
            </Alert>
          )}
          {affected.length > 0 && (
            <Alert severity="error">
              {t(
                "worlds.fields.affected-dependents",
                "This change would invalidate conditions in {{fields}}. Update their conditions or GM visibility first.",
                {
                  fields: affected
                    .map((dependent) => fieldChoiceLabel(dependent, fields))
                    .join(", "),
                },
              )}
            </Alert>
          )}
          <WorldFieldFallbackEditor
            worldId={worldId}
            draft={draft}
            disabled={disabled}
            onChange={setDraft}
          />
          <Typography variant="h6">
            {t("worlds.fields.rules", "Conditional rules")}
          </Typography>
          <Typography color="text.secondary">
            {t(
              "worlds.fields.rule-order",
              "Rules are checked from top to bottom. The first matching rule wins.",
            )}
          </Typography>
          {invalidRuleLabel && (
            <Alert severity="warning">
              {t(
                "worlds.fields.invalid-rule-label",
                "Enter a label for every enabled label override, or turn off the override.",
              )}
            </Alert>
          )}
          {invalidCondition && (
            <Alert severity="warning">
              {t(
                "worlds.fields.invalid-conditions",
                "Every rule needs at least one valid condition. Choose the missing source or ancestor selector before saving.",
              )}
            </Alert>
          )}
          {rules.map((rule, index) => (
            <WorldFieldRuleEditor
              key={index}
              worldId={worldId}
              rule={rule}
              fields={sourceFields}
              index={index}
              disabled={disabled}
              onChange={(next) =>
                configuration({
                  rules: rules.map((item, i) => (i === index ? next : item)),
                })
              }
              onRemove={() =>
                configuration({ rules: rules.filter((_, i) => i !== index) })
              }
              onMoveUp={index > 0 ? () => moveRule(index, -1) : undefined}
              onMoveDown={
                index < rules.length - 1 ? () => moveRule(index, 1) : undefined
              }
            />
          ))}
          {!readOnly && (
            <Button
              disabled={saving || rules.length >= 64}
              onClick={() =>
                configuration({ rules: [...rules, { conditions: [] }] })
              }
            >
              {t("worlds.fields.add-rule", "Add rule")}
            </Button>
          )}
          {field && (
            <details>
              <summary>
                {t("worlds.fields.advanced", "Advanced identity")}
              </summary>
              <Typography variant="body2">
                {t("worlds.fields.stable-key", "Import/export key: {{key}}", {
                  key: field.key,
                })}
              </Typography>
            </details>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button disabled={saving} onClick={onClose}>
          {readOnly ? t("common.close", "Close") : t("common.cancel", "Cancel")}
        </Button>
        {!readOnly &&
          (incompatible ? (
            <Button
              variant="contained"
              disabled={
                saving ||
                !draft.label.trim() ||
                invalidCondition ||
                invalidRuleLabel ||
                gmDependency ||
                affected.length > 0
              }
              onClick={() => save(true)}
            >
              {t("worlds.fields.create-new", "Create new field")}
            </Button>
          ) : (
            <Button
              variant="contained"
              disabled={
                saving ||
                !hasChanges ||
                !draft.label.trim() ||
                invalidCondition ||
                invalidRuleLabel ||
                gmDependency ||
                affected.length > 0
              }
              onClick={() => save()}
            >
              {t("common.save", "Save")}
            </Button>
          ))}
      </DialogActions>
    </Dialog>
  );
}
