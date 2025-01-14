import { Box, Button, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

import { useSnackbar } from "providers/SnackbarProvider";

import { pathConfig } from "pages/pathConfig";

import { ReferenceSidebarContents } from "../characterSheet/components/ReferenceSidebarContents";
import { useGameId } from "../gamePageLayout/hooks/useGameId";
import { useGamePermissions } from "../gamePageLayout/hooks/usePermissions";

export function GameOverviewSheet() {
  const campaignId = useGameId();
  const { gameType } = useGamePermissions();
  const { t } = useTranslation();

  const { success } = useSnackbar();

  const inviteLink = location.origin + pathConfig.gameJoin(campaignId);
  const handleCopy = () => {
    if (inviteLink) {
      navigator.clipboard.writeText(inviteLink).then(() => {
        success("Copied URL to clipboard");
      });
    }
  };
  return (
    <Box display="flex">
      <Box mt={2}>
        <Typography>{gameType}</Typography>
        <Button onClick={handleCopy}>
          {t("game.copy-invite-link", "Copy Invite Link")}
        </Button>
      </Box>
      <Box>
        <ReferenceSidebarContents />
      </Box>
    </Box>
  );
}
