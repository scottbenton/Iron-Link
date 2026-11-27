import { Datasworn } from "@datasworn-community/core";

import {
  AccordionItem,
  AccordionPanel,
  AccordionTrigger,
} from "ui/components/Accordion";
import { Text } from "ui/components/Text";
import { Stack } from "ui/primitives";

import { CollectionPlayset } from "./CollectionPlayset";
import { PlaysetCollectionKey } from "./getReplacedCollectionsAndItems";

export interface PlaysetSectionProps {
  /** The accordion item's value. */
  value: string;
  label: string;
  rulesPackages: Record<string, Datasworn.RulesPackage>;
  collectionKey: PlaysetCollectionKey;
  excludedCollections: Record<string, boolean>;
  toggleExcludedCollection: (collectionId: string, isExcluded: boolean) => void;
  excludedItems: Record<string, boolean>;
  toggleExcludedItem: (itemId: string, isExcluded: boolean) => void;
  replacedCollections: Record<string, boolean>;
  replacedItems: Record<string, boolean>;
}

/** One kind (assets, moves or oracles), with every package's collections. */
export function PlaysetSection(props: PlaysetSectionProps) {
  const { value, label, rulesPackages, collectionKey, ...collectionProps } =
    props;

  return (
    <AccordionItem value={value}>
      <AccordionTrigger headingLevel={3}>{label}</AccordionTrigger>
      <AccordionPanel>
        <Stack gap="4">
          {Object.values(rulesPackages).map((pkg) => (
            <Stack key={pkg._id} gap="1">
              <Text variant="label" color="muted">
                {pkg.title}
              </Text>
              <Stack as="ul" gap="0" listStyle="none" margin="0" padding="0">
                {Object.values(pkg[collectionKey]).map((collection) => (
                  <CollectionPlayset
                    key={collection._id}
                    collection={collection}
                    {...collectionProps}
                  />
                ))}
              </Stack>
            </Stack>
          ))}
        </Stack>
      </AccordionPanel>
    </AccordionItem>
  );
}
