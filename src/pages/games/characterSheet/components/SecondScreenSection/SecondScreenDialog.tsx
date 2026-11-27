import { useTranslation } from "react-i18next";

import {
  Dialog,
  DialogActions,
  DialogBody,
  DialogDoneButton,
  DialogHeader,
} from "ui/components/Dialog";

import { SecondScreenSectionSettings } from "./SecondScreenSection";

export interface SecondScreenDialogProps {
  open: boolean;
  onClose: () => void;
}

/**
 * The second screen's settings from the settings menu. Phones have no
 * Reference column to hold its tab, so this is their way in.
 */
export function SecondScreenDialog(props: SecondScreenDialogProps) {
  const { open, onClose } = props;
  const { t } = useTranslation();
  return (
    <Dialog open={open} onClose={onClose} size="md" fullScreenOnMobile>
      <DialogHeader title={t("game.second-screen.title", "Second Screen")} />
      <DialogBody>
        <SecondScreenSectionSettings open={open} hideTitle />
      </DialogBody>
      <DialogActions>
        <DialogDoneButton />
      </DialogActions>
    </Dialog>
  );
}
