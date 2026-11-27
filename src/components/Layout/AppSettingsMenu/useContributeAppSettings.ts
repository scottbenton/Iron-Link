import { useEffect } from "react";

import {
  AppSettingsContribution,
  useAppSettingsMenuStore,
} from "stores/appSettingsMenu.store";

/**
 * Adds a page's settings to the app's one settings menu while the page is
 * mounted. Pass a memoized contribution, or null while it is loading.
 */
export function useContributeAppSettings(
  contribution: AppSettingsContribution | null,
) {
  const setContribution = useAppSettingsMenuStore(
    (state) => state.setContribution,
  );
  const clearContribution = useAppSettingsMenuStore(
    (state) => state.clearContribution,
  );

  useEffect(() => {
    if (!contribution) return;
    setContribution(contribution);
    return () => clearContribution(contribution);
  }, [contribution, setContribution, clearContribution]);
}
