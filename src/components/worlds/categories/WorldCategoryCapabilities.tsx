import {
  FormControlLabel,
  FormGroup,
  FormHelperText,
  FormLabel,
  Switch,
} from "@mui/material";
import { useTranslation } from "react-i18next";

import type { IWorldCategory } from "services/worldCategories.service";

export type CategoryCapabilities = Pick<
  IWorldCategory,
  "supportsHierarchy" | "supportsMap" | "supportsBonds"
>;

export function WorldCategoryCapabilities({
  value,
  disabled,
  onChange,
}: {
  value: CategoryCapabilities;
  disabled?: boolean;
  onChange: (changes: Partial<CategoryCapabilities>) => void;
}) {
  const { t } = useTranslation();
  const options: {
    key: keyof CategoryCapabilities;
    label: string;
  }[] = [
    {
      key: "supportsHierarchy",
      label: t(
        "worlds.categories.hierarchy",
        "Supports parent and child entries",
      ),
    },
    { key: "supportsMap", label: t("worlds.categories.map", "Supports maps") },
    {
      key: "supportsBonds",
      label: t("worlds.categories.bonds", "Supports bonds"),
    },
  ];
  return (
    <FormGroup>
      <FormLabel component="legend" sx={{ mb: 0.5 }}>
        {t("worlds.categories.capabilities", "Entry features")}
      </FormLabel>
      {options.map((option) => (
        <FormControlLabel
          key={option.key}
          control={
            <Switch
              checked={value[option.key]}
              disabled={disabled}
              onChange={(_, checked) => onChange({ [option.key]: checked })}
            />
          }
          label={option.label}
        />
      ))}
      <FormHelperText sx={{ mx: 0 }}>
        {t(
          "worlds.categories.capabilities-help",
          "Controls which tools entries in this category offer.",
        )}
      </FormHelperText>
    </FormGroup>
  );
}
