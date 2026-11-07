import {
  Alert,
  Box,
  Button,
  LinearProgress,
  Link,
  Tab,
  TabProps,
  Tabs,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Navigate,
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router";

import { PageContent, PageHeader } from "components/Layout";
import { EmptyState } from "components/Layout/EmptyState";
import { LinkComponent } from "components/LinkComponent";
import { StyledTab, StyledTabs } from "components/StyledTabs";
import { getDataswornItem } from "components/datasworn/DataswornDialog/useGetDataswornItem";
import { DataswornLinkHandlerProvider } from "components/datasworn/DataswornLinkHandler";

import {
  PageCategory,
  useSendPageViewEvent,
} from "hooks/useSendPageViewEvents";

import { useOpenDataswornDialog } from "stores/appState.store";
import { useDataswornTree } from "stores/dataswornTree.store";

import { ReferenceAssets } from "./components/ReferenceAssets";
import { ReferenceBanner } from "./components/ReferenceBanner";
import { ReferenceBrowseSection } from "./components/ReferenceBrowseSection";
import { ReferenceItemDetail } from "./components/ReferenceItemDetail";
import { ReferenceRules } from "./components/ReferenceRules";
import { referencePageMaxWidth, visuallyHidden } from "./data/referenceLayout";
import {
  getCandidateIds,
  getPackageIdFromDataswornId,
  getReferenceItemHref,
  getReferenceSectionHref,
  isReferenceSection,
  parseReferencePath,
  resolveReferenceTab,
} from "./data/referencePaths";
import {
  ReferenceSection,
  defaultReferenceTabId,
  getHomeTabId,
  referenceSections,
  referenceTabMap,
  referenceTabs,
  tabLoadsPackage,
} from "./data/referenceTabs";
import { useReferenceRules } from "./hooks/useReferenceRules";
import {
  getLoadedPackageIds,
  useReferenceSettings,
} from "./stores/referenceSettings.store";

const isTab = (tabId: string) => !!referenceTabMap[tabId];

// A tab whose name comes in a link's query, so a system tab opened in a new
// browser tab shows that tab even when its last item belongs to another.
const TAB_QUERY_KEY = "tab";

export default function ReferencePage() {
  const { t } = useTranslation();
  useSendPageViewEvent(PageCategory.Reference);

  const navigate = useNavigate();
  const { hash } = useLocation();
  const splat = useParams()["*"];
  const [searchParams] = useSearchParams();
  const parsed = useMemo(() => parseReferencePath(splat), [splat]);

  const storedTabId = useReferenceSettings((state) => state.lastTabId);
  const setLastTabId = useReferenceSettings((state) => state.setLastTabId);
  const lastItemIds = useReferenceSettings((state) => state.lastItemIds);
  const setLastItemId = useReferenceSettings((state) => state.setLastItemId);

  const queryTabId = searchParams.get(TAB_QUERY_KEY) ?? undefined;
  const preferredTabId =
    queryTabId && isTab(queryTabId) ? queryTabId : storedTabId;

  // The tab an item turned out to be missing from, for this URL only.
  const [rejection, setRejection] = useState<{
    splat: string | undefined;
    tabId: string;
  }>();
  const rejectedTabId =
    rejection && rejection.splat === splat ? rejection.tabId : undefined;

  const tabId = resolveReferenceTab({
    parsed,
    storedTabId: preferredTabId,
    rejectedTabId,
    getHomeTabId,
    tabLoadsPackage,
    isTab,
    defaultTabId: defaultReferenceTabId,
  });
  const tab = referenceTabMap[tabId];

  // When a link opens another tab than the one in use, say so and offer the
  // way back.
  const [switchNote, setSwitchNote] = useState<{
    splat: string | undefined;
    fromTabId: string;
    toTabId: string;
  }>();
  useEffect(() => {
    if (
      parsed.itemPath &&
      storedTabId &&
      isTab(storedTabId) &&
      storedTabId !== tabId &&
      queryTabId !== tabId
    ) {
      setSwitchNote({ splat, fromTabId: storedTabId, toTabId: tabId });
    }
    setLastTabId(tabId);
  }, [parsed.itemPath, storedTabId, tabId, queryTabId, splat, setLastTabId]);

  const sourceOverrides = useReferenceSettings(
    (state) => state.sourceVisibility[tabId],
  );
  const loadedPackageIds = useMemo(
    () =>
      tab ? getLoadedPackageIds(tab, sourceOverrides, parsed.packageId) : [],
    [tab, sourceOverrides, parsed.packageId],
  );
  const rules = useReferenceRules(tabId, loadedPackageIds);
  const isLoaded = rules.state === "loaded" && rules.tabId === tabId;
  // Re-render when the rules change, since items are read from the store.
  const activeRules = useDataswornTree();

  const section = isReferenceSection(parsed.section)
    ? parsed.section
    : undefined;

  const item = useMemo(() => {
    if (!isLoaded || !section || !parsed.packageId || !parsed.itemPath) {
      return undefined;
    }
    for (const id of getCandidateIds(
      parsed.packageId,
      section,
      parsed.itemPath,
    )) {
      const found = getDataswornItem(id);
      if (found) return found;
    }
    return undefined;
    // activeRules is read through getDataswornItem.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, section, parsed.packageId, parsed.itemPath, activeRules]);

  const itemId = item ? getItemId(item) : undefined;

  // An item missing from this tab (filtered out by its playset) opens in its
  // package's home tab instead.
  const homeTabId = parsed.packageId
    ? getHomeTabId(parsed.packageId)
    : undefined;
  const shouldReject =
    isLoaded &&
    !!section &&
    section !== "rules" &&
    !!parsed.itemPath &&
    !item &&
    !!homeTabId &&
    homeTabId !== tabId &&
    !!parsed.packageId &&
    tabLoadsPackage(homeTabId, parsed.packageId);

  useEffect(() => {
    if (shouldReject) setRejection({ splat, tabId });
  }, [shouldReject, splat, tabId]);

  // Remember each tab's open item per section, so returning to a tab or
  // section picks up where the reader left off.
  useEffect(() => {
    if (!isLoaded || !section || section === "rules") return;
    if (parsed.itemPath && !itemId) return;
    setLastItemId(tabId, section, itemId);
  }, [isLoaded, section, parsed.itemPath, itemId, tabId, setLastItemId]);

  const systemTabsRef = useRef<HTMLDivElement>(null);

  const openDialog = useOpenDataswornDialog();
  const handleOpenLink = useCallback(
    (id: string) => {
      const href = getReferenceItemHref(id);
      const packageId = getPackageIdFromDataswornId(id);
      if (
        href &&
        packageId &&
        (getHomeTabId(packageId) || tabLoadsPackage(tabId, packageId))
      ) {
        navigate(href);
      } else {
        openDialog(id);
      }
    },
    [navigate, openDialog, tabId],
  );

  const getTabHref = (targetTabId: string, targetSection: ReferenceSection) => {
    const lastId = lastItemIds[targetTabId]?.[targetSection];
    const itemHref = lastId ? getReferenceItemHref(lastId) : undefined;
    return itemHref
      ? `${itemHref}?${TAB_QUERY_KEY}=${targetTabId}`
      : getReferenceSectionHref(targetTabId, targetSection);
  };

  if (!parsed.packageId) {
    return (
      <Navigate
        replace
        to={getReferenceSectionHref(
          preferredTabId && isTab(preferredTabId)
            ? preferredTabId
            : defaultReferenceTabId,
          "moves",
        )}
      />
    );
  }
  if (!parsed.section) {
    return <Navigate replace to={getReferenceSectionHref(tabId, "moves")} />;
  }
  // A list URL that names a package rather than its tab, or a rules URL with
  // more after it, goes to the tab's list.
  const shouldRedirectToList =
    !!section &&
    ((section === "rules" && !!parsed.itemPath) ||
      (!parsed.itemPath && parsed.packageId !== tabId));
  if (shouldRedirectToList) {
    return (
      <Navigate replace to={getReferenceSectionHref(tabId, section) + hash} />
    );
  }

  const currentSection: ReferenceSection = section ?? "moves";
  const sectionLabels: Record<ReferenceSection, string> = {
    moves: t("reference.sections.moves", "Moves"),
    oracles: t("reference.sections.oracles", "Oracles"),
    assets: t("reference.sections.assets", "Assets"),
    rules: t("reference.sections.rules", "Rules"),
  };

  const note =
    switchNote &&
    switchNote.splat === splat &&
    switchNote.toTabId === tabId &&
    referenceTabMap[switchNote.fromTabId]
      ? switchNote
      : undefined;

  let content: React.ReactNode;
  if (!section) {
    content = (
      <EmptyState
        title={t(
          "reference.not-found.page-title",
          "We couldn't find that page",
        )}
        message={t(
          "reference.not-found.page-message",
          "The reference has moves, oracles, assets and rules.",
        )}
        action={
          <Button
            variant="outlined"
            LinkComponent={LinkComponent}
            href={getReferenceSectionHref(tabId, "moves")}
          >
            {t("reference.not-found.see-moves", "See all moves")}
          </Button>
        }
        sx={{ mt: 4 }}
      />
    );
  } else if (rules.state === "error") {
    content = (
      <EmptyState
        title={t("reference.load-error.title", "We couldn't load these rules")}
        message={t(
          "reference.load-error.message",
          "Check your connection, then reload the page.",
        )}
        sx={{ mt: 4 }}
      />
    );
  } else if (!isLoaded || shouldReject) {
    content = <LinearProgress aria-label={t("reference.loading", "Loading")} />;
  } else if (section === "rules") {
    content = <ReferenceRules tabId={tabId} />;
  } else {
    const notFound = parsed.itemPath && !item && (
      <EmptyState
        title={t("reference.not-found.title", "We couldn't find that item")}
        message={t(
          "reference.not-found.message",
          "It may have been renamed, or it isn't part of these rules.",
        )}
        action={
          <Button
            variant="outlined"
            LinkComponent={LinkComponent}
            href={getReferenceSectionHref(tabId, section)}
          >
            {
              {
                moves: t("reference.not-found.see-moves", "See all moves"),
                oracles: t(
                  "reference.not-found.see-oracles",
                  "See all oracles",
                ),
                assets: t("reference.not-found.see-assets", "See all assets"),
              }[section]
            }
          </Button>
        }
        sx={{ mt: 4 }}
      />
    );

    if (section === "assets") {
      if (item?.type === "asset") {
        content = (
          <ReferenceItemDetail item={item} tab={tab} section={section} />
        );
      } else if (notFound) {
        content = notFound;
      } else {
        content = (
          <ReferenceAssets
            tab={tab}
            collectionId={
              item?.type === "asset_collection"
                ? item.assetCollection._id
                : undefined
            }
          />
        );
      }
    } else {
      content = (
        <ReferenceBrowseSection
          tab={tab}
          section={section}
          selectedId={itemId}
          detail={
            item ? (
              <ReferenceItemDetail item={item} tab={tab} section={section} />
            ) : (
              notFound || undefined
            )
          }
        />
      );
    }
  }

  // Moves and oracles run edge to edge, with the list on the side panel
  // colour. The rest of the sections keep the page's padding.
  const isBrowseSection =
    (section === "moves" || section === "oracles") && isLoaded && !shouldReject;

  return (
    <>
      <Typography component="h1" sx={visuallyHidden}>
        {t("reference.title", "Reference")}
      </Typography>
      <PageHeader
        disablePadding
        maxWidth={false}
        sx={(theme) => ({
          maxWidth: referencePageMaxWidth,
          borderBottom: `1px solid ${theme.palette.divider}`,
        })}
      >
        <Box ref={systemTabsRef} minWidth={0} width="100%">
          <Tabs
            value={tabId}
            aria-label={t("reference.tabs.systems", "Rules")}
            variant="scrollable"
            scrollButtons="auto"
          >
            {referenceTabs.map((referenceTab) => (
              <Tab
                key={referenceTab.id}
                value={referenceTab.id}
                label={referenceTab.label}
                {...tabLinkProps(getTabHref(referenceTab.id, currentSection))}
                onClick={() => setLastTabId(referenceTab.id)}
                aria-current={referenceTab.id === tabId ? "page" : undefined}
              />
            ))}
          </Tabs>
        </Box>
      </PageHeader>
      <PageContent
        disablePadding
        maxWidth={false}
        sx={{ maxWidth: referencePageMaxWidth }}
      >
        <StyledTabs
          value={currentSection}
          aria-label={t("reference.tabs.sections", "Sections")}
          variant="scrollable"
          sx={{ px: 1, py: 0.5 }}
        >
          {referenceSections.map((referenceSection) => (
            <StyledTab
              key={referenceSection}
              value={referenceSection}
              label={sectionLabels[referenceSection]}
              {...tabLinkProps(getTabHref(tabId, referenceSection))}
              aria-current={referenceSection === section ? "page" : undefined}
            />
          ))}
        </StyledTabs>
        {note && (
          <Alert severity="info" variant="outlined" sx={{ mx: 2, mt: 2 }}>
            {t(
              "reference.switch-note",
              "Opened the {{tab}} tab for this link.",
              { tab: referenceTabMap[note.toTabId].label },
            )}{" "}
            <Link
              component={LinkComponent}
              href={getTabHref(note.fromTabId, currentSection)}
              onClick={() => setLastTabId(note.fromTabId)}
            >
              {t("reference.switch-note-back", "Back to {{tab}}", {
                tab: referenceTabMap[note.fromTabId].label,
              })}
            </Link>
          </Alert>
        )}
        <DataswornLinkHandlerProvider onOpen={handleOpenLink}>
          <Box
            flexGrow={1}
            display="flex"
            flexDirection="column"
            px={isBrowseSection ? 0 : 2}
            pt={isBrowseSection ? 0 : 2}
            pb={isBrowseSection ? 0 : 4}
          >
            {content}
          </Box>
        </DataswornLinkHandlerProvider>
        <ReferenceBanner
          onDismiss={() =>
            systemTabsRef.current
              ?.querySelector<HTMLElement>('[aria-current="page"]')
              ?.focus()
          }
        />
      </PageContent>
    </>
  );
}

// Tabs that are links, so a reader can open one in a new browser tab.
// StyledTab's props don't carry a link component's href.
function tabLinkProps(href: string): TabProps {
  return { component: LinkComponent, href } as unknown as TabProps;
}

function getItemId(
  item: NonNullable<ReturnType<typeof getDataswornItem>>,
): string {
  switch (item.type) {
    case "move":
      return item.move._id;
    case "move_category":
      return item.moveCategory._id;
    case "oracle_rollable":
      return item.oracle._id;
    case "oracle_collection":
      return item.oracleCollection._id;
    case "asset":
      return item.asset._id;
    case "asset_collection":
      return item.assetCollection._id;
  }
}
