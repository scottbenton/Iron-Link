import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import RollIcon from "@mui/icons-material/Casino";
import {
  Box,
  Button,
  IconButton,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import React, { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";

import { LinkComponent } from "components/LinkComponent";

import { useRollOracleAndAddToLog } from "pages/games/hooks/useRollOracleAndAddToLog";

import { useDataswornTreeStore } from "stores/dataswornTree.store";

import { askTheOracleCollection } from "data/askTheOracle";

import {
  getPackageIdFromDataswornId,
  getReferenceItemHref,
  getReferenceSectionHref,
} from "../data/referencePaths";
import { ReferenceTab } from "../data/referenceTabs";
import { ReferenceTreeCollection } from "../data/referenceTreeFilter";
import {
  isPackageShown,
  useReferenceSettings,
} from "../stores/referenceSettings.store";
import { ReferenceSourcesMenu } from "./ReferenceSourcesMenu";
import { ReferenceTree, ReferenceTreeGroup } from "./ReferenceTree";

export interface ReferenceBrowseSectionProps {
  tab: ReferenceTab;
  section: "moves" | "oracles";
  selectedId: string | undefined;
  // The open item's page, or the not found message. Undefined on the list.
  detail: React.ReactNode | undefined;
}

// Moves and oracles: the list beside the open item. On a phone it's one or the
// other, with a link back to the list.
export function ReferenceBrowseSection(props: ReferenceBrowseSectionProps) {
  const { tab, section, selectedId, detail } = props;
  const { t } = useTranslation();
  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down("md"));

  const moves = useDataswornTreeStore((store) => store.moves);
  const oracles = useDataswornTreeStore((store) => store.oracles);

  const overrides = useReferenceSettings(
    (state) => state.sourceVisibility[tab.id],
  );
  const isSourceVisible = useCallback(
    (id: string) =>
      isPackageShown(tab, section, getPackageIdFromDataswornId(id), overrides),
    [tab, section, overrides],
  );

  const { groups, collectionMap } = useMemo(() => {
    const rootCollections =
      section === "moves"
        ? moves.rootMoveCategories
        : oracles.rootOracleCollections;
    const packageOrder = (id: string) => {
      const index = tab.packageIds.indexOf(id);
      return index < 0 ? tab.packageIds.length : index;
    };
    const groups: ReferenceTreeGroup[] = Object.entries(rootCollections)
      .sort(([a], [b]) => packageOrder(a) - packageOrder(b))
      .map(([id, { title, rootCollectionIds }]) => ({
        id,
        title,
        rootCollectionIds,
      }));
    if (section === "oracles") {
      groups.unshift({
        id: "ask_the_oracle",
        rootCollectionIds: [askTheOracleCollection._id],
      });
    }
    // Moves, oracles and assets all fit the tree's shape.
    const collectionMap = (section === "moves"
      ? moves.moveCategoryMap
      : oracles.oracleCollectionMap) as unknown as Record<
      string,
      ReferenceTreeCollection
    >;
    return { groups, collectionMap };
  }, [section, moves, oracles, tab.packageIds]);

  const rollOracle = useRollOracleAndAddToLog();

  const renderItemAction = useCallback(
    (item: { _id: string; name: string }) => {
      if (!item._id.startsWith("oracle_rollable:")) return null;
      return (
        <Tooltip title={t("reference.oracles.quick-roll", "Roll")}>
          <IconButton
            edge="end"
            aria-label={t("reference.oracles.roll-named", "Roll {{name}}", {
              name: item.name,
            })}
            onClick={() => rollOracle(item._id)}
          >
            <RollIcon />
          </IconButton>
        </Tooltip>
      );
    },
    [rollOracle, t],
  );

  const getHref = useCallback((id: string) => getReferenceItemHref(id), []);

  const tree = (
    <Box>
      <Box
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        gap={1}
        mb={1}
      >
        <Typography
          variant="h6"
          component="h2"
          fontFamily={(theme) => theme.typography.fontFamilyTitle}
          textTransform="uppercase"
        >
          {section === "moves"
            ? t("reference.moves.heading", "Moves")
            : t("reference.oracles.heading", "Oracles")}
        </Typography>
        <ReferenceSourcesMenu tab={tab} section={section} />
      </Box>
      <ReferenceTree
        label={
          section === "moves"
            ? t("reference.moves.list-label", "Moves")
            : t("reference.oracles.list-label", "Oracles")
        }
        searchLabel={
          section === "moves"
            ? t("reference.moves.search", "Search moves")
            : t("reference.oracles.search", "Search oracles")
        }
        groups={groups}
        collectionMap={collectionMap}
        selectedId={selectedId}
        isSourceVisible={isSourceVisible}
        getHref={getHref}
        renderItemAction={section === "oracles" ? renderItemAction : undefined}
        emptyMessage={t("reference.no-matches", "Nothing matches your search")}
      />
    </Box>
  );

  const emptyDetail = (
    <Typography color="text.secondary" sx={{ mt: 2 }}>
      {section === "moves"
        ? t(
            "reference.moves.pick",
            "Pick a move to read it, roll it or copy a link to it.",
          )
        : t(
            "reference.oracles.pick",
            "Pick an oracle to see its table, or roll one straight from the list.",
          )}
    </Typography>
  );

  if (isSmall) {
    if (detail) {
      return (
        <Box>
          <Button
            LinkComponent={LinkComponent}
            href={getReferenceSectionHref(tab.id, section)}
            startIcon={<ArrowBackIcon />}
            color="inherit"
            sx={{ mb: 1 }}
          >
            {section === "moves"
              ? t("reference.moves.back", "All moves")
              : t("reference.oracles.back", "All oracles")}
          </Button>
          {detail}
        </Box>
      );
    }
    return tree;
  }

  return (
    <Box
      display="grid"
      gridTemplateColumns="minmax(260px, 340px) minmax(0, 1fr)"
      gap={3}
      alignItems="start"
    >
      <Box
        sx={{
          position: "sticky",
          top: 16,
          maxHeight: "calc(100vh - 32px)",
          overflowY: "auto",
        }}
      >
        {tree}
      </Box>
      <Box minWidth={0}>{detail ?? emptyDetail}</Box>
    </Box>
  );
}
