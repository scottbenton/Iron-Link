import { FormControlLabel, Switch, TextField } from "@mui/material";
import { useTranslation } from "react-i18next";

import type { OracleBinding } from "services/worldFieldDefinitions.service";

import { WorldOracleBindingPicker } from "../WorldOracleBindingPicker";
import { WorldEditorSection } from "./WorldEditorSection";
import type { FieldDraft } from "./WorldFieldEditor";

export function WorldFieldFallbackEditor({
  worldId,
  draft,
  allowOracleBinding,
  disabled,
  onChange,
}: {
  worldId: string;
  draft: FieldDraft;
  // Only Text and option lists can roll from an oracle.
  allowOracleBinding: boolean;
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
      {allowOracleBinding && (
        <WorldOracleBindingPicker
          worldId={worldId}
          value={draft.binding}
          disabled={disabled}
          onChange={(binding: OracleBinding | null) =>
            onChange({ ...draft, binding })
          }
        />
      )}
    </WorldEditorSection>
  );
}
