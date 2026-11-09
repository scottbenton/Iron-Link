import { ReactNode, Ref } from "react";
import { useTranslation } from "react-i18next";

import { useRollSummaryNames } from "hooks/useRollSummary";

import { getRollSummary, getRollTitle } from "lib/rollSummary.lib";

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
  // Shows a named dismiss button.
  onDismiss?: () => void;
  dismissButtonRef?: Ref<HTMLButtonElement>;
  // Read before the roll's summary (who rolled it, and when).
  summaryPrefix?: string;
  actions?: ReactNode;
}

export function RollSnackbar(props: RollSnackbarProps) {
  const {
    rollId,
    roll,
    isExpanded,
    onDismiss,
    dismissButtonRef,
    summaryPrefix,
    actions,
  } = props;
  const { t } = useTranslation();

  const names = useRollSummaryNames(roll);
  const summary = getRollSummary(roll, names, t);

  return (
    <RollCard
      summary={summaryPrefix ? `${summaryPrefix} ${summary}` : summary}
      isExpanded={isExpanded}
      actions={actions}
      onDismiss={onDismiss}
      dismissLabel={t("datasworn.roll-card.dismiss", "Dismiss {{rollName}}", {
        rollName: getRollTitle(roll, names),
      })}
      dismissButtonRef={dismissButtonRef}
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
