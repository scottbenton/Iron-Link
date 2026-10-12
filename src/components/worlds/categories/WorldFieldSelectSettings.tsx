import {
  Autocomplete,
  Box,
  Button,
  Chip,
  FormControl,
  FormControlLabel,
  FormHelperText,
  MenuItem,
  Switch,
  TextField,
} from "@mui/material";
import { useTranslation } from "react-i18next";

import {
  WORLD_FIELD_VALUE_MAX_LENGTH,
  getWorldFieldKind,
  normalizeWorldFieldOptions,
} from "lib/worldFieldRules";

import type { IWorldCategory } from "services/worldCategories.service";

import type { FieldDraft } from "./WorldFieldEditor";

// Settings for the two kinds stored as a Select: an option list's options and
// openness, a linked entry's category, and whether either holds several values.
export function WorldFieldSelectSettings({
  draft,
  categories,
  invalidTarget,
  multipleLockedReason,
  offerCreateNew,
  disabled,
  onChange,
}: {
  draft: FieldDraft;
  categories: IWorldCategory[];
  invalidTarget: boolean;
  // Set when entries store several values, so "Allow more than one" cannot be
  // turned off in place.
  multipleLockedReason?: string;
  // False once the dialog already offers to create a new field.
  offerCreateNew: boolean;
  disabled: boolean;
  onChange: (draft: FieldDraft) => void;
}) {
  const { t } = useTranslation();
  const kind = getWorldFieldKind(draft);
  const configuration = (changes: Partial<FieldDraft["configuration"]>) =>
    onChange({
      ...draft,
      configuration: { ...draft.configuration, ...changes },
    });
  const multiple = !!draft.configuration.multiple;
  const lockedOn = multiple && !!multipleLockedReason;
  return (
    <>
      {kind === "linkedEntry" && (
        <TextField
          select
          required
          fullWidth
          label={t("worlds.fields.target-category", "Category")}
          value={
            categories.some(
              (category) =>
                category.id === draft.configuration.targetCategoryId,
            )
              ? draft.configuration.targetCategoryId
              : ""
          }
          disabled={disabled}
          error={invalidTarget}
          helperText={
            draft.configuration.targetCategoryId && invalidTarget
              ? t(
                  "worlds.fields.target-category-unavailable",
                  "This category is no longer available in this world. Choose another.",
                )
              : t(
                  "worlds.fields.target-category-help",
                  "Entries can link to entries in this category.",
                )
          }
          onChange={(event) =>
            configuration({ targetCategoryId: event.target.value })
          }
        >
          <MenuItem value="" disabled>
            {t("worlds.fields.choose-category", "Choose a category")}
          </MenuItem>
          {categories.map((category) => (
            <MenuItem key={category.id} value={category.id}>
              {category.name}
            </MenuItem>
          ))}
        </TextField>
      )}
      <FormControl>
        <FormControlLabel
          control={
            <Switch
              checked={multiple}
              disabled={disabled || lockedOn}
              onChange={(_, checked) => configuration({ multiple: checked })}
            />
          }
          label={t("worlds.fields.allow-multiple", "Allow more than one")}
        />
        {lockedOn && (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              flexWrap: "wrap",
              columnGap: 1,
            }}
          >
            <FormHelperText sx={{ mx: 0 }}>
              {multipleLockedReason}
            </FormHelperText>
            {/* Turning it off anyway leaves a draft only a new field can
                hold, so the editor then offers to create one. */}
            {offerCreateNew && !disabled && (
              <Button
                size="small"
                onClick={() => configuration({ multiple: false })}
              >
                {t("worlds.fields.create-new", "Create new field")}
              </Button>
            )}
          </Box>
        )}
      </FormControl>
      {kind === "optionList" && (
        <>
          <FormControl>
            <FormControlLabel
              control={
                <Switch
                  checked={!!draft.configuration.allowOther}
                  disabled={disabled}
                  onChange={(_, checked) =>
                    configuration({ allowOther: checked })
                  }
                />
              }
              label={t("worlds.fields.allow-other", "Allow other values")}
            />
            <FormHelperText sx={{ mx: 0 }}>
              {t(
                "worlds.fields.allow-other-help",
                "Entries can use values that aren't in the options. Values already used are offered on other entries too.",
              )}
            </FormHelperText>
          </FormControl>
          <Autocomplete
            multiple
            freeSolo
            autoSelect
            options={[]}
            value={draft.configuration.suggestions}
            disabled={disabled}
            onChange={(_, options) =>
              configuration({
                suggestions: normalizeWorldFieldOptions(options),
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
                inputProps={{
                  ...params.inputProps,
                  maxLength: WORLD_FIELD_VALUE_MAX_LENGTH,
                }}
                label={t("worlds.fields.options", "Options")}
                helperText={t(
                  "worlds.fields.options-help",
                  "Press Enter to add an option.",
                )}
              />
            )}
          />
        </>
      )}
    </>
  );
}
