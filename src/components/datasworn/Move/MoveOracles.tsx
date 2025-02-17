import { Datasworn } from "@datasworn/core";
import { Box, Button } from "@mui/material";
import { useTranslation } from "react-i18next";

import { useRollOracleAndAddToLog } from "pages/games/hooks/useRollOracleAndAddToLog";

import { OracleTable } from "../Oracle/OracleTable";

export interface MoveOraclesProps {
  move: Datasworn.AnyMove;
}
export function MoveOracles(props: MoveOraclesProps) {
  const { move } = props;

  const oracles = "oracles" in move ? move.oracles : undefined;

  const { t } = useTranslation();
  const rollOracle = useRollOracleAndAddToLog();

  if (!oracles) {
    return null;
  }

  return (
    <Box>
      {Object.entries(oracles).map(([key, oracle]) => (
        <Box mt={1} key={key}>
          <Button
            key={key}
            color="inherit"
            variant="outlined"
            onClick={() => rollOracle(oracle._id, false)}
          >
            {t("datasworn.roll-oracle", "Roll {{oracleName}}", {
              oracleName: oracle.name,
            })}
          </Button>
          <OracleTable oracle={oracle} />
        </Box>
      ))}
    </Box>
  );
}
