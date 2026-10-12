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
  Stack,
  Switch,
  TextField,
} from "@mui/material";
import deepEqual from "fast-deep-equal";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { DialogTitleWithCloseButton } from "components/DialogTitleWithCloseButton";

import { useIsBreakpoint } from "hooks/useIsBreakpoint";

import { useListenToWorldEntries } from "stores/worldEntries.store";

import {
  canWorldFieldHaveOracleBinding,
  createWorldFieldConfiguration,
  getWorldFieldChangeBlocker,
  isWorldFieldLinkedEntry,
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
import { WorldFieldTypeSection } from "./WorldFieldTypeSection";
import {
  fieldChoiceLabel,
  getEditorErrorMessage,
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
  multiValueCount,
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
  // Entries storing more than one value in this field.
  multiValueCount: number;
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
    (category) => category.worldId === worldId,
  );
  const linkedEntry = isWorldFieldLinkedEntry(draft);
  const bindable = canWorldFieldHaveOracleBinding(draft);
  const invalidTarget =
    linkedEntry &&
    !targetCategories.some(
      (category) => category.id === draft.configuration.targetCategoryId,
    );
  const counts = { valueCount, multiValueCount };
  const blocker = field
    ? getWorldFieldChangeBlocker(field, draft, counts)
    : null;
  const incompatible = blocker !== null;
  const rules = draft.configuration.rules;
  const {
    sourceFields,
    invalidCondition,
    invalidRuleLabel,
    gmDependency,
    affected,
  } = validateFieldDraft(draft, fields, field?.id, incompatible);
  // Linked-entry conditions pick and name entries from the world.
  useListenToWorldEntries(
    sourceFields.some(isWorldFieldLinkedEntry) ? worldId : undefined,
  );
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
      setError(getEditorErrorMessage(cause));
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
      setError(getEditorErrorMessage(cause));
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
            {incompatible && (
              <Alert severity="warning">
                {blocker === "multipleValues"
                  ? t(
                      "worlds.fields.incompatible-multiple",
                      "{{count}} entries store more than one value in this field. Turning off Allow more than one cannot preserve them. Create a new field to keep the existing field and its values.",
                      { count: multiValueCount },
                    )
                  : blocker === "targetCategory"
                    ? t(
                        "worlds.fields.incompatible-category",
                        "This field has {{count}} stored values. Changing its category cannot preserve them. Create a new field to keep the existing field and its values.",
                        { count: valueCount },
                      )
                    : t(
                        "worlds.fields.incompatible-type",
                        "This field has {{count}} stored values. Changing its type cannot preserve them. Create a new field to keep the existing field and its values.",
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
                      .map((dependent) =>
                        fieldChoiceLabel(dependent, fields, t),
                      )
                      .join(", "),
                  },
                )}
              </Alert>
            )}
          </WorldEditorSection>
          <WorldFieldTypeSection
            field={field}
            draft={draft}
            counts={counts}
            categories={targetCategories}
            invalidTarget={invalidTarget}
            disabled={disabled}
            readOnly={readOnly}
            onChange={setDraft}
          />
          <WorldFieldFallbackEditor
            worldId={worldId}
            draft={draft}
            allowOracleBinding={bindable}
            disabled={disabled}
            onChange={setDraft}
          />
          <WorldFieldRulesEditor
            worldId={worldId}
            rules={rules}
            fields={selectableSources}
            disabled={disabled}
            readOnly={readOnly}
            allowOracleBinding={bindable}
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
