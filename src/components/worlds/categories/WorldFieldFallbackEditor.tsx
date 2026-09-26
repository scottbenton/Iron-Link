import {
  Checkbox,
  FormControlLabel,
  TextField,
  Typography,
} from "@mui/material";
import { useTranslation } from "react-i18next";

import {
  OracleBinding,
  WorldFieldType,
} from "services/worldFieldDefinitions.service";

import { WorldOracleBindingPicker } from "../WorldOracleBindingPicker";
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
    <>
      <Typography variant="h6">
        {t("worlds.fields.fallback", "Fallback presentation and oracle")}
      </Typography>
      <Typography color="text.secondary">
        {t(
          "worlds.fields.fallback-description",
          "These settings apply when no rule matches. A matching rule inherits any setting it does not override.",
        )}
      </Typography>
      <FormControlLabel
        control={
          <Checkbox
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
        onChange={(event) => configuration({ helpText: event.target.value })}
      />
      {draft.type === WorldFieldType.Text && (
        <TextField
          label={t("worlds.fields.suggestions", "Suggestions (one per line)")}
          multiline
          minRows={2}
          value={draft.configuration.suggestions.join("\n")}
          disabled={disabled}
          helperText={t(
            "worlds.fields.suggestions-help",
            "Entries can also use custom text.",
          )}
          onChange={(event) =>
            configuration({ suggestions: event.target.value.split("\n") })
          }
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
    </>
  );
}
