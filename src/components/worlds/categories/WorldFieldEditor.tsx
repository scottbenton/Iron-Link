import DeleteIcon from "@mui/icons-material/Delete";
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  FormControl,
  FormControlLabel,
  FormHelperText,
  MenuItem,
  Stack,
  Switch,
  TextField,
} from "@mui/material";
import deepEqual from "fast-deep-equal";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { validate as isUuid } from "uuid";

import { DialogTitleWithCloseButton } from "components/DialogTitleWithCloseButton";

import { useIsBreakpoint } from "hooks/useIsBreakpoint";

import {
  areWorldFieldDefinitionsCompatible,
  createWorldFieldConfiguration,
  isWorldCategoryReferenceType,
  withoutWorldFieldOracleBindings,
} from "lib/worldFieldRules";

import type { IWorldCategory } from "services/worldCategories.service";
import {
  IWorldFieldDefinition,
  OracleBinding,
  WorldFieldType,
} from "services/worldFieldDefinitions.service";

import { WorldEditorSection } from "./WorldEditorSection";
import { WorldFieldFallbackEditor } from "./WorldFieldFallbackEditor";
import { WorldFieldRulesEditor } from "./WorldFieldRulesEditor";
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
  categories,
  valueCount,
  readOnly,
  onSave,
  onClose,
  onDelete,
}: {
  worldId: string;
  field?: IWorldFieldDefinition;
  fields: IWorldFieldDefinition[];
  categories: IWorldCategory[];
  valueCount: number;
  readOnly: boolean;
  onSave: (draft: FieldDraft, createNew: boolean) => Promise<void>;
  onClose: () => void;
  // Resolves true once the field is deleted; throws to show an error.
  onDelete?: () => Promise<boolean>;
}) {
  const { t } = useTranslation();
  // The rule editor needs the whole screen on phones.
  const compact = useIsBreakpoint("smaller-than", "sm");
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
  const targetCategories = categories.filter(
    (category) => category.worldId === worldId && isUuid(category.id),
  );
  const categoryReference = isWorldCategoryReferenceType(draft.type);
  const invalidTarget =
    categoryReference &&
    !targetCategories.some(
      (category) => category.id === draft.configuration.targetCategoryId,
    );
  const incompatible =
    !!field &&
    valueCount > 0 &&
    !areWorldFieldDefinitionsCompatible(field, draft);
  const rules = draft.configuration.rules;
  const {
    sourceFields,
    invalidCondition,
    invalidRuleLabel,
    gmDependency,
    affected,
  } = validateFieldDraft(draft, fields, field?.id, incompatible);
  const selectableSources = sourceFields.filter(
    (source) => draft.gmOnly || !source.gmOnly,
  );
  const configuration = (changes: Partial<FieldDraft["configuration"]>) =>
    setDraft({
      ...draft,
      configuration: { ...draft.configuration, ...changes },
    });
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
  const [deleting, setDeleting] = useState(false);
  const remove = async () => {
    if (!onDelete) return;
    setDeleting(true);
    setError(undefined);
    try {
      if (await onDelete()) onClose();
    } catch (cause) {
      setError(
        editorError(
          cause,
          t(
            "worlds.fields.action-error",
            "Could not update these fields. Please try again.",
          ),
        ),
      );
    } finally {
      setDeleting(false);
    }
  };
  const blocked =
    saving ||
    deleting ||
    !draft.label.trim() ||
    invalidCondition ||
    invalidRuleLabel ||
    invalidTarget ||
    gmDependency ||
    affected.length > 0;
  return (
    <Dialog
      open
      fullWidth
      fullScreen={compact}
      maxWidth="md"
      onClose={saving ? undefined : onClose}
    >
      <DialogTitleWithCloseButton onClose={() => !saving && onClose()}>
        {readOnly
          ? t("worlds.fields.view", "Field configuration")
          : field
            ? t("worlds.fields.edit", "Edit field")
            : t("worlds.fields.add", "Add field")}
      </DialogTitleWithCloseButton>
      <DialogContent sx={{ px: { xs: 2, sm: 3 } }}>
        <Stack spacing={4} sx={{ pt: 1, pb: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}
          <WorldEditorSection title={t("worlds.fields.details", "Details")}>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                autoFocus
                required
                fullWidth
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
                sx={{ minWidth: { sm: 200 } }}
                onChange={(event) => {
                  const type = event.target.value as WorldFieldType;
                  const reference = isWorldCategoryReferenceType(type);
                  setDraft({
                    ...draft,
                    type,
                    binding: reference ? null : draft.binding,
                    configuration: {
                      ...draft.configuration,
                      suggestions: reference
                        ? []
                        : draft.configuration.suggestions,
                      targetCategoryId: reference
                        ? isWorldCategoryReferenceType(draft.type)
                          ? draft.configuration.targetCategoryId
                          : undefined
                        : undefined,
                      rules: reference
                        ? withoutWorldFieldOracleBindings(
                            draft.configuration.rules,
                          )
                        : draft.configuration.rules,
                    },
                  });
                }}
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
                <MenuItem value={WorldFieldType.CategorySelect}>
                  {t("worlds.fields.category-select", "Category select")}
                </MenuItem>
                <MenuItem value={WorldFieldType.CategoryMultiSelect}>
                  {t(
                    "worlds.fields.category-multi-select",
                    "Category multi-select",
                  )}
                </MenuItem>
              </TextField>
            </Stack>
            {incompatible && (
              <Alert severity="warning">
                {t(
                  "worlds.fields.incompatible-type",
                  "This field has {{count}} stored values. Changing its type or target category cannot preserve them. Create a new field to keep the existing field and its values.",
                  { count: valueCount },
                )}
              </Alert>
            )}
            <FormControl>
              <FormControlLabel
                control={
                  <Switch
                    checked={draft.gmOnly}
                    disabled={disabled}
                    onChange={(_, checked) =>
                      setDraft({ ...draft, gmOnly: checked })
                    }
                  />
                }
                label={t("worlds.fields.gm-only", "Guide only")}
              />
              <FormHelperText sx={{ mx: 0 }}>
                {t(
                  "worlds.fields.gm-only-help",
                  "Only guides can see this field. Changing this also changes who can see existing values.",
                )}
              </FormHelperText>
            </FormControl>
            {gmDependency && (
              <Alert severity="error">
                {t(
                  "worlds.fields.gm-dependency",
                  "This field uses a Guide-only source. Make this field Guide only or choose another source.",
                )}
              </Alert>
            )}
            {affected.length > 0 && (
              <Alert severity="error">
                {t(
                  "worlds.fields.affected-dependents",
                  "This change would invalidate conditions in {{fields}}. Update their conditions or Guide visibility first.",
                  {
                    fields: affected
                      .map((dependent) => fieldChoiceLabel(dependent, fields))
                      .join(", "),
                  },
                )}
              </Alert>
            )}
          </WorldEditorSection>
          <WorldFieldFallbackEditor
            worldId={worldId}
            draft={draft}
            categories={targetCategories}
            invalidTarget={invalidTarget}
            disabled={disabled}
            onChange={setDraft}
          />
          <WorldFieldRulesEditor
            worldId={worldId}
            rules={rules}
            fields={selectableSources}
            disabled={disabled}
            readOnly={readOnly}
            allowOracleBinding={!categoryReference}
            invalidCondition={invalidCondition}
            invalidRuleLabel={invalidRuleLabel}
            onChange={(rules) => configuration({ rules })}
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: { xs: 2, sm: 3 }, py: 2 }}>
        {!readOnly && onDelete && (
          <Button
            color="error"
            startIcon={<DeleteIcon />}
            disabled={saving || deleting}
            onClick={remove}
            sx={{ mr: "auto" }}
          >
            {t("worlds.fields.delete", "Delete field")}
          </Button>
        )}
        <Button color="inherit" disabled={saving} onClick={onClose}>
          {readOnly ? t("common.close", "Close") : t("common.cancel", "Cancel")}
        </Button>
        {!readOnly &&
          (incompatible ? (
            <Button
              variant="contained"
              disabled={blocked}
              onClick={() => save(true)}
            >
              {t("worlds.fields.create-new", "Create new field")}
            </Button>
          ) : (
            <Button
              variant="contained"
              disabled={blocked || !hasChanges}
              onClick={() => save()}
            >
              {t("common.save", "Save")}
            </Button>
          ))}
      </DialogActions>
    </Dialog>
  );
}
