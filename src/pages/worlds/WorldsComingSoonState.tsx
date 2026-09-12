import { useTranslation } from "react-i18next";

import { EmptyState } from "components/Layout/EmptyState";

// Shown on every world route while the "worlds" advanced feature toggle is
// off, so the routes stay mounted but reveal nothing in-progress.
export function WorldsComingSoonState() {
  const { t } = useTranslation();

  return (
    <EmptyState
      title={t("worlds.emptyState.title", "Coming Soon!")}
      message={t(
        "worlds.emptyState.description",
        "Worlds are not yet available in the beta version.",
      )}
    />
  );
}
