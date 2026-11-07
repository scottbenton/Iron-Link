import { Alert, Box, Breadcrumbs, Chip, Link, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

import { LinkComponent } from "components/LinkComponent";

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
    <Box mb={2}>
      {parentName && parentHref && (
        <Breadcrumbs aria-label={t("reference.breadcrumbs", "Breadcrumbs")}>
          <Link
            component={LinkComponent}
            href={parentHref}
            color="text.secondary"
            underline="hover"
          >
            {parentName}
          </Link>
          <Typography color="text.primary" aria-current="page">
            {name}
          </Typography>
        </Breadcrumbs>
      )}
      <Box
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        gap={1}
        flexWrap="wrap"
        mt={0.5}
      >
        <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
          <Typography
            variant="h5"
            component="h2"
            fontFamily={(theme) => theme.typography.fontFamilyTitle}
            textTransform="uppercase"
          >
            {name}
          </Typography>
          {isFromOtherSource && (
            <Chip size="small" variant="outlined" label={packageName} />
          )}
        </Box>
        {href && <ReferenceShareButton path={href} name={name} />}
      </Box>
      {isHidden && (
        <Alert severity="info" variant="outlined" sx={{ mt: 1 }}>
          {t(
            "reference.hidden-in-list",
            "Hidden in your list. {{source}} is turned off in Sources, but links to it still open.",
            { source: hiddenSourceLabel ?? packageName ?? "" },
          )}
        </Alert>
      )}
    </Box>
  );
}
