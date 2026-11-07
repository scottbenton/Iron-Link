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
import { MoveTree } from "components/datasworn/MoveTree";
import { OracleTree } from "components/datasworn/OracleTree";
import { TreeLinkMode } from "components/datasworn/_helpers/treeLinkMode";

import { useRollOracleAndAddToLog } from "pages/games/hooks/useRollOracleAndAddToLog";

import {
  referenceDetailMaxWidth,
  referenceListWidth,
} from "../data/referenceLayout";
import {
  getPackageIdFromDataswornId,
  getReferenceItemHref,
  getReferenceSectionHref,
} from "../data/referencePaths";
import { ReferenceTab } from "../data/referenceTabs";
import {
  isPackageShown,
  useReferenceSettings,
} from "../stores/referenceSettings.store";
import { ReferenceSourcesMenu } from "./ReferenceSourcesMenu";

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

  const overrides = useReferenceSettings(
    (state) => state.sourceVisibility[tab.id],
  );
  // The open item's own source shows too, even if it's turned off, so the
  // list can mark what's open.
  const openPackageId = selectedId
    ? getPackageIdFromDataswornId(selectedId)
    : undefined;
  const isSourceVisible = useCallback(
    (id: string) => {
      const packageId = getPackageIdFromDataswornId(id);
      return (
        (!!packageId && packageId === openPackageId) ||
        isPackageShown(tab, section, packageId, overrides)
      );
    },
    [tab, section, overrides, openPackageId],
  );

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

  const linkMode = useMemo<TreeLinkMode>(
    () => ({
      getHref: getReferenceItemHref,
      selectedId,
      isVisible: isSourceVisible,
      packageOrder: tab.packageIds,
      renderItemAction: section === "oracles" ? renderItemAction : undefined,
    }),
    [selectedId, isSourceVisible, tab.packageIds, section, renderItemAction],
  );

  const tree = (
    <Box>
      <Box
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        gap={1}
        px={2}
        py={1}
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
      <nav
        aria-label={
          section === "moves"
            ? t("reference.moves.list-label", "Moves")
            : t("reference.oracles.list-label", "Oracles")
        }
      >
        {section === "moves" ? (
          <MoveTree linkMode={linkMode} />
        ) : (
          <OracleTree linkMode={linkMode} />
        )}
      </nav>
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

  const detailContent = detail ?? emptyDetail;

  if (isSmall) {
    if (detail) {
      // Oracle tables bleed 24px past their container on a phone to sit
      // edge to edge, so the page needs that much padding or it scrolls
      // sideways.
      return (
        <Box px={3} py={2}>
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

  // Like a game's sheet: the list on the side panel colour, the open item on
  // the page.
  return (
    <Box
      display="grid"
      gridTemplateColumns={`${referenceListWidth}px minmax(0, 1fr)`}
      alignItems="stretch"
      flexGrow={1}
    >
      <Box
        sx={(theme) => ({
          bgcolor: "background.default",
          borderLeft: `1px solid ${theme.palette.divider}`,
          borderRight: `1px solid ${theme.palette.divider}`,
        })}
      >
        <Box
          sx={{
            position: "sticky",
            top: 0,
            maxHeight: "100vh",
            overflowY: "auto",
          }}
        >
          {tree}
        </Box>
      </Box>
      <Box minWidth={0} px={3} pt={2} pb={4}>
        <Box maxWidth={referenceDetailMaxWidth}>{detailContent}</Box>
      </Box>
    </Box>
  );
}
