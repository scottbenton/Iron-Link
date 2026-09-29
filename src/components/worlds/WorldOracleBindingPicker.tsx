import ClearIcon from "@mui/icons-material/Clear";
import SearchIcon from "@mui/icons-material/Search";
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  FormControlLabel,
  IconButton,
  InputAdornment,
  Stack,
  Switch,
  TextField,
  Tooltip,
} from "@mui/material";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { DialogTitleWithCloseButton } from "components/DialogTitleWithCloseButton";

import {
  getFrozenWorldOracleBinding,
  pinWorldOracleChoice,
} from "lib/worldOracleCatalog";

import type { OracleBinding } from "services/worldFieldDefinitions.service";

import { WorldOracleTreePicker } from "./WorldOracleTreePicker";
import { useWorldOracleContext } from "./worldOracleContext";

// A read-only field showing the bound oracle. Choosing opens a searchable
// dialog; the clear button removes the binding (and so the roll button).
export function WorldOracleBindingPicker({
  worldId,
  value,
  onChange,
  label,
  disabled = false,
}: {
  worldId: string;
  value: OracleBinding | null;
  onChange: (value: OracleBinding | null) => void;
  label?: string;
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
  const unavailable = disabled || context.loading || !!context.error;
  const fieldLabel = label ?? t("worlds.fields.oracle", "Oracle");
  const chooseLabel = t("worlds.fields.choose-oracle", "Choose oracle");
  const removeLabel = t("worlds.fields.remove-binding", "Remove oracle");
  return (
    <Stack spacing={1} useFlexGap>
      <TextField
        fullWidth
        label={fieldLabel}
        value={
          selected?.label ??
          (value
            ? t("worlds.fields.unavailable-oracle", "Unavailable oracle")
            : "")
        }
        placeholder={t("worlds.fields.no-oracle", "No oracle (no roll button)")}
        disabled={disabled}
        error={!context.loading && !!catalog && !!value && !selected}
        onClick={() => !unavailable && setChoosing(true)}
        slotProps={{
          inputLabel: { shrink: true },
          input: {
            readOnly: true,
            sx: { cursor: unavailable ? undefined : "pointer" },
            endAdornment: (
              <InputAdornment position="end">
                {value && !disabled && (
                  <Tooltip title={removeLabel}>
                    <IconButton
                      aria-label={removeLabel}
                      edge="end"
                      onClick={(event) => {
                        event.stopPropagation();
                        onChange(null);
                      }}
                    >
                      <ClearIcon />
                    </IconButton>
                  </Tooltip>
                )}
                <Tooltip title={chooseLabel}>
                  <span>
                    <IconButton
                      aria-label={chooseLabel}
                      edge="end"
                      disabled={unavailable}
                      onClick={(event) => {
                        event.stopPropagation();
                        setChoosing(true);
                      }}
                    >
                      <SearchIcon />
                    </IconButton>
                  </span>
                </Tooltip>
              </InputAdornment>
            ),
          },
        }}
      />
      {value && (
        <FormControlLabel
          sx={{ alignSelf: "flex-start" }}
          control={
            <Switch
              size="small"
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
          slotProps={{ typography: { variant: "body2" } }}
        />
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
      {choosing && catalog && (
        <Dialog open fullWidth maxWidth="sm" onClose={() => setChoosing(false)}>
          <DialogTitleWithCloseButton onClose={() => setChoosing(false)}>
            {chooseLabel}
          </DialogTitleWithCloseButton>
          <DialogContent>
            <Stack spacing={1.5} useFlexGap sx={{ pt: 1 }}>
              <WorldOracleTreePicker
                catalog={catalog}
                allPackages={context.allPackages}
                exact={!!value?.exact}
                selectedId={value?.oracleId}
                disabled={unavailable}
                onSelect={(choice) => {
                  onChange(pinWorldOracleChoice(choice, value?.exact));
                  setChoosing(false);
                }}
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={context.allPackages}
                    onChange={(_, checked) => context.setAllPackages(checked)}
                  />
                }
                label={t(
                  "worlds.fields.all-packages",
                  "Include all packages, not just this world's rules",
                )}
              />
              {!!catalog.missingPackageIds.length && (
                <Alert severity="warning">
                  {t(
                    "worlds.fields.missing-packages",
                    "Unavailable packages: {{packages}}",
                    { packages: catalog.missingPackageIds.join(", ") },
                  )}
                </Alert>
              )}
              {Object.entries(catalog.collisions).map(([id, candidates]) => (
                <Alert key={id} severity="warning">
                  {t(
                    "worlds.fields.replacement-collision",
                    "Multiple oracles replace {{id}}. The deterministic choice is {{choice}}.",
                    {
                      id:
                        catalog.choices.find((choice) => choice.id === id)
                          ?.label ?? id,
                      choice:
                        catalog.choices.find(
                          (choice) => choice.id === candidates[0],
                        )?.label ?? candidates[0],
                    },
                  )}
                </Alert>
              ))}
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button color="inherit" onClick={() => setChoosing(false)}>
              {t("common.cancel", "Cancel")}
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Stack>
  );
}
