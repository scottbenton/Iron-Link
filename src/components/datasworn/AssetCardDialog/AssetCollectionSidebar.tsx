import { ListItem } from "@/components/common/ListItem";
import { List } from "@/components/common/ListItem/List";
import { AssetCollectionMap } from "@/stores/dataswornTree.store";
import { RootCollections } from "@/stores/dataswornTreeHelpers/parseCollectionsIntoMaps";
import { Card, Text } from "@chakra-ui/react";

export interface AssetCollectionSidebarProps {
  collectionMap: AssetCollectionMap;
  rootAssetCollections: RootCollections;
  selectedCollectionId: string;
  setSelectedCollectionId: (collectionId: string) => void;
}

export function AssetCollectionSidebar(props: AssetCollectionSidebarProps) {
  const {
    rootAssetCollections,
    collectionMap,
    selectedCollectionId,
    setSelectedCollectionId,
  } = props;

  return (
    <Card.Root variant="outline" size="sm" position="sticky" top={0}>
      <Card.Body px={0}>
        {Object.entries(rootAssetCollections).map(
          ([rulesetKey, ruleset], _, arr) => (
            <List key={rulesetKey}>
              {arr.length > 1 && <Text>{ruleset.title}</Text>}
              {ruleset.rootCollectionIds.map((collectionId) => {
                const collection = collectionMap[collectionId];
                if (!collection) {
                  return null;
                }
                return (
                  <ListItem
                    key={collectionId}
                    onClick={() => setSelectedCollectionId(collectionId)}
                    label={collectionMap[collectionId]?.name ?? collectionId}
                    bg={
                      selectedCollectionId === collectionId
                        ? "bg.muted"
                        : undefined
                    }
                  />
                );
              })}
            </List>
          ),
        )}
      </Card.Body>
    </Card.Root>
  );
}
