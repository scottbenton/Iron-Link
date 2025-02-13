import { Datasworn } from "@datasworn/core";
import ExpandIcon from "@mui/icons-material/ExpandMore";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Typography,
} from "@mui/material";

import { CollectionPlayset } from "./CollectionPlayset";

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
    <Accordion variant={"outlined"}>
      <AccordionSummary
        expandIcon={<ExpandIcon />}
        aria-controls={label + "-accordion-content"}
        id={label + "-accordion-header"}
      >
        <Typography component="span">{label}</Typography>
      </AccordionSummary>
      <AccordionDetails>
        {Object.values(rulesPackages).map((pkg) => (
          <Box key={pkg._id}>
            <Typography>{pkg.title}</Typography>
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
          </Box>
        ))}
      </AccordionDetails>
    </Accordion>
  );
}
