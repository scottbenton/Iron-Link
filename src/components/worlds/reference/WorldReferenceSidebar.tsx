import { Alert, Box, Button, LinearProgress, Typography } from "@mui/material";
import { ReactNode, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { ScreenReaderOnly } from "components/ScreenReaderOnly";
import { OracleTree } from "components/datasworn/OracleTree";

import { useWorldOracles } from "hooks/useWorldOracles";

import { useDataswornTreeStore } from "stores/dataswornTree.store";
import { useWorldPermission } from "stores/world.store";
import { useWorldCategoriesStore } from "stores/worldCategories.store";

import type { WorldOracleCatalog } from "lib/worldOracleCatalog";
import {
  getCategoryBoundOracles,
  getWorldReferenceRules,
} from "lib/worldReference";

import { isGuideEquivalent } from "repositories/shared.types";

export interface WorldReferenceSidebarProps {
  worldId: string;
  // The open category, whose bound oracles are listed first.
  categoryId?: string;
  headingId?: string;
  // Beside the heading, such as a button that collapses the sidebar.
  headingAction?: ReactNode;
  // On phones the sidebar is a tab panel, so the tab names it on screen and
  // the heading is for screen readers.
  hideHeading?: boolean;
}

// The Worlds page's Reference: the oracles of the world's effective playset,
// the open category's bound ones first. Rolls work as they do in a game,
// without a game log to write to: the result shows in a roll card.
export function WorldReferenceSidebar(props: WorldReferenceSidebarProps) {
  const { worldId, categoryId, headingId, headingAction, hideHeading } = props;
  const { t } = useTranslation();

  const { catalog, error, retry } = useWorldOracles(worldId);
  const ready = useWorldReferenceRules(catalog);

  const permission = useWorldPermission();
  const isGuide = !!permission && isGuideEquivalent(permission);
  const bound = useWorldCategoriesStore((store) =>
    categoryId && store.worldId === worldId
      ? getCategoryBoundOracles(
          Object.values(store.fieldDefinitions),
          categoryId,
          isGuide,
        )
      : [],
  );
  const featured = useMemo(
    () =>
      bound.length > 0
        ? {
            title: t(
              "worlds.reference.bound-to-category",
              "Bound to this category",
            ),
            oracles: bound.map(({ oracleId, fieldLabels }) => ({
              oracleId,
              description: fieldLabels.join(", "),
            })),
          }
        : undefined,
    [bound, t],
  );

  const heading = (
    <Typography
      id={headingId}
      component={"h2"}
      fontFamily={"fontFamilyTitle"}
      textTransform={"uppercase"}
    >
      {t("character.reference-sidebar-title", "Reference")}
    </Typography>
  );

  return (
    <>
      {hideHeading ? (
        <ScreenReaderOnly>{heading}</ScreenReaderOnly>
      ) : (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 1,
            px: 2,
            pt: 2,
            pb: 1,
            minHeight: 56,
            flexShrink: 0,
          }}
        >
          {heading}
          {headingAction}
        </Box>
      )}
      <Box sx={{ flexGrow: 1, minHeight: 0, overflow: "auto" }}>
        {error && !ready ? (
          <Alert
            severity="error"
            sx={{ m: 2 }}
            action={
              <Button color="inherit" size="small" onClick={retry}>
                {t("common.retry", "Retry")}
              </Button>
            }
          >
            {error}
          </Alert>
        ) : ready ? (
          <OracleTree featured={featured} />
        ) : (
          <LinearProgress
            aria-label={t("worlds.reference.loading", "Loading oracles")}
          />
        )}
      </Box>
    </>
  );
}

// Loads the world's oracles into the shared rules store, which the oracle
// tree, its table dialog and its rolls read. A game sets its own rules again
// when it opens. True once the world's rules are in place.
function useWorldReferenceRules(catalog: WorldOracleCatalog | null) {
  const setActiveRules = useDataswornTreeStore((store) => store.setActiveRules);
  const [applied, setApplied] = useState<WorldOracleCatalog | null>(null);

  useEffect(() => {
    if (!catalog) return;
    const { tree, playset } = getWorldReferenceRules(catalog);
    setActiveRules(tree, playset);
    setApplied(catalog);
  }, [catalog, setActiveRules]);

  return !!applied;
}
