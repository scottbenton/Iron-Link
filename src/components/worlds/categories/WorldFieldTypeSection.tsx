import { Box, Button, Typography } from "@mui/material";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import {
  type WorldFieldKind,
  type WorldFieldValueCounts,
  changeWorldFieldKind,
  getWorldFieldChangeBlocker,
  getWorldFieldKind,
} from "lib/worldFieldRules";

import type { IWorldCategory } from "services/worldCategories.service";
import type { IWorldFieldDefinition } from "services/worldFieldDefinitions.service";

import { WorldEditorSection } from "./WorldEditorSection";
import type { FieldDraft } from "./WorldFieldEditor";
import { WorldFieldSelectSettings } from "./WorldFieldSelectSettings";
import { WorldFieldTypePicker } from "./WorldFieldTypePicker";
import { getFieldKindHint, getFieldKindLabel } from "./categoryEditor.utils";

// Chooses what the field is for. A new field shows every kind on offer; an
// existing one summarizes its kind until the author asks to change it, and
// kinds that would lose stored values say so instead of being selectable.
export function WorldFieldTypeSection({
  field,
  draft,
  counts,
  categories,
  invalidTarget,
  disabled,
  readOnly,
  onChange,
}: {
  field?: IWorldFieldDefinition;
  draft: FieldDraft;
  counts: WorldFieldValueCounts;
  categories: IWorldCategory[];
  invalidTarget: boolean;
  disabled: boolean;
  readOnly: boolean;
  onChange: (draft: FieldDraft) => void;
}) {
  const { t } = useTranslation();
  const [changing, setChanging] = useState(false);
  const kind = getWorldFieldKind(draft);
  const fieldKind = field && getWorldFieldKind(field);
  const title = t("worlds.fields.type", "Field type");
  const valuesReason = t(
    "worlds.fields.kind-has-values",
    "Has {{count}} values. Create a new field instead.",
    {
      count: counts.valueCount,
      defaultValue_one: "Has {{count}} value. Create a new field instead.",
    },
  );

  // Returning to the saved kind restores its settings, so looking at another
  // card and coming back loses nothing.
  const selectKind = (next: WorldFieldKind) => {
    if (field && next === fieldKind) {
      onChange({
        ...draft,
        type: field.type,
        binding: field.binding,
        configuration: {
          ...field.configuration,
          helpText: draft.configuration.helpText,
          visible: draft.configuration.visible,
          rules: draft.configuration.rules,
        },
      });
    } else {
      onChange(changeWorldFieldKind(draft, next));
    }
  };
  const getDisabledReason = (candidate: WorldFieldKind) => {
    if (!field || candidate === fieldKind) return undefined;
    return getWorldFieldChangeBlocker(
      field,
      changeWorldFieldKind(field, candidate),
      counts,
    )
      ? valuesReason
      : undefined;
  };
  const creatingNew =
    !!field && getWorldFieldChangeBlocker(field, draft, counts) !== null;
  const multipleLocked =
    !!field?.configuration.multiple &&
    kind === fieldKind &&
    getWorldFieldChangeBlocker(
      field,
      {
        ...field,
        configuration: { ...field.configuration, multiple: false },
      },
      counts,
    ) === "multipleValues";

  const summary = [
    getFieldKindLabel(t, kind),
    kind === "linkedEntry" &&
      categories.find(
        (category) => category.id === draft.configuration.targetCategoryId,
      )?.name,
    (kind === "optionList" || kind === "linkedEntry") &&
      draft.configuration.multiple &&
      t("worlds.fields.allow-multiple", "Allow more than one"),
    kind === "optionList" &&
      draft.configuration.allowOther &&
      t("worlds.fields.allow-other", "Allow other values"),
  ].filter(Boolean);
  const showPicker = !readOnly && (!field || changing);

  return (
    <WorldEditorSection title={title}>
      {showPicker ? (
        <>
          {field && fieldKind && (
            <Button
              size="small"
              disabled={disabled}
              sx={{ alignSelf: "flex-end" }}
              onClick={() => {
                if (kind !== fieldKind) selectKind(fieldKind);
                setChanging(false);
              }}
            >
              {t("worlds.fields.keep-type", "Keep current type")}
            </Button>
          )}
          <WorldFieldTypePicker
            value={kind}
            label={title}
            disabled={disabled}
            getDisabledReason={getDisabledReason}
            onChange={selectKind}
            // Once the draft can only become a new field, the dialog's own
            // action creates it; one button is enough.
            onCreateNew={field && !creatingNew ? selectKind : undefined}
          />
        </>
      ) : (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 1,
          }}
        >
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Typography>{summary.join(" · ")}</Typography>
            <Typography variant="body2" color="text.secondary">
              {getFieldKindHint(t, kind)}
            </Typography>
          </Box>
          {!readOnly && (
            <Button
              size="small"
              disabled={disabled}
              onClick={() => setChanging(true)}
            >
              {t("worlds.fields.change-type", "Change type")}
            </Button>
          )}
        </Box>
      )}
      {(kind === "optionList" || kind === "linkedEntry") && (
        <WorldFieldSelectSettings
          draft={draft}
          categories={categories}
          invalidTarget={invalidTarget}
          multipleLockedReason={
            multipleLocked
              ? t(
                  "worlds.fields.multiple-values",
                  "{{count}} entries store more than one value. Create a new field instead.",
                  {
                    count: counts.multiValueCount,
                    defaultValue_one:
                      "{{count}} entry stores more than one value. Create a new field instead.",
                  },
                )
              : undefined
          }
          offerCreateNew={!creatingNew}
          disabled={disabled}
          onChange={onChange}
        />
      )}
    </WorldEditorSection>
  );
}
