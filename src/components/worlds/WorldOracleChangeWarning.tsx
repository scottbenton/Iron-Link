import { Alert } from "@mui/material";
import { useTranslation } from "react-i18next";

// Release guard: linking, unlinking or changing a linked game's playset can
// change which oracles a world's fields roll. Preview and resolve oracle
// target changes (#236) replaces this warning with a real preview.
export function WorldOracleChangeWarning() {
  const { t } = useTranslation();
  return (
    <Alert severity="warning" variant="outlined" sx={{ py: 0 }}>
      {t(
        "worlds.game.oracle-change-warning",
        "Some world fields may roll different oracles.",
      )}
    </Alert>
  );
}
