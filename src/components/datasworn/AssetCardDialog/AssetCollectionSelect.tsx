import { ListSubheader, MenuItem, TextField } from "@mui/material";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import {
  AssetCollectionMap,
  RootAssetCollections,
} from "stores/dataswornTree.store";

export interface AssetCollectionSelectProps {
  collectionMap: AssetCollectionMap;
  rootAssetCollections: RootAssetCollections;
  selectedCollectionId: string;
  setSelectedCollectionId: (collectionId: string) => void;
}

export function AssetCollectionSelect(props: AssetCollectionSelectProps) {
  const {
    rootAssetCollections,
    collectionMap,
    selectedCollectionId,
    setSelectedCollectionId,
  } = props;
  const { t } = useTranslation();

  const items = useMemo(() => {
    const itemArr: {
      label: string;
      value?: string;
    }[] = [];

    Object.entries(rootAssetCollections).forEach(([_, ruleset], __, arr) => {
      if (arr.length > 1) {
        itemArr.push({
          label: ruleset.title,
        });
      }
      ruleset.rootAssets.forEach((collectionId) => {
        itemArr.push({
          label: collectionMap[collectionId]?.name,
          value: collectionId,
        });
      });
    });
    return itemArr;
  }, [rootAssetCollections, collectionMap]);

  return (
    <TextField
      label={t("datasworn.asset-collection", "Asset Collection")}
      fullWidth
      select
      value={selectedCollectionId}
      onChange={(e) => setSelectedCollectionId(e.target.value)}
    >
      {items.map((item, idx) =>
        item.value ? (
          <MenuItem key={item.value} value={item.value}>
            {item.label}
          </MenuItem>
        ) : (
          <ListSubheader key={idx}>{item.label}</ListSubheader>
        ),
      )}
    </TextField>
  );
}
