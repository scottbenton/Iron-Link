import { useDeferredValue, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { LinkComponent } from "components/LinkComponent";
import { AssetCard } from "components/datasworn/AssetCard";

import { Button } from "ui/components/Button";
import { SearchField } from "ui/components/SearchField";
import { Text } from "ui/components/Text";
import { Box, Grid, HStack, Stack } from "ui/primitives";

import { useDataswornTreeStore } from "stores/dataswornTree.store";

import {
  getPackageIdFromDataswornId,
  getReferenceItemHref,
} from "../data/referencePaths";
import { ReferenceTab } from "../data/referenceTabs";
import {
  isPackageShown,
  useReferenceSettings,
} from "../stores/referenceSettings.store";
import { ReferenceSourcesMenu } from "./ReferenceSourcesMenu";

export interface ReferenceAssetsProps {
  tab: ReferenceTab;
  // The collection in the URL, if any. The first collection shows otherwise.
  collectionId: string | undefined;
}

// The asset list: one collection's cards at a time, picked with chips that
// are links, or every match while searching.
export function ReferenceAssets(props: ReferenceAssetsProps) {
  const { tab, collectionId } = props;
  const { t } = useTranslation();

  const { rootAssetCollections, assetCollectionMap } = useDataswornTreeStore(
    (store) => store.assets,
  );
  const overrides = useReferenceSettings(
    (state) => state.sourceVisibility[tab.id],
  );

  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search).trim().toLocaleLowerCase();

  const collections = useMemo(() => {
    const packageOrder = (id: string) => {
      const index = tab.packageIds.indexOf(id);
      return index < 0 ? tab.packageIds.length : index;
    };
    return Object.entries(rootAssetCollections)
      .sort(([a], [b]) => packageOrder(a) - packageOrder(b))
      .flatMap(([, { rootCollectionIds }]) => rootCollectionIds)
      .map((id) => assetCollectionMap[id])
      .filter(
        (collection) =>
          !!collection &&
          isPackageShown(
            tab,
            "assets",
            getPackageIdFromDataswornId(collection._id),
            overrides,
          ),
      );
  }, [rootAssetCollections, assetCollectionMap, tab, overrides]);

  const selectedCollection =
    collections.find((collection) => collection._id === collectionId) ??
    (collectionId ? assetCollectionMap[collectionId] : undefined) ??
    collections[0];

  const assetIds = useMemo(() => {
    if (deferredSearch) {
      return collections.flatMap((collection) =>
        Object.values(collection.contents ?? {})
          .filter((asset) =>
            asset.name.toLocaleLowerCase().includes(deferredSearch),
          )
          .map((asset) => asset._id),
      );
    }
    return Object.values(selectedCollection?.contents ?? {}).map(
      (asset) => asset._id,
    );
  }, [deferredSearch, collections, selectedCollection]);

  return (
    <Stack gap="4">
      <HStack justifyContent="space-between" gap="2" flexWrap="wrap">
        <Text variant="h3" as="h2">
          {t("reference.assets.heading", "Assets")}
        </Text>
        <ReferenceSourcesMenu tab={tab} section="assets" />
      </HStack>
      <SearchField
        value={search}
        onValueChange={setSearch}
        label={t("reference.assets.search", "Search assets")}
        css={{ maxWidth: "480px" }}
      />
      {!deferredSearch && (
        <Box
          as="nav"
          aria-label={t("reference.assets.collections", "Asset types")}
          display="flex"
          flexWrap="wrap"
          gap="2"
        >
          {collections.map((collection) => {
            const selected = collection._id === selectedCollection?._id;
            return (
              <Button
                key={collection._id}
                size="sm"
                variant={selected ? "primary" : "outline"}
                nativeButton={false}
                render={
                  <LinkComponent
                    href={getReferenceItemHref(collection._id) ?? ""}
                    aria-current={selected ? "page" : undefined}
                  />
                }
              >
                {collection.name}
              </Button>
            );
          })}
        </Box>
      )}
      {!deferredSearch && selectedCollection && (
        <Text variant="h4" as="h3">
          {selectedCollection.name}
        </Text>
      )}
      {assetIds.length === 0 ? (
        <Text color="muted">
          {t("reference.no-matches", "Nothing matches your search")}
        </Text>
      ) : (
        <Grid
          gridTemplateColumns="repeat(auto-fill, minmax(min(100%, 300px), 1fr))"
          gap="3"
          alignItems="start"
        >
          {assetIds.map((assetId) => (
            <AssetCard
              key={assetId}
              assetId={assetId}
              headingAs={deferredSearch ? "h3" : "h4"}
              actions={
                <Button
                  size="sm"
                  variant="text"
                  nativeButton={false}
                  render={
                    <LinkComponent href={getReferenceItemHref(assetId) ?? ""} />
                  }
                >
                  {t("reference.assets.open", "Open")}
                </Button>
              }
            />
          ))}
        </Grid>
      )}
    </Stack>
  );
}
