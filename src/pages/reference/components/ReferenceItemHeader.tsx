import { useTranslation } from "react-i18next";

import { LinkComponent } from "components/LinkComponent";

import { Alert } from "ui/components/Alert";
import { BreadcrumbItem, Breadcrumbs } from "ui/components/Breadcrumbs";
import { Chip } from "ui/components/Chip";
import { Text } from "ui/components/Text";
import { Flex, HStack, Stack } from "ui/primitives";

import { allDefaultPackages } from "data/package.config";

import {
  getPackageIdFromDataswornId,
  getParentCollectionId,
  getReferenceItemHref,
} from "../data/referencePaths";
import { ReferenceSection, ReferenceTab } from "../data/referenceTabs";
import {
  isPackageShown,
  useReferenceSettings,
} from "../stores/referenceSettings.store";
import { ReferenceShareButton } from "./ReferenceShareButton";

export interface ReferenceItemHeaderProps {
  id: string;
  name: string;
  tab: ReferenceTab;
  section: ReferenceSection;
  // The collection's name, when the item sits in one.
  getCollectionName: (id: string) => string | undefined;
}

// The top of an item's page: where it sits, its name, which expansion it
// comes from when that isn't the tab's own rules, and a way to share it.
export function ReferenceItemHeader(props: ReferenceItemHeaderProps) {
  const { id, name, tab, section, getCollectionName } = props;
  const { t } = useTranslation();

  const overrides = useReferenceSettings(
    (state) => state.sourceVisibility[tab.id],
  );

  const packageId = getPackageIdFromDataswornId(id);
  const packageName = packageId
    ? allDefaultPackages[packageId]?.name
    : undefined;
  const isFromOtherSource =
    !!packageName && !!packageId && !tab.primaryPackageIds.includes(packageId);
  const isHidden = !isPackageShown(tab, section, packageId, overrides);
  const hiddenSourceLabel = tab.sources.find(
    (source) =>
      source.packageId === packageId &&
      (!source.sections || source.sections.includes(section)),
  )?.label;

  const parentId = getParentCollectionId(id);
  const parentName = parentId ? getCollectionName(parentId) : undefined;
  const parentHref = parentId ? getReferenceItemHref(parentId) : undefined;
  const href = getReferenceItemHref(id);

  return (
    <Stack gap="2" marginBlockEnd="4">
      {parentName && parentHref && (
        <Breadcrumbs aria-label={t("reference.breadcrumbs", "Breadcrumbs")}>
          <BreadcrumbItem render={<LinkComponent href={parentHref} />}>
            {parentName}
          </BreadcrumbItem>
          <BreadcrumbItem current>{name}</BreadcrumbItem>
        </Breadcrumbs>
      )}
      <Flex
        alignItems="center"
        justifyContent="space-between"
        gap="2"
        flexWrap="wrap"
      >
        <HStack gap="2" flexWrap="wrap">
          <Text variant="h2" as="h2">
            {name}
          </Text>
          {isFromOtherSource && <Chip size="sm">{packageName}</Chip>}
        </HStack>
        {href && <ReferenceShareButton path={href} name={name} />}
      </Flex>
      {isHidden && (
        <Alert tone="info">
          {t(
            "reference.hidden-in-list",
            "Hidden in your list. {{source}} is turned off in Sources, but links to it still open.",
            { source: hiddenSourceLabel ?? packageName ?? "" },
          )}
        </Alert>
      )}
    </Stack>
  );
}
