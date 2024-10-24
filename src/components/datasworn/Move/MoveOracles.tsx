import { useTranslation } from "react-i18next";
import { Datasworn } from "@datasworn/core";
import { Box, Button } from "@mui/material";

import { OracleTable } from "../Oracle/OracleTable";
import { useRollOracleAndAddToLog } from "pages/games/hooks/useRollOracleAndAddToLog";

export interface MoveOraclesProps {
  move: Datasworn.Move;
}
export function MoveOracles(props: MoveOraclesProps) {
  const { move } = props;
  const oracles = move.oracles;

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
