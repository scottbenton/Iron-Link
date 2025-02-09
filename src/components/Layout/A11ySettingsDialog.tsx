import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  FormControl,
  FormControlLabel,
  FormLabel,
  Radio,
  RadioGroup,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { TFunction } from "i18next";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";

import { DialogTitleWithCloseButton } from "components/DialogTitleWithCloseButton";

import {
  ModifierKeys,
  useAccessibilityState,
} from "stores/accessibility.store";
import { useAppState } from "stores/appState.store";

export interface A11ySettingsDialogProps {
  open: boolean;
  onClose: () => void;
}

function getActions(t: TFunction): {
  label: string;
  key: string;
}[] {
  return [
    {
      key: "game-bar",
      label: t("a11y.action.game-tabs", "Game Tabs"),
    },
    {
      key: "overview-section",
      label: t(
        "a11y.action.overview-section",
        "Character/Game Overview Sidebar",
      ),
    },
    {
      key: "notes-section",
      label: t("a11y.action.notes-section", "Notes Section"),
    },
    {
      key: "reference-section",
      label: t("a11y.action.reference-section", "Reference Section"),
    },
  ];
}

export function A11ySettingsDialog(props: A11ySettingsDialogProps) {
  const { open, onClose } = props;

  const { t } = useTranslation();

  const modifierKey = useAccessibilityState((store) => store.modifierKey);
  const setModifierKey = useAccessibilityState((store) => store.setModifierKey);
  const keybinds = useAccessibilityState((store) => store.keybinds);
  const setKeybind = useAccessibilityState((store) => store.setKeybind);

  const setAnnouncement = useAppState((state) => state.setAnnouncement);

  const [keySetting, setKeySetting] = useState<string | undefined>();

  const handleSetKey = useCallback(
    (actionKey: string) => {
      setKeySetting(actionKey);
      window.addEventListener(
        "keydown",
        (evt) => {
          const key = evt.key;
          setAnnouncement(
            t("a11y.key-set", "Key set to {{key}}", {
              key,
            }),
          );
          setKeybind(actionKey, key);
          setKeySetting(undefined);
        },
        { once: true },
      );
    },
    [setKeybind, setAnnouncement, t],
  );

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitleWithCloseButton onClose={onClose}>
        {t("iron-link.a11y-settings", "Accessibility Settings")}
      </DialogTitleWithCloseButton>
      <DialogContent sx={{ display: "flex", flexDirection: "column" }}>
        <Typography variant="overline">
          {t("a11y.game-focus-shortcut-keys", "Keybindings")}
        </Typography>
        <FormControl sx={{ mt: 2 }}>
          <FormLabel id="modifier-key-label">
            {t("a11y.modifier-key", "Modifier Key")}
          </FormLabel>
          <Typography color="textSecondary">
            {t(
              "a11y.modifier-key-description",
              "Choose a modifier key to use for game focus shortcuts.",
            )}
          </Typography>
          <RadioGroup
            aria-labelledby="modifier-key-label"
            value={modifierKey ?? "disabled"}
            onChange={(_, value) =>
              setModifierKey(
                value === "disabled" ? undefined : (value as ModifierKeys),
              )
            }
            defaultValue={"disabled"}
            sx={{ mt: 1 }}
          >
            <FormControlLabel
              control={<Radio />}
              value={"disabled"}
              label={t("a11y.modifier.disabled", "Disabled")}
            />
            <FormControlLabel
              control={<Radio />}
              value={ModifierKeys.Control}
              label={t("a11y.modifier.ctrl", "Ctrl")}
            />
            <FormControlLabel
              control={<Radio />}
              value={ModifierKeys.Alt}
              label={t("a11y.modifier.alt", "Alt/Option")}
            />
            <FormControlLabel
              control={<Radio />}
              value={ModifierKeys.Meta}
              label={t("a11y.modifier.meta", "Win/Command")}
            />
          </RadioGroup>
        </FormControl>
        <Box sx={{ mt: 2 }}>
          <Typography>{t("a11y.keybindings", "Keybindings")}</Typography>
          <Table>
            <TableHead>
              <TableCell>{t("a11y.action", "Action")}</TableCell>
              <TableCell>{t("a11y.key", "Key")}</TableCell>
              <TableCell />
            </TableHead>
            <TableBody>
              {getActions(t).map((action) => (
                <TableRow key={action.key}>
                  <TableCell>{action.label}</TableCell>
                  <TableCell>
                    {modifierKey
                      ? `${modifierKey} + ${keybinds[action.key] ?? "None"}`
                      : keybinds[action.key]}
                  </TableCell>
                  <TableCell>
                    <Button onClick={() => handleSetKey(action.key)}>
                      {action.key === keySetting
                        ? t("a11y.current-key-setting", "Listening...")
                        : t("a11y.set-key", "Set")}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button color="primary" variant="contained" onClick={onClose}>
          {t("common.done", "Done")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
