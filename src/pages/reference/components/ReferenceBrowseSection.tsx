import React, { useCallback, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";

import { LinkComponent } from "components/LinkComponent";

import { Button } from "ui/components/Button";
import { Text } from "ui/components/Text";
import { ArrowLeftIcon } from "ui/icons";
import { Box, Grid, HStack, Stack } from "ui/primitives";

import { useRollOracleAndAddToLog } from "pages/games/hooks/useRollOracleAndAddToLog";

import { useIsMobile } from "hooks/useIsMobile";

import {
  referenceDetailMaxWidth,
  referenceListWidth,
} from "../data/referenceLayout";
import {
  getPackageIdFromDataswornId,
  getReferenceSectionHref,
} from "../data/referencePaths";
import { ReferenceTab } from "../data/referenceTabs";
import {
  isPackageShown,
  useReferenceSettings,
} from "../stores/referenceSettings.store";
import { ReferenceSourcesMenu } from "./ReferenceSourcesMenu";
import { ReferenceMoveTree, ReferenceOracleTree } from "./ReferenceTree";

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
  const isSmall = useIsMobile();

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

  // The open item starts at its top, as a page would. The list keeps its
  // place.
  const detailRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    detailRef.current?.scrollTo?.({ top: 0 });
  }, [selectedId]);

  const rollOracleAndAddToLog = useRollOracleAndAddToLog();
  const rollOracle = useCallback(
    (oracleId: string) => {
      rollOracleAndAddToLog(oracleId);
    },
    [rollOracleAndAddToLog],
  );

  const treeOptions = {
    selectedId,
    isVisible: isSourceVisible,
    packageOrder: tab.packageIds,
  };

  const tree = (
    <Stack gap="3" paddingInline="4" paddingBlock="3">
      <HStack justifyContent="space-between" gap="2">
        <Text variant="h3" as="h2">
          {section === "moves"
            ? t("reference.moves.heading", "Moves")
            : t("reference.oracles.heading", "Oracles")}
        </Text>
        <ReferenceSourcesMenu tab={tab} section={section} />
      </HStack>
      <nav
        aria-label={
          section === "moves"
            ? t("reference.moves.list-label", "Moves")
            : t("reference.oracles.list-label", "Oracles")
        }
      >
        {section === "moves" ? (
          <ReferenceMoveTree {...treeOptions} />
        ) : (
          <ReferenceOracleTree {...treeOptions} rollOracle={rollOracle} />
        )}
      </nav>
    </Stack>
  );

  const emptyDetail = (
    <Text color="muted" css={{ marginBlockStart: "4" }}>
      {section === "moves"
        ? t(
            "reference.moves.pick",
            "Pick a move to read it, roll it or copy a link to it.",
          )
        : t(
            "reference.oracles.pick",
            "Pick an oracle to see its table, or roll one straight from the list.",
          )}
    </Text>
  );

  if (isSmall) {
    if (detail) {
      return (
        <Stack gap="2" paddingInline="4" paddingBlock="4">
          <Box>
            <Button
              variant="text"
              startIcon={<ArrowLeftIcon />}
              nativeButton={false}
              render={
                <LinkComponent
                  href={getReferenceSectionHref(tab.id, section)}
                />
              }
            >
              {section === "moves"
                ? t("reference.moves.back", "All moves")
                : t("reference.oracles.back", "All oracles")}
            </Button>
          </Box>
          {detail}
        </Stack>
      );
    }
    return tree;
  }

  // Like a game's sheet: the list in a column of its own, the open item on
  // the page. The page fills the screen here (see ReferencePage), so each
  // column scrolls on its own.
  return (
    <Grid
      gridTemplateColumns={`${referenceListWidth}px minmax(0, 1fr)`}
      gridTemplateRows="minmax(0, 1fr)"
      gap="0"
      alignItems="stretch"
      flex="1 1 0"
      minHeight="0"
    >
      <Box
        bg="bg.surface"
        borderInlineWidth="1px"
        borderColor="border.default"
        overflowY="auto"
      >
        {tree}
      </Box>
      <Box
        ref={detailRef}
        overflowY="auto"
        minWidth="0"
        paddingInline="6"
        paddingBlockStart="4"
        paddingBlockEnd="8"
      >
        <Box maxWidth={referenceDetailMaxWidth}>{detail ?? emptyDetail}</Box>
      </Box>
    </Grid>
  );
}
