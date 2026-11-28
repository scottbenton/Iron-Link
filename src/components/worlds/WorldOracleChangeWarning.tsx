import { useTranslation } from "react-i18next";

import { Alert } from "ui/components/Alert";

// Linking, unlinking or changing a linked game's playset can change which
// oracles a world's fields roll: bindings follow the rules in play, so the
// change applies at once. This warning is the notice for it; there is no
// preview or per-field choice (only a binding marked exact stays put).
export function WorldOracleChangeWarning() {
  const { t } = useTranslation();
  return (
    <Alert tone="warning">
      {t(
        "worlds.game.oracle-change-warning",
        "Some world fields may roll different oracles.",
      )}
    </Alert>
  );
}
