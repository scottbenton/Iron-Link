import SearchIcon from "@mui/icons-material/Search";
import {
  Box,
  Button,
  Chip,
  InputAdornment,
  TextField,
  Typography,
} from "@mui/material";
import { useDeferredValue, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { GridLayout } from "components/Layout";
import { LinkComponent } from "components/LinkComponent";
import { AssetCard } from "components/datasworn/AssetCard";

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
    <Box>
      <Box
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        gap={1}
        mb={1}
        flexWrap="wrap"
      >
        <Typography
          variant="h6"
          component="h2"
          fontFamily={(theme) => theme.typography.fontFamilyTitle}
          textTransform="uppercase"
        >
          {t("reference.assets.heading", "Assets")}
        </Typography>
        <ReferenceSourcesMenu tab={tab} section="assets" />
      </Box>
      <TextField
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        label={t("reference.assets.search", "Search assets")}
        size="small"
        fullWidth
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          },
        }}
        sx={{ mb: 2, maxWidth: 480 }}
      />
      {!deferredSearch && (
        <Box
          component="nav"
          aria-label={t("reference.assets.collections", "Asset types")}
          display="flex"
          flexWrap="wrap"
          gap={1}
          mb={2}
        >
          {collections.map((collection) => {
            const selected = collection._id === selectedCollection?._id;
            return (
              <Chip
                key={collection._id}
                label={collection.name}
                component={LinkComponent}
                href={getReferenceItemHref(collection._id) ?? ""}
                clickable
                color={selected ? "primary" : "default"}
                variant={selected ? "filled" : "outlined"}
                aria-current={selected ? "page" : undefined}
              />
            );
          })}
        </Box>
      )}
      {!deferredSearch && selectedCollection && (
        <Typography variant="h6" component="h3" sx={{ mb: 1 }}>
          {selectedCollection.name}
        </Typography>
      )}
      <GridLayout
        items={assetIds}
        minWidth={300}
        emptyStateMessage={t(
          "reference.no-matches",
          "Nothing matches your search",
        )}
        renderItem={(assetId) => (
          <AssetCard
            assetId={assetId}
            sx={{ height: "100%" }}
            actions={
              <Button
                LinkComponent={LinkComponent}
                href={getReferenceItemHref(assetId) ?? ""}
                color="inherit"
                size="small"
              >
                {t("reference.assets.open", "Open")}
              </Button>
            }
          />
        )}
      />
    </Box>
  );
}
