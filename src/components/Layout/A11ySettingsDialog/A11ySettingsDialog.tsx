import { useCallback, useId } from "react";
import { useTranslation } from "react-i18next";

import {
  Dialog,
  DialogActions,
  DialogBody,
  DialogDoneButton,
  DialogHeader,
} from "ui/components/Dialog";
import { Radio, RadioGroup } from "ui/components/RadioGroup";
import { Text } from "ui/components/Text";
import { Stack } from "ui/primitives";

import {
  ModifierKeys,
  useAccessibilityState,
} from "stores/accessibility.store";
import { useSetAnnouncement } from "stores/appState.store";

import { KeybindingsTable } from "./KeybindingsTable";
import { useKeyCapture } from "./useKeyCapture";

export interface A11ySettingsDialogProps {
  open: boolean;
  onClose: () => void;
}

const NO_MODIFIER = "disabled";

export function A11ySettingsDialog(props: A11ySettingsDialogProps) {
  const { open, onClose } = props;

  const { t } = useTranslation();
  const headingId = useId();

  const modifierKey = useAccessibilityState((store) => store.modifierKey);
  const setModifierKey = useAccessibilityState((store) => store.setModifierKey);
  const keybinds = useAccessibilityState((store) => store.keybinds);
  const setKeybind = useAccessibilityState((store) => store.setKeybind);

  const setAnnouncement = useSetAnnouncement();

  const handleCapture = useCallback(
    (actionKey: string, key: string) => {
      setKeybind(actionKey, key);
      setAnnouncement(t("a11y.key-set", "Key set to {{key}}", { key }));
    },
    [setKeybind, setAnnouncement, t],
  );
  const { listeningFor, listenFor } = useKeyCapture(open, handleCapture);

  return (
    <Dialog open={open} onClose={onClose} size="md">
      <DialogHeader
        title={t("iron-link.a11y-settings", "Accessibility Settings")}
      />
      <DialogBody>
        <Stack gap="4">
          <Text variant="h3" as="h3" id={headingId}>
            {t("a11y.keybindings", "Keybindings")}
          </Text>
          <RadioGroup
            label={t("a11y.modifier-key", "Modifier Key")}
            description={t(
              "a11y.modifier-key-description",
              "Choose a modifier key to use for game focus shortcuts.",
            )}
            value={modifierKey ?? NO_MODIFIER}
            onValueChange={(value) =>
              setModifierKey(
                value === NO_MODIFIER ? undefined : (value as ModifierKeys),
              )
            }
          >
            <Radio
              value={NO_MODIFIER}
              label={t("a11y.modifier.disabled", "Disabled")}
            />
            <Radio
              value={ModifierKeys.Control}
              label={t("a11y.modifier.ctrl", "Ctrl")}
            />
            <Radio
              value={ModifierKeys.Alt}
              label={t("a11y.modifier.alt", "Alt/Option")}
            />
            <Radio
              value={ModifierKeys.Meta}
              label={t("a11y.modifier.meta", "Win/Command")}
            />
          </RadioGroup>
          <KeybindingsTable
            labelId={headingId}
            modifierKey={modifierKey}
            keybinds={keybinds}
            listeningFor={listeningFor}
            onListen={listenFor}
          />
        </Stack>
      </DialogBody>
      <DialogActions>
        <DialogDoneButton />
      </DialogActions>
    </Dialog>
  );
}
