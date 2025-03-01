import { List } from "@/components/common/ListItem/List";
import {
  AccordionItem,
  AccordionItemContent,
  AccordionItemTrigger,
} from "@/components/ui/accordion";
import { Box, Text } from "@chakra-ui/react";
import { Datasworn } from "@datasworn/core";

import { CollectionPlayset } from "./CollectionPlayset";

// import { CollectionPlayset } from "./CollectionPlayset";

export interface PlaysetSectionProps {
  label: string;
  rulesPackages: Record<string, Datasworn.RulesPackage>;
  collectionKey: "moves" | "assets" | "oracles";
  excludedCollections: Record<string, boolean>;
  toggleExcludedCollection: (collectionId: string, isExcluded: boolean) => void;
  excludedItems: Record<string, boolean>;
  toggleExcludedItem: (itemId: string, isExcluded: boolean) => void;
  replacedCollections: Record<string, boolean>;
  replacedItems: Record<string, boolean>;
}

export function PlaysetSection(props: PlaysetSectionProps) {
  const {
    label,
    rulesPackages,
    collectionKey,
    excludedCollections,
    toggleExcludedCollection,
    excludedItems,
    toggleExcludedItem,
    replacedCollections,
    replacedItems,
  } = props;

  return (
    <AccordionItem value={label}>
      <AccordionItemTrigger cursor="pointer">{label}</AccordionItemTrigger>
      <AccordionItemContent display="flex" flexDir="column" gap={4}>
        {Object.values(rulesPackages).map((pkg) => (
          <Box key={pkg._id}>
            <Text>{pkg.title}</Text>
            <List>
              {Object.values(pkg[collectionKey]).map((collection) => (
                <CollectionPlayset
                  key={collection._id}
                  collection={collection}
                  excludedCollections={excludedCollections}
                  toggleExcludedCollection={toggleExcludedCollection}
                  excludedItems={excludedItems}
                  toggleExcludedItem={toggleExcludedItem}
                  replacedCollections={replacedCollections}
                  replacedItems={replacedItems}
                />
              ))}
            </List>
          </Box>
        ))}
      </AccordionItemContent>
    </AccordionItem>
  );
}
