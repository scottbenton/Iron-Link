import {
  FormControlLabel,
  FormGroup,
  FormHelperText,
  FormLabel,
  Switch,
} from "@mui/material";
import { Fragment, useId } from "react";
import { useTranslation } from "react-i18next";

import type { IWorldCategory } from "services/worldCategories.service";

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
  const blockerId = useId();
  const options: {
    key: keyof CategoryCapabilities;
    label: string;
    blocker?: string;
  }[] = [
    {
      key: "supportsHierarchy",
      label: t("worlds.categories.hierarchy", "Supports nesting entries"),
      blocker:
        value.supportsHierarchy && nestedEntryCount > 0
          ? t(
              "worlds.categories.hierarchy-blocked",
              "Move {{count}} entries out of their parent entries first.",
              { count: nestedEntryCount },
            )
          : undefined,
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
        <Fragment key={option.key}>
          <FormControlLabel
            control={
              <Switch
                checked={value[option.key]}
                disabled={disabled || !!option.blocker}
                onChange={(_, checked) => onChange({ [option.key]: checked })}
                slotProps={{
                  input: {
                    "aria-describedby": option.blocker
                      ? `${blockerId}-${option.key}`
                      : undefined,
                  },
                }}
              />
            }
            label={option.label}
          />
          {option.blocker && (
            <FormHelperText
              id={`${blockerId}-${option.key}`}
              sx={{ mx: 0, mt: 0, mb: 1 }}
            >
              {option.blocker}
            </FormHelperText>
          )}
        </Fragment>
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
