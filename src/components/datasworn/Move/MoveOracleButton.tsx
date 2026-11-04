import { Datasworn } from "@datasworn-community/core";
import { Button } from "@mui/material";
import { useTranslation } from "react-i18next";

import { useRollOracleAndAddToLog } from "pages/games/hooks/useRollOracleAndAddToLog";

export interface MoveOracleButtonProps {
  oracle: Datasworn.OracleRollable | Datasworn.EmbeddedOracleRollable;
}

export function MoveOracleButton(props: MoveOracleButtonProps) {
  const { oracle } = props;

  const { t } = useTranslation();
  const rollOracle = useRollOracleAndAddToLog();

  return (
    <Button
      color="inherit"
      variant="outlined"
      onClick={() => rollOracle(oracle._id, false)}
    >
      {t("datasworn.roll-oracle", "Roll {{oracleName}}", {
        oracleName: oracle.name,
      })}
    </Button>
  );
}
