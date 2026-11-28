import { useTranslation } from "react-i18next";

import { Text } from "ui/components/Text";
import { Box, Flex } from "ui/primitives";

import { useWorldCategoriesStore } from "stores/worldCategories.store";

import { getWorldEntryPreviewFields } from "lib/worldEntryPreview";

import { IWorldEntry } from "services/worldEntries.service";

import { WorldEntryIcon } from "./WorldEntryIcon";
import { useResolvedWorldEntryFields } from "./useResolvedWorldEntryFields";

// A glance at an entry from a link to it: its picture, name and category,
// then the first few fields this reader can see. Read-only and built from
// the entries already loaded, so it costs no request. It fills a preview
// card, which supplies the padding and the gap between its parts.
export function WorldEntryHoverCard({ entry }: { entry: IWorldEntry }) {
  const { t } = useTranslation();
  const categoryName = useWorldCategoriesStore(
    (store) => store.categories[entry.categoryId]?.name,
  );
  const { fields, values, entries } = useResolvedWorldEntryFields(entry);
  const previewFields = getWorldEntryPreviewFields(fields, values, entries);

  return (
    <>
      <Flex gap="3" alignItems="center">
        <WorldEntryIcon entry={entry} size="large" />
        <Box minWidth="0">
          <Text as="span" weight="semibold" css={{ display: "block" }}>
            {entry.name}
          </Text>
          {categoryName && (
            <Text
              as="span"
              variant="caption"
              color="muted"
              css={{ display: "block" }}
            >
              {categoryName}
            </Text>
          )}
        </Box>
      </Flex>
      {previewFields.length > 0 ? (
        <Box as="dl" margin="0" display="grid" gap="2">
          {previewFields.map((field) => (
            <div key={field.id}>
              <Text as="dt" variant="caption" color="muted" weight="semibold">
                {field.label}
              </Text>
              <Text
                as="dd"
                variant="bodySm"
                css={{
                  margin: 0,
                  lineClamp: 2,
                  overflowWrap: "anywhere",
                }}
              >
                {field.text}
              </Text>
            </div>
          ))}
        </Box>
      ) : (
        <Text variant="bodySm" color="muted">
          {t("worlds.entries.hover-card-empty", "No details filled in yet")}
        </Text>
      )}
    </>
  );
}
