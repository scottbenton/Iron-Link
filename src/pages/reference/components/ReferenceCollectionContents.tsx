import { useTranslation } from "react-i18next";

import { LinkComponent } from "components/LinkComponent";

import { ListRow, ListRowButton } from "ui/components/List";
import { Text } from "ui/components/Text";
import { RulesText } from "ui/game/RulesText";
import { Stack } from "ui/primitives";

import { getReferenceItemHref } from "../data/referencePaths";

export interface ReferenceCollectionContentsProps {
  description?: string;
  items: { _id: string; name: string }[];
}

// A collection's own page: its description, then a link to everything in it.
export function ReferenceCollectionContents(
  props: ReferenceCollectionContentsProps,
) {
  const { description, items } = props;
  const { t } = useTranslation();

  return (
    <Stack gap="3">
      {description && <RulesText markdown={description} size="sm" />}
      <Stack gap="1">
        <Text variant="eyebrow" color="muted" as="h3">
          {t("reference.collection-contents", "In this collection")}
        </Text>
        <Stack as="ul" gap="0.5" margin="0" padding="0" listStyle="none">
          {items.map((child) => {
            const href = getReferenceItemHref(child._id);
            if (!href) return null;
            return (
              <ListRow key={child._id} as="li">
                <ListRowButton render={<LinkComponent href={href} />}>
                  <span data-row-name="">{child.name}</span>
                </ListRowButton>
              </ListRow>
            );
          })}
        </Stack>
      </Stack>
    </Stack>
  );
}
