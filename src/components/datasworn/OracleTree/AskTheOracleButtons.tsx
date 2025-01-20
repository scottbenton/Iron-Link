import { Typography } from "@mui/material";
import { Box, Button } from "@mui/material";
import { useTranslation } from "react-i18next";

import { useGamePermissions } from "pages/games/gamePageLayout/hooks/usePermissions";
import { useRollOracleAndAddToLog } from "pages/games/hooks/useRollOracleAndAddToLog";

import { GamePermission } from "stores/game.store";

import { askTheOracleIds, askTheOracleLabels } from "data/askTheOracle";

export function AskTheOracleButtons() {
  const rollOracleTable = useRollOracleAndAddToLog();
  const isGuide = useGamePermissions().gamePermission === GamePermission.Guide;

  const { t } = useTranslation();

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      bgcolor={(theme) =>
        theme.palette.mode === "light" ? "grey.300" : "grey.800"
      }
      borderBottom={(theme) => `1px solid ${theme.palette.divider}`}
    >
      <Typography fontFamily="fontFamilyTitle" color="text.secondary">
        {t("datasworn.ask-the-oracle", "Ask the Oracle")}
      </Typography>
      <Box
        display="flex"
        alignItems="center"
        flexWrap="wrap"
        justifyContent="center"
      >
        {askTheOracleIds.map((oracleKey) => (
          <Button
            key={oracleKey}
            size={"small"}
            color={"inherit"}
            sx={(theme) => ({
              fontFamily: theme.typography.fontFamilyTitle,
              lineHeight: 1,
              minHeight: 32,
              minWidth: 0,
              px: 1,
            })}
            onClick={() => rollOracleTable(oracleKey, isGuide)}
          >
            {askTheOracleLabels[oracleKey]}
          </Button>
        ))}
      </Box>
    </Box>
  );
}
