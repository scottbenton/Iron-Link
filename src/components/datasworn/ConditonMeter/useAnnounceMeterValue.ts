import { useCallback } from "react";
import { useTranslation } from "react-i18next";

import { useSetAnnouncement } from "stores/appState.store";

import { formatSignedValue } from "lib/formatSignedValue";

/** Politely tells screen reader users a meter's new value after a change. */
export function useAnnounceMeterValue() {
  const { t } = useTranslation();
  const announce = useSetAnnouncement();

  return useCallback(
    (label: string, value: number) => {
      announce(
        t("datasworn.meter-value-announcement", "{{label}} is now {{value}}", {
          label,
          value: formatSignedValue(value),
        }),
      );
    },
    [announce, t],
  );
}
