import { ReactNode } from "react";

import { RollType } from "repositories/shared.types";

import { IGameLogRoll } from "services/gameLog.service";

import { OracleRollSnackbar } from "./OracleRollSnackbar";
import { StatRollSnackbar } from "./StatRollSnackbar";
import { TrackProgressRollSnackbar } from "./TrackProgressRollSnackbar";
import { RollCard } from "./common";

export interface RollSnackbarProps {
  rollId: string | undefined;
  roll: IGameLogRoll;
  isExpanded: boolean;
  onSnackbarClick?: () => void;
  actions?: ReactNode;
}

export function RollSnackbar(props: RollSnackbarProps) {
  const { rollId, roll, isExpanded, onSnackbarClick, actions } = props;

  return (
    <RollCard
      onClick={onSnackbarClick}
      isExpanded={isExpanded}
      actions={actions}
    >
      <>
        {roll.type === RollType.Stat && (
          <StatRollSnackbar
            rollId={rollId}
            roll={roll}
            isExpanded={isExpanded}
          />
        )}
        {roll.type === RollType.OracleTable && (
          <OracleRollSnackbar
            rollId={rollId}
            roll={roll}
            isExpanded={isExpanded}
          />
        )}
        {(roll.type === RollType.TrackProgress ||
          roll.type === RollType.SpecialTrackProgress) && (
          <TrackProgressRollSnackbar
            rollId={rollId}
            roll={roll}
            isExpanded={isExpanded}
          />
        )}
      </>
    </RollCard>
  );
}
