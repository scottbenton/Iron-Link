import { Alert } from "@mui/material";
import { useTranslation } from "react-i18next";

import { useGameIdOptional } from "pages/games/gamePageLayout/hooks/useGameId";

import { useWorldOracles } from "hooks/useWorldOracles";

import { useWorldCategoriesStore } from "stores/worldCategories.store";

import { resolveOracleBinding } from "lib/effectivePlayset";

import type { OracleBinding } from "services/worldFieldDefinitions.service";

// Inside a game, world fields roll with that game's rules, so a world shared
// with games using other rules (Starsmith in one, not the other) rolls
// different oracles in each. Says so once, and only when some field
// actually differs.
export function WorldGameRulesNotice(props: { worldId: string }) {
  const { worldId } = props;
  const { t } = useTranslation();
  const gameId = useGameIdOptional();
  const { catalog } = useWorldOracles(worldId);
  const differs = useWorldCategoriesStore((store) => {
    if (!gameId || !catalog || store.worldId !== worldId) return false;
    return Object.values(store.storedFieldDefinitions).some((field) =>
      [field.binding, ...field.configuration.rules.map((rule) => rule.binding)]
        .filter((binding): binding is OracleBinding => !!binding)
        .some(
          (binding) =>
            resolveOracleBinding(binding, catalog.replacementMap) !==
            resolveOracleBinding(binding, catalog.worldReplacementMap),
        ),
    );
  });

  if (!differs) return null;
  return (
    <Alert severity="info">
      {t(
        "worlds.game-rules-notice",
        "This world is shared with games that use other rules, so some of its fields roll different oracles in this game than in those games.",
      )}
    </Alert>
  );
}
