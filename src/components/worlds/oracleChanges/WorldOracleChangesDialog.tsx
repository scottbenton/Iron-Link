import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  FormControl,
  FormControlLabel,
  FormLabel,
  LinearProgress,
  Radio,
  RadioGroup,
  Stack,
  Typography,
} from "@mui/material";
import { FormEvent, ReactNode, useState } from "react";
import { useTranslation } from "react-i18next";

import { DialogTitleWithCloseButton } from "components/DialogTitleWithCloseButton";

import { getDialogFormSlotProps } from "lib/dialogForm.lib";
import {
  type WorldOracleChangeChoice,
  type WorldOracleChangeInput,
  getWorldOracleChangeInputs,
  getWorldOracleChangeKey,
} from "lib/worldOracleChanges";

import type { WorldOracleChangePreview } from "services/worldOracleChanges.service";

import {
  getOracleChangeFieldLabel,
  getOracleChangeLabel,
} from "./oracleChangeLabels";

export interface WorldOracleChangesDialogProps {
  title: string;
  description?: ReactNode;
  confirmLabel: string;
  // Null while the previews load.
  previews: WorldOracleChangePreview[] | null;
  previewFailed: boolean;
  onRetry: () => void;
  onClose: () => void;
  // Resolves once saved; rejects to keep the dialog open.
  onConfirm: (changes: WorldOracleChangeInput[]) => Promise<void>;
}

// The one save dialog for linking a world, unlinking it and changing a linked
// game's playset: it lists the world fields whose roll would change and lets
// each keep its old oracle or use the new one. Mount it to open it.
export function WorldOracleChangesDialog(props: WorldOracleChangesDialogProps) {
  const {
    title,
    description,
    confirmLabel,
    previews,
    previewFailed,
    onRetry,
    onClose,
    onConfirm,
  } = props;
  const { t } = useTranslation();
  const [choices, setChoices] = useState<
    Record<string, WorldOracleChangeChoice>
  >({});
  const [saving, setSaving] = useState(false);

  const changed = (previews ?? []).filter(
    (preview) => preview.changes.length > 0,
  );
  const loading = !previews && !previewFailed;
  const ready = !loading && !saving;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!ready) return;
    setSaving(true);
    try {
      await onConfirm(
        getWorldOracleChangeInputs(
          changed.flatMap((preview) => preview.changes),
          choices,
        ),
      );
    } catch {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open
      onClose={saving ? undefined : onClose}
      fullWidth
      maxWidth="sm"
      slotProps={getDialogFormSlotProps(handleSubmit)}
    >
      <DialogTitleWithCloseButton onClose={onClose}>
        {title}
      </DialogTitleWithCloseButton>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          {description && (
            <Typography component="div">{description}</Typography>
          )}
          {loading && (
            <Box role="status">
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {t(
                  "worlds.oracle-changes.checking",
                  "Checking which world fields would roll different oracles",
                )}
              </Typography>
              <LinearProgress />
            </Box>
          )}
          {previewFailed && (
            <Alert
              severity="warning"
              action={
                <Button color="inherit" onClick={onRetry} disabled={saving}>
                  {t("common.retry", "Retry")}
                </Button>
              }
            >
              {t(
                "worlds.oracle-changes.check-failed",
                "Could not check which world fields would roll different oracles. If you save anyway, they will roll the oracles the new rules choose.",
              )}
            </Alert>
          )}
          {changed.length > 0 && (
            <Typography>
              {t(
                "worlds.oracle-changes.intro",
                "These world fields would roll different oracles. Choose what each one rolls.",
              )}
            </Typography>
          )}
          {changed.map((preview) => (
            <Stack key={preview.worldId} spacing={2}>
              {changed.length > 1 && (
                <Typography variant="subtitle2" component="p">
                  {preview.worldName}
                </Typography>
              )}
              {preview.changes.map((change) => {
                const key = getWorldOracleChangeKey(change);
                const fieldLabel = getOracleChangeFieldLabel(
                  t,
                  change.fieldId,
                  change.ruleIndex,
                  preview.configuration.fieldDefinitions,
                  preview.configuration.categories,
                );
                const previous = getOracleChangeLabel(
                  change.previousOracleId,
                  preview.oracleLabels,
                );
                const next = getOracleChangeLabel(
                  change.nextOracleId,
                  preview.oracleLabels,
                );
                return (
                  <FormControl
                    key={key}
                    component="fieldset"
                    disabled={saving}
                    sx={{
                      border: 1,
                      borderColor: "divider",
                      borderRadius: 1,
                      px: 2,
                      py: 1.5,
                    }}
                  >
                    <FormLabel
                      component="legend"
                      sx={{ px: 0.5, color: "text.primary" }}
                    >
                      {fieldLabel}
                    </FormLabel>
                    <RadioGroup
                      value={choices[key] ?? "useNew"}
                      onChange={(_, value) =>
                        setChoices((current) => ({
                          ...current,
                          [key]: value as WorldOracleChangeChoice,
                        }))
                      }
                    >
                      <FormControlLabel
                        value="keep"
                        control={<Radio />}
                        label={
                          <OracleChoiceLabel
                            label={t(
                              "worlds.oracle-changes.keep-old",
                              "Keep the old oracle",
                            )}
                            oracle={previous}
                          />
                        }
                      />
                      <FormControlLabel
                        value="useNew"
                        control={<Radio />}
                        label={
                          <OracleChoiceLabel
                            label={t(
                              "worlds.oracle-changes.use-new",
                              "Use the new oracle",
                            )}
                            oracle={next}
                          />
                        }
                      />
                    </RadioGroup>
                  </FormControl>
                );
              })}
            </Stack>
          ))}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button color="inherit" onClick={onClose} disabled={saving}>
          {t("common.cancel", "Cancel")}
        </Button>
        <Button type="submit" variant="contained" disabled={!ready}>
          {saving ? t("common.saving", "Saving") : confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function OracleChoiceLabel(props: { label: string; oracle: string }) {
  const { label, oracle } = props;
  return (
    <Box sx={{ py: 0.5 }}>
      <Typography component="span" display="block">
        {label}
      </Typography>
      <Typography
        component="span"
        display="block"
        variant="body2"
        color="text.secondary"
        sx={{ overflowWrap: "anywhere" }}
      >
        {oracle}
      </Typography>
    </Box>
  );
}
