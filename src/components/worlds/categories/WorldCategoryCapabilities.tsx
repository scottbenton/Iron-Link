import { FormGroup, FormHelperText, FormLabel, Stack } from "@mui/material";
import { useTranslation } from "react-i18next";

import type { IWorldCategory } from "services/worldCategories.service";

import { WorldSettingCheckbox } from "../WorldSettingCheckbox";

export type CategoryCapabilities = Pick<
  IWorldCategory,
  "supportsHierarchy" | "supportsMap" | "supportsBonds"
>;

export function WorldCategoryCapabilities({
  value,
  disabled,
  nestedEntryCount = 0,
  onChange,
}: {
  value: CategoryCapabilities;
  disabled?: boolean;
  // Nesting stays on while entries sit inside a parent.
  nestedEntryCount?: number;
  onChange: (changes: Partial<CategoryCapabilities>) => void;
}) {
  const { t } = useTranslation();
  const options: {
    key: keyof CategoryCapabilities;
    label: string;
    description: string;
    blocker?: string;
  }[] = [
    {
      key: "supportsHierarchy",
      label: t("worlds.categories.hierarchy", "Nesting"),
      description: t(
        "worlds.categories.hierarchy-help",
        "Entries can sit inside other entries, like a settlement on a planet.",
      ),
      blocker:
        value.supportsHierarchy && nestedEntryCount > 0
          ? t(
              "worlds.categories.hierarchy-blocked",
              "Move {{count}} entries out of their parent entries first.",
              { count: nestedEntryCount },
            )
          : undefined,
    },
    {
      key: "supportsMap",
      label: t("worlds.categories.map", "Maps"),
      description: t(
        "worlds.categories.map-help",
        "Entries can hold a map of their own.",
      ),
    },
    {
      key: "supportsBonds",
      label: t("worlds.categories.bonds", "Bonds"),
      description: t(
        "worlds.categories.bonds-help",
        "Characters can form bonds with entries.",
      ),
    },
  ];
  return (
    <FormGroup>
      <FormLabel component="legend" sx={{ mb: 0.5 }}>
        {t("worlds.categories.capabilities", "Entry features")}
      </FormLabel>
      <Stack spacing={1} sx={{ mb: 1 }}>
        {options.map((option) => (
          <WorldSettingCheckbox
            key={option.key}
            label={option.label}
            description={option.description}
            note={option.blocker}
            checked={value[option.key]}
            disabled={disabled || !!option.blocker}
            onChange={(checked) => onChange({ [option.key]: checked })}
          />
        ))}
      </Stack>
      <FormHelperText sx={{ mx: 0 }}>
        {t(
          "worlds.categories.capabilities-help",
          "Controls which tools entries in this category offer.",
        )}
      </FormHelperText>
    </FormGroup>
  );
}
