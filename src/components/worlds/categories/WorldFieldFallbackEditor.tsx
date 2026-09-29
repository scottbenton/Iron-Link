import {
  Autocomplete,
  Chip,
  FormControlLabel,
  Switch,
  TextField,
} from "@mui/material";
import { useTranslation } from "react-i18next";

import {
  OracleBinding,
  WorldFieldType,
} from "services/worldFieldDefinitions.service";

import { WorldOracleBindingPicker } from "../WorldOracleBindingPicker";
import { WorldEditorSection } from "./WorldEditorSection";
import type { FieldDraft } from "./WorldFieldEditor";

export function WorldFieldFallbackEditor({
  worldId,
  draft,
  disabled,
  onChange,
}: {
  worldId: string;
  draft: FieldDraft;
  disabled: boolean;
  onChange: (draft: FieldDraft) => void;
}) {
  const { t } = useTranslation();
  const configuration = (changes: Partial<FieldDraft["configuration"]>) =>
    onChange({
      ...draft,
      configuration: { ...draft.configuration, ...changes },
    });
  return (
    <WorldEditorSection
      title={t("worlds.fields.fallback", "Default behavior")}
      description={t(
        "worlds.fields.fallback-description",
        "Used when no rule matches. Rules inherit anything they don't override.",
      )}
    >
      <FormControlLabel
        control={
          <Switch
            checked={draft.configuration.visible}
            disabled={disabled}
            onChange={(_, checked) => configuration({ visible: checked })}
          />
        }
        label={t("worlds.fields.visible", "Visible")}
      />
      <TextField
        label={t("worlds.fields.help-text", "Help text")}
        value={draft.configuration.helpText}
        multiline
        disabled={disabled}
        helperText={t(
          "worlds.fields.help-text-description",
          "Guidance shown beneath this field on entries.",
        )}
        onChange={(event) => configuration({ helpText: event.target.value })}
      />
      {draft.type === WorldFieldType.Text && (
        <Autocomplete
          multiple
          freeSolo
          autoSelect
          options={[]}
          value={draft.configuration.suggestions}
          disabled={disabled}
          onChange={(_, suggestions) =>
            configuration({
              suggestions: suggestions
                .map((suggestion) => suggestion.trim())
                .filter(Boolean),
            })
          }
          renderValue={(values, getItemProps) =>
            values.map((option, index) => {
              const { key, ...itemProps } = getItemProps({ index });
              return (
                <Chip key={key} size="small" label={option} {...itemProps} />
              );
            })
          }
          renderInput={(params) => (
            <TextField
              {...params}
              label={t("worlds.fields.suggestions", "Suggestions")}
              helperText={t(
                "worlds.fields.suggestions-help",
                "Press Enter to add a suggestion. Entries can also use custom text.",
              )}
            />
          )}
        />
      )}
      <WorldOracleBindingPicker
        worldId={worldId}
        value={draft.binding}
        disabled={disabled}
        onChange={(binding: OracleBinding | null) =>
          onChange({ ...draft, binding })
        }
      />
    </WorldEditorSection>
  );
}
