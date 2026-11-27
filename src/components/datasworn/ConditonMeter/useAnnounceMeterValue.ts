import { useCallback } from "react";
import { useTranslation } from "react-i18next";

import { getMeterStrings } from "ui/game/ConditionMeter/meterStrings";

import { useSetAnnouncement } from "stores/appState.store";

import { formatSignedValue } from "lib/formatSignedValue";

/** Politely tells screen reader users a meter's new value after a change. */
export function useAnnounceMeterValue() {
  const { t } = useTranslation();
  const announce = useSetAnnouncement();

  return useCallback(
    (label: string, value: number) => {
      announce(getMeterStrings(t).changed(label, formatSignedValue(value)));
    },
    [announce, t],
  );
}
