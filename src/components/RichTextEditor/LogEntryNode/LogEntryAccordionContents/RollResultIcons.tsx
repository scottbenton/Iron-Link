import { Box, Tooltip } from "@mui/material";

import { HitIcon } from "assets/HitIcon";
import { MissIcon } from "assets/MissIcon";

import { getRollResultLabel } from "data/rollResultLabel";

import { RollResult } from "repositories/shared.types";

export interface RollResultIconsProps {
  result: RollResult;
}

export function RollResultIcons(props: RollResultIconsProps) {
  const { result } = props;

  const resultLabel = getRollResultLabel(result);
  return (
    <Tooltip title={resultLabel}>
      <Box>
        {result === RollResult.StrongHit && (
          <>
            <HitIcon />
            <HitIcon />
          </>
        )}
        {result === RollResult.WeakHit && (
          <>
            <HitIcon />
            <MissIcon />
          </>
        )}
        {result === RollResult.Miss && (
          <>
            <MissIcon />
            <MissIcon />
          </>
        )}
      </Box>
    </Tooltip>
  );
}
