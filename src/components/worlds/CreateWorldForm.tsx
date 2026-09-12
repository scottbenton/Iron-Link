import { Box, Button, TextField, Typography } from "@mui/material";
import { FormEvent, useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { GradientButton } from "components/GradientButton";
import { GridLayout } from "components/Layout/GridLayout";

import {
  WorldCreationOption,
  blankWorldOptionId,
  getWorldSettingCreationOptions,
} from "lib/worldSettings";

import { WorldsService } from "services/worlds.service";

import { WorldOptionCard } from "./WorldOptionCard";

export interface CreateWorldFormProps {
  onCreated: (worldId: string) => void;
  onCancel?: () => void;
}

// Renders only its own content (no page chrome, no dialog shell) so it can be
// dropped into the standalone create page or into an in-game dialog.
export function CreateWorldForm(props: CreateWorldFormProps) {
  const { onCreated, onCancel } = props;

  const { t } = useTranslation();

  const options = useMemo<WorldCreationOption[]>(
    () => [
      ...getWorldSettingCreationOptions(),
      {
        id: blankWorldOptionId,
        name: t("worlds.create.blank-world", "Blank World"),
        description: t(
          "worlds.create.blank-world-description",
          "No setting truths, nothing pre-configured. Start from an empty world.",
        ),
        settingKey: null,
        prefillName: null,
      },
    ],
    [t],
  );

  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [name, setName] = useState("");
  // The name we last prefilled. While the field still matches it, the user has
  // not typed anything of their own, so switching cards may overwrite it.
  const [prefilledName, setPrefilledName] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSelectOption = useCallback(
    (option: WorldCreationOption) => {
      setSelectedOptionId(option.id);
      const nextPrefill = option.prefillName ?? "";
      setName((currentName) =>
        currentName === prefilledName ? nextPrefill : currentName,
      );
      setPrefilledName(nextPrefill);
    },
    [prefilledName],
  );

  const selectedOption = options.find(
    (option) => option.id === selectedOptionId,
  );

  const handleSubmit = useCallback(
    (evt: FormEvent<HTMLFormElement>) => {
      evt.preventDefault();
      const trimmedName = name.trim();
      if (!selectedOption || !trimmedName || saving) {
        return;
      }
      setSaving(true);
      WorldsService.createWorld(
        trimmedName,
        undefined,
        selectedOption.settingKey ?? undefined,
      )
        .then((worldId) => {
          onCreated(worldId);
        })
        .catch(() => {
          // RepositoryErrors already raise their own error snackbar as they
          // are constructed, so this only has to undo the busy state.
          setSaving(false);
        });
    },
    [name, selectedOption, saving, onCreated],
  );

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Typography
        variant="h6"
        component="h2"
        fontFamily={(theme) => theme.typography.fontFamilyTitle}
        textTransform="uppercase"
        sx={{ mb: 1 }}
      >
        {t("worlds.create.choose-setting", "Choose a Setting")}
      </Typography>
      <GridLayout
        items={options}
        renderItem={(option) => (
          <WorldOptionCard
            option={option}
            selected={option.id === selectedOptionId}
            disabled={saving}
            onSelect={() => handleSelectOption(option)}
          />
        )}
        minWidth={220}
      />
      <TextField
        label={t("worlds.create.world-name", "World Name")}
        value={name}
        onChange={(evt) => setName(evt.currentTarget.value)}
        onFocus={(evt) => {
          // Makes an untouched prefill trivial to replace, without stealing a
          // selection from a name the user typed themselves.
          if (evt.currentTarget.value === prefilledName) {
            evt.currentTarget.select();
          }
        }}
        disabled={saving}
        fullWidth
        sx={{ mt: 3 }}
      />
      <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end", gap: 1 }}>
        {onCancel && (
          <Button color="inherit" onClick={onCancel} disabled={saving}>
            {t("common.cancel", "Cancel")}
          </Button>
        )}
        <GradientButton
          type="submit"
          disabled={!selectedOption || !name.trim() || saving}
        >
          {saving
            ? t("worlds.create.creating-world", "Creating World...")
            : t("worlds.create.create-world", "Create World")}
        </GradientButton>
      </Box>
    </Box>
  );
}
