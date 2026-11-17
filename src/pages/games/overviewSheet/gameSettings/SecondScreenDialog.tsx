import { Dialog, DialogContent } from "@mui/material";
import { useTranslation } from "react-i18next";

import { DialogTitleWithCloseButton } from "components/DialogTitleWithCloseButton";

import { SecondScreenSectionSettings } from "pages/games/characterSheet/components/SecondScreenSection";

import { useIsMobile } from "hooks/useIsMobile";

export interface SecondScreenDialogProps {
  open: boolean;
  onClose: () => void;
}

// The Second Screen settings on phones, which have no Reference panel tab for
// them. Wider screens keep the tab.
export function SecondScreenDialog(props: SecondScreenDialogProps) {
  const { open, onClose } = props;
  const { t } = useTranslation();
  const isMobile = useIsMobile();

  return (
    <Dialog open={open} onClose={onClose} fullScreen={isMobile} fullWidth>
      <DialogTitleWithCloseButton onClose={onClose}>
        {t("game.second-screen.title", "Second Screen")}
      </DialogTitleWithCloseButton>
      <DialogContent sx={{ px: 1 }}>
        {/* Mounted only while open, so the preview measures its width once
            the dialog has laid out. */}
        <SecondScreenSectionSettings open={open} showHeading={false} />
      </DialogContent>
    </Dialog>
  );
}
