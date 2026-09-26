import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useTranslation } from "react-i18next";

import {
  getFrozenWorldOracleBinding,
  getWorldOracleChoices,
  pinWorldOracleChoice,
} from "lib/worldOracleCatalog";

import type { OracleBinding } from "services/worldFieldDefinitions.service";

import { useWorldOracleContext } from "./worldOracleContext";

export function WorldOracleBindingPicker({
  worldId,
  value,
  onChange,
  disabled = false,
}: {
  worldId: string;
  value: OracleBinding | null;
  onChange: (value: OracleBinding | null) => void;
  disabled?: boolean;
}) {
  const { t } = useTranslation();
  const context = useWorldOracleContext(worldId);
  const { catalog } = context;
  const selected = catalog?.choices.find(
    (choice) => choice.id === value?.oracleId,
  );
  const choices = catalog
    ? getWorldOracleChoices(catalog, context.allPackages, value?.exact)
    : [];
  if (selected && !choices.some((choice) => choice.id === selected.id))
    choices.push(selected);
  choices.sort(
    (a, b) =>
      a.packageName.localeCompare(b.packageName) ||
      a.label.localeCompare(b.label),
  );
  const frozen =
    catalog && value ? getFrozenWorldOracleBinding(value, catalog) : null;
  return (
    <Stack spacing={1}>
      <Autocomplete
        options={choices}
        value={selected ?? null}
        getOptionLabel={(choice) => choice.label}
        getOptionKey={(choice) => choice.id}
        isOptionEqualToValue={(a, b) => a.id === b.id}
        groupBy={(choice) => choice.packageName}
        loading={context.loading}
        disabled={disabled || context.loading || !!context.error}
        onChange={(_, choice) => {
          const resolvedId =
            choice && !value?.exact
              ? catalog?.replacementMap[choice.id]
              : undefined;
          const resolved = resolvedId
            ? catalog?.choices.find((candidate) => candidate.id === resolvedId)
            : choice;
          onChange(
            resolved ? pinWorldOracleChoice(resolved, value?.exact) : null,
          );
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            label={t("worlds.fields.oracle", "Oracle binding")}
          />
        )}
      />
      <FormControlLabel
        control={
          <Checkbox
            checked={context.allPackages}
            disabled={disabled}
            onChange={(_, checked) => context.setAllPackages(checked)}
          />
        }
        label={t("worlds.fields.all-packages", "All packages")}
      />
      {value && (
        <>
          {selected && (
            <Typography variant="caption" color="text.secondary">
              {selected.packageName} · {selected.label}
            </Typography>
          )}
          <Button
            disabled={disabled}
            onClick={() => onChange(null)}
            sx={{ alignSelf: "flex-start" }}
          >
            {t("worlds.fields.remove-binding", "Remove binding")}
          </Button>
          <Box component="details">
            <Box component="summary" sx={{ cursor: "pointer" }}>
              {t("worlds.fields.advanced-binding", "Advanced binding options")}
            </Box>
            <FormControlLabel
              control={
                <Checkbox
                  checked={!!value.exact}
                  disabled={disabled || context.loading || !catalog}
                  onChange={(_, exact) => {
                    if (!catalog) return;
                    // A deliberate binding-option edit may change the pin; unrelated edits never do.
                    onChange({
                      ...value,
                      exact,
                      resolvedOracleId: exact
                        ? value.oracleId
                        : (catalog.replacementMap[value.oracleId] ??
                          value.oracleId),
                    });
                  }}
                />
              }
              label={t(
                "worlds.fields.exact",
                "Use this exact oracle (ignore replacements)",
              )}
            />
            <Typography
              variant="caption"
              color="text.secondary"
              display="block"
            >
              {value.resolvedOracleId}
            </Typography>
          </Box>
        </>
      )}
      {context.error && (
        <Alert
          severity="error"
          action={
            <Button color="inherit" onClick={context.retry}>
              {t("common.retry", "Retry")}
            </Button>
          }
        >
          {context.error}
        </Alert>
      )}
      {!context.loading &&
        catalog &&
        value &&
        (!selected || frozen?.missing) && (
          <Alert severity="error">
            {t(
              "worlds.fields.missing-binding",
              "This stored oracle is unavailable. Choose another oracle to repair the binding.",
            )}
          </Alert>
        )}
      {!context.loading && frozen?.divergence && (
        <Alert severity="warning">
          {t(
            "worlds.fields.pending-binding",
            "The linked games now resolve this binding differently. Rolls keep the stored oracle until you explicitly rebind it.",
          )}
        </Alert>
      )}
      {!!catalog?.missingPackageIds.length && (
        <Alert severity="warning">
          {t(
            "worlds.fields.missing-packages",
            "Unavailable packages: {{packages}}",
            { packages: catalog.missingPackageIds.join(", ") },
          )}
        </Alert>
      )}
      {catalog &&
        Object.entries(catalog.collisions).map(([id, candidates]) => (
          <Alert key={id} severity="warning">
            {t(
              "worlds.fields.replacement-collision",
              "Multiple oracles replace {{id}}. The deterministic choice is {{choice}}.",
              { id, choice: candidates[0] },
            )}
          </Alert>
        ))}
    </Stack>
  );
}
