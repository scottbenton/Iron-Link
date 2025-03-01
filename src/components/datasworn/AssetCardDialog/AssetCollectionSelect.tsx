import {
  SelectContent,
  SelectItem,
  SelectItemGroup,
  SelectLabel,
  SelectRoot,
  SelectTrigger,
  SelectValueText,
} from "@/components/ui/select";
import { useCharacterCreateTranslations } from "@/hooks/i18n/useCharacterCreateTranslations";
import { AssetCollectionMap } from "@/stores/dataswornTree.store";
import { RootCollections } from "@/stores/dataswornTreeHelpers/parseCollectionsIntoMaps";
import { createListCollection } from "@chakra-ui/react";
import { Fragment, useMemo } from "react";

export interface AssetCollectionSelectProps {
  collectionMap: AssetCollectionMap;
  rootAssetCollections: RootCollections;
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
  const t = useCharacterCreateTranslations();

  const { groupedItems, items } = useMemo(() => {
    const groupedItems: {
      groupLabel: string;
      items: {
        label: string;
        value: string;
      }[];
    }[] = [];

    Object.values(rootAssetCollections).forEach((ruleset) => {
      groupedItems.push({
        groupLabel: ruleset.title,
        items: ruleset.rootCollectionIds.map((collectionId) => ({
          label: collectionMap[collectionId]?.name,
          value: collectionId,
        })),
      });
    });

    const items = createListCollection({
      items: groupedItems.flatMap((group) => [
        ...group.items.map((item) => ({
          ...item,
          group: group.groupLabel,
        })),
      ]),
    });

    return { groupedItems, items };
  }, [rootAssetCollections, collectionMap]);

  return (
    <SelectRoot
      collection={items}
      value={[selectedCollectionId]}
      onValueChange={(details) => setSelectedCollectionId(details.value[0])}
    >
      <SelectLabel>
        {t("asset-collection-select-label", "Asset Collection")}
      </SelectLabel>
      <SelectTrigger>
        <SelectValueText />
      </SelectTrigger>
      <SelectContent>
        {groupedItems.map((group, idx, arr) =>
          arr.length > 1 ? (
            <Fragment key={idx}>
              {group.items.map((item) => (
                <SelectItem key={item.value} item={item}>
                  {item.label}
                </SelectItem>
              ))}
            </Fragment>
          ) : (
            <SelectItemGroup key={idx} label={group.groupLabel}>
              {group.items.map((item) => (
                <SelectItem key={item.value} item={item}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectItemGroup>
          ),
        )}
      </SelectContent>
    </SelectRoot>
  );
}
