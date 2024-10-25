import {
  Card,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListSubheader,
} from "@mui/material";

import {
  AssetCollectionMap,
  RootAssetCollections,
} from "atoms/dataswornRules/useAssets";

export interface AssetCollectionSidebarProps {
  collectionMap: AssetCollectionMap;
  rootAssetCollections: RootAssetCollections;
  selectedCollectionId: string;
  setSelectedCollectionId: (rulesetId: string, collectionId: string) => void;
}

export function AssetCollectionSidebar(props: AssetCollectionSidebarProps) {
  const {
    rootAssetCollections,
    collectionMap,
    selectedCollectionId,
    setSelectedCollectionId,
  } = props;

  // const { t } = useTranslation();

  return (
    <Card variant={"outlined"} sx={{ bgcolor: "background.default" }}>
      {Object.entries(rootAssetCollections).map(
        ([rulesetKey, ruleset], _, arr) => (
          <List key={rulesetKey}>
            {arr.length > 1 && (
              <ListSubheader
                sx={(theme) => ({
                  px: 2,
                  fontFamily: theme.typography.fontFamilyTitle,
                })}
                key={rulesetKey}
              >
                {ruleset.title}
              </ListSubheader>
            )}
            {ruleset.rootAssets.map((collectionId, index) => (
              <ListItem
                disablePadding
                key={collectionId}
                sx={(theme) => ({
                  bgcolor:
                    theme.palette.mode === "light"
                      ? index % 2 === 0
                        ? "grey.100"
                        : "grey.200"
                      : index % 2 === 0
                        ? "grey.900"
                        : "grey.800",
                })}
              >
                <ListItemButton
                  selected={collectionId === selectedCollectionId}
                  onClick={() =>
                    setSelectedCollectionId(rulesetKey, collectionId)
                  }
                >
                  <ListItemText
                    primary={collectionMap[collectionId]?.name ?? collectionId}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        ),
      )}
    </Card>
  );
}
