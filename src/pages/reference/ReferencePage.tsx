import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Navigate,
  useLocation,
  useNavigate,
  useNavigationType,
  useParams,
  useSearchParams,
} from "react-router";

import { LinkComponent } from "components/LinkComponent";
import { getDataswornItem } from "components/datasworn/DataswornDialog/useGetDataswornItem";
import { DataswornLinkHandlerProvider } from "components/datasworn/DataswornLinkHandler";

import { Alert } from "ui/components/Alert";
import { Button } from "ui/components/Button";
import { Link } from "ui/components/Link";
import { Progress } from "ui/components/Progress";
import { PageTab, PageTabs } from "ui/components/Tabs";
import { EmptyState } from "ui/layout";
import { Box, Stack } from "ui/primitives";

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
import { referencePageMaxWidth } from "./data/referenceLayout";
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
  const { hash, key: locationKey } = useLocation();
  const navigationType = useNavigationType();
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
  // way back. The note belongs to that one visit: stepping back or forward
  // through history to an item is not opening a link, and returning to it
  // later shows no note.
  const [switchNote, setSwitchNote] = useState<{
    locationKey: string;
    fromTabId: string;
    toTabId: string;
  }>();
  // Whether the current address was reached by stepping through history,
  // decided when the effect below first sees it. Both that and the page
  // loading are POP, and the first entry's key is "default" either way. The
  // tab can resolve after a later render, so the answer is kept per address.
  const seenLocation = useRef<{ key: string; isHistoryStep: boolean }>(
    undefined,
  );
  useEffect(() => {
    if (seenLocation.current?.key !== locationKey) {
      seenLocation.current = {
        key: locationKey,
        isHistoryStep:
          seenLocation.current !== undefined && navigationType === "POP",
      };
    }
    const { isHistoryStep } = seenLocation.current;
    if (
      parsed.itemPath &&
      !isHistoryStep &&
      storedTabId &&
      isTab(storedTabId) &&
      storedTabId !== tabId &&
      queryTabId !== tabId
    ) {
      setSwitchNote({ locationKey, fromTabId: storedTabId, toTabId: tabId });
    }
    setLastTabId(tabId);
  }, [
    parsed.itemPath,
    navigationType,
    storedTabId,
    tabId,
    queryTabId,
    locationKey,
    setLastTabId,
  ]);

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

  const systemTabsRef = useRef<HTMLElement>(null);

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
    switchNote.locationKey === locationKey &&
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
            variant="outline"
            nativeButton={false}
            render={
              <LinkComponent href={getReferenceSectionHref(tabId, "moves")} />
            }
          >
            {t("reference.not-found.see-moves", "See all moves")}
          </Button>
        }
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
      />
    );
  } else if (!isLoaded || shouldReject) {
    content = <Progress label={t("reference.loading", "Loading")} />;
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
            variant="outline"
            nativeButton={false}
            render={
              <LinkComponent href={getReferenceSectionHref(tabId, section)} />
            }
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
    <Stack
      gap="0"
      flex="1 0 auto"
      width="100%"
      maxWidth={referencePageMaxWidth}
      marginInline="auto"
    >
      <Box as="h1" srOnly>
        {t("reference.title", "Reference")}
      </Box>
      {/* The href alone picks the tab. Storing the tab on click as well
          would render the old address with the new tab for a moment, which
          read as a link opening another tab. */}
      <PageTabs
        ref={systemTabsRef}
        aria-label={t("reference.tabs.systems", "Rules")}
      >
        {referenceTabs.map((referenceTab) => (
          <PageTab
            key={referenceTab.id}
            current={referenceTab.id === tabId}
            render={
              <LinkComponent
                href={getTabHref(referenceTab.id, currentSection)}
              />
            }
          >
            {referenceTab.label}
          </PageTab>
        ))}
      </PageTabs>
      <PageTabs aria-label={t("reference.tabs.sections", "Sections")}>
        {referenceSections.map((referenceSection) => (
          <PageTab
            key={referenceSection}
            current={referenceSection === section}
            render={
              <LinkComponent href={getTabHref(tabId, referenceSection)} />
            }
          >
            {sectionLabels[referenceSection]}
          </PageTab>
        ))}
      </PageTabs>
      {note && (
        <Alert tone="info" css={{ marginInline: "4", marginBlockStart: "4" }}>
          {t("reference.switch-note", "Opened the {{tab}} tab for this link.", {
            tab: referenceTabMap[note.toTabId].label,
          })}{" "}
          <Link
            render={
              <LinkComponent
                href={getTabHref(note.fromTabId, currentSection)}
              />
            }
          >
            {t("reference.switch-note-back", "Back to {{tab}}", {
              tab: referenceTabMap[note.fromTabId].label,
            })}
          </Link>
        </Alert>
      )}
      <DataswornLinkHandlerProvider onOpen={handleOpenLink}>
        <Stack
          gap="0"
          flex="1 0 auto"
          paddingInline={isBrowseSection ? "0" : "4"}
          paddingBlockStart={isBrowseSection ? "0" : "4"}
          paddingBlockEnd={isBrowseSection ? "0" : "8"}
        >
          {content}
        </Stack>
      </DataswornLinkHandlerProvider>
      <ReferenceBanner
        onDismiss={() =>
          systemTabsRef.current
            ?.querySelector<HTMLElement>('[aria-current="page"]')
            ?.focus()
        }
      />
    </Stack>
  );
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
