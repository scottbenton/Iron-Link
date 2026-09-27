import {
  Alert,
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  Stack,
  Typography,
} from "@mui/material";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import {
  getFrozenWorldOracleBinding,
  pinWorldOracleChoice,
} from "lib/worldOracleCatalog";

import type { OracleBinding } from "services/worldFieldDefinitions.service";

import { WorldOracleTreePicker } from "./WorldOracleTreePicker";
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
  const [choosing, setChoosing] = useState(false);
  const frozen =
    catalog && value ? getFrozenWorldOracleBinding(value, catalog) : null;
  return (
    <Stack spacing={1}>
      <Typography variant="subtitle2">
        {t("worlds.fields.oracle", "Oracle binding")}
      </Typography>
      <Typography color="text.secondary">
        {selected?.label ??
          (value
            ? t("worlds.fields.unavailable-oracle", "Unavailable oracle")
            : t("worlds.fields.no-oracle", "No oracle selected"))}
      </Typography>
      <Button
        variant="outlined"
        sx={{ alignSelf: "flex-start" }}
        disabled={disabled || context.loading || !!context.error}
        onClick={() => setChoosing(!choosing)}
      >
        {choosing
          ? t("worlds.fields.close-oracle-picker", "Close oracle picker")
          : t("worlds.fields.choose-oracle", "Choose oracle")}
      </Button>
      {choosing && catalog && (
        <WorldOracleTreePicker
          catalog={catalog}
          allPackages={context.allPackages}
          exact={!!value?.exact}
          selectedId={value?.oracleId}
          disabled={disabled || context.loading || !!context.error}
          onSelect={(choice) => {
            onChange(pinWorldOracleChoice(choice, value?.exact));
            setChoosing(false);
          }}
        />
      )}
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
              {
                id:
                  catalog.choices.find((choice) => choice.id === id)?.label ??
                  id,
                choice:
                  catalog.choices.find((choice) => choice.id === candidates[0])
                    ?.label ?? candidates[0],
              },
            )}
          </Alert>
        ))}
    </Stack>
  );
}
