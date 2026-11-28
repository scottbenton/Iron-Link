import { PropsWithChildren, useCallback, useState } from "react";

import { RollType } from "repositories/shared.types";

import { IGameLogRoll, IStatRoll } from "services/gameLog.service";

import { DieRerollDialog } from "./DieRerollDialog";
import { RecentRollToasts } from "./RecentRollToasts";
import { RollRerollContext } from "./rollRerollContext";

/**
 * Wraps the app's pages with the recent roll cards: the toasts, and the
 * reroll dialog their Reroll opens. The dialog lives here so that it stays
 * open while its own card steps aside for it.
 */
export function RecentRolls(props: PropsWithChildren) {
  const { children } = props;
  const [reroll, setReroll] = useState<{ rollId: string; roll: IStatRoll }>();
  const [isRerollOpen, setIsRerollOpen] = useState(false);

  const openReroll = useCallback((rollId: string, roll: IGameLogRoll) => {
    if (roll.type !== RollType.Stat) return;
    setReroll({ rollId, roll });
    setIsRerollOpen(true);
  }, []);

  return (
    <RollRerollContext.Provider value={openReroll}>
      {children}
      <RecentRollToasts />
      {reroll && (
        <DieRerollDialog
          key={reroll.rollId}
          open={isRerollOpen}
          handleClose={() => setIsRerollOpen(false)}
          rollId={reroll.rollId}
          roll={reroll.roll}
        />
      )}
    </RollRerollContext.Provider>
  );
}
