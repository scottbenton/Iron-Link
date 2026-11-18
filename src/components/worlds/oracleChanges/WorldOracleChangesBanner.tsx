import { Alert, Button, Stack } from "@mui/material";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { useSnackbar } from "providers/SnackbarProvider";

import { LinkComponent } from "components/LinkComponent";

import { useGameIdOptional } from "pages/games/gamePageLayout/hooks/useGameId";

import { useSetAnnouncement } from "stores/appState.store";
import { useWorldCategoriesStore } from "stores/worldCategories.store";
import {
  useWorldOracleBannerChanges,
  useWorldOracleChangesStore,
} from "stores/worldOracleChanges.store";

import type { WorldNavigation, WorldView } from "../worldNavigation";

export interface WorldOracleChangesBannerProps {
  navigation: WorldNavigation;
}

// Inside a game, tells its people when world fields started rolling
// different oracles because of another game's rules (or a rules update).
// Review opens the settings that flag them; Dismiss hides the banner in this
// game until something else changes. Only world editors and Guides load
// changes, so nobody else ever sees it.
export function WorldOracleChangesBanner(props: WorldOracleChangesBannerProps) {
  const { navigation } = props;
  const { t } = useTranslation();
  const gameId = useGameIdOptional();
  const changes = useWorldOracleBannerChanges(gameId);
  const dismissChanges = useWorldOracleChangesStore(
    (store) => store.dismissChanges,
  );
  const fields = useWorldCategoriesStore((store) => store.fieldDefinitions);
  const announce = useSetAnnouncement();
  const { error } = useSnackbar();
  const [dismissing, setDismissing] = useState(false);

  if (!gameId || !changes.length) return null;

  const fieldIds = new Set(changes.map((change) => change.fieldId));
  const categoryIds = new Set(
    [...fieldIds].map((fieldId) => fields[fieldId]?.categoryId),
  );
  const [onlyCategoryId] = [...categoryIds];
  // One category's settings when every field is in it, else the list.
  const reviewView: WorldView =
    categoryIds.size === 1 && onlyCategoryId
      ? { type: "category-settings", categoryId: onlyCategoryId }
      : { type: "settings" };

  const handleDismiss = () => {
    setDismissing(true);
    dismissChanges(gameId)
      .then(() => {
        announce(
          t(
            "worlds.oracle-changes.banner-dismissed",
            "Oracle changes dismissed",
          ),
        );
      })
      .catch(() => {
        error(
          t(
            "worlds.oracle-changes.banner-dismiss-failed",
            "Could not dismiss the oracle changes",
          ),
        );
      })
      .finally(() => setDismissing(false));
  };

  return (
    <Alert
      severity="info"
      action={
        <Stack direction="row" spacing={1}>
          <Button
            color="inherit"
            LinkComponent={LinkComponent}
            {...navigation.getLinkProps(reviewView)}
          >
            {t("worlds.oracle-changes.review", "Review")}
          </Button>
          <Button color="inherit" onClick={handleDismiss} disabled={dismissing}>
            {t("worlds.oracle-changes.dismiss", "Dismiss")}
          </Button>
        </Stack>
      }
    >
      {t(
        "worlds.oracle-changes.banner",
        "{{count}} world fields now roll different oracles",
        {
          count: fieldIds.size,
          defaultValue_one: "1 world field now rolls a different oracle",
        },
      )}
    </Alert>
  );
}
