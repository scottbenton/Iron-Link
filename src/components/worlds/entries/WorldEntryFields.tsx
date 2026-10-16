import DescriptionIcon from "@mui/icons-material/Description";
import LockIcon from "@mui/icons-material/Lock";
import { Box, Stack } from "@mui/material";
import { useTranslation } from "react-i18next";

import { useWorldFieldEntrySnapshots } from "hooks/useWorldFieldEntrySnapshots";

import { useWorldPermission } from "stores/world.store";
import { useWorldCategoriesStore } from "stores/worldCategories.store";
import {
  useWorldEntriesStore,
  useWorldEntryFieldValues,
} from "stores/worldEntries.store";

import {
  type ResolvedWorldFieldDefinition,
  getWorldFieldKind,
  resolveFieldDefinition,
} from "lib/worldFieldRules";
import { getWorldFieldSnapshot } from "lib/worldFieldSnapshot";

import { isGuideEquivalent } from "repositories/shared.types";

import { IWorldCategory } from "services/worldCategories.service";
import { IWorldEntry } from "services/worldEntries.service";

import type { WorldNavigation } from "../worldNavigation";
import { WorldEntryField } from "./WorldEntryField";
import { WorldEntryWell } from "./WorldEntryWell";
import { hasWorldEntryFieldValue } from "./worldEntryFieldValue";

export interface WorldEntryFieldsProps {
  entry: IWorldEntry;
  category: IWorldCategory;
  // False for viewers and anyone the entry's edit permissions exclude; every
  // field then renders read-only.
  canEdit: boolean;
  // Whether Guide-only fields get a well of their own; see useWorldIsGuided.
  guided: boolean;
  navigation: WorldNavigation;
}

// The entry's fields in their configured order, each with the visibility,
// label and help text its rules give it for this entry and its ancestors.
// They fill a grid of up to three columns, as wide as the page allows. A
// field with several values, a Full width Text field, and Long text each take
// a whole row.
// A field a rule hides keeps its value. Read-only, empty fields are left out.
// Fields sit in a Details well. Guide-only fields are hidden from everyone
// else, and in a guided world they get a dashed Guide only well of their own.
export function WorldEntryFields({
  entry,
  category,
  canEdit,
  guided,
  navigation,
}: WorldEntryFieldsProps) {
  const { t } = useTranslation();
  const permission = useWorldPermission();
  const isGuide = !!permission && isGuideEquivalent(permission);
  const definitions = useWorldCategoriesStore((store) =>
    Object.values(store.fieldDefinitions)
      .filter(
        (definition) =>
          definition.categoryId === category.id &&
          (isGuide || !definition.gmOnly),
      )
      .sort((a, b) => a.sortOrder - b.sortOrder),
  );
  const entries = useWorldEntriesStore((store) => store.entryState.entries);
  const values = useWorldEntryFieldValues(entry.id);
  const snapshots = useWorldFieldEntrySnapshots();
  const snapshot = getWorldFieldSnapshot(entry.id, snapshots) ?? {
    entry: { id: entry.id, parentId: entry.parentEntryId, values: {} },
    entries: snapshots,
  };

  const fields = definitions
    .map((definition) => resolveFieldDefinition(definition, snapshot))
    .filter(
      (field) =>
        field.visible &&
        (canEdit || hasWorldEntryFieldValue(field, values[field.id], entries)),
    );
  const marked = guided && isGuide;
  const sharedFields = marked
    ? fields.filter((field) => !field.gmOnly)
    : fields;
  const guideFields = marked ? fields.filter((field) => field.gmOnly) : [];

  const renderField = (field: ResolvedWorldFieldDefinition) => (
    <Box
      // Keyed by entry too, so typing never carries over to another entry.
      key={`${entry.id}-${field.id}`}
      sx={
        isWorldEntryFieldFullRow(field) ? { gridColumn: "1 / -1" } : undefined
      }
    >
      <WorldEntryField
        entry={entry}
        field={field}
        value={values[field.id]}
        canEdit={canEdit}
        navigation={navigation}
      />
    </Box>
  );
  const renderGrid = (wellFields: ResolvedWorldFieldDefinition[]) => (
    <Box sx={{ containerType: "inline-size" }}>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr)",
          columnGap: 3,
          rowGap: 1.5,
          "@container (min-width: 360px)": {
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          },
          "@container (min-width: 640px)": {
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
          },
        }}
      >
        {wellFields.map(renderField)}
      </Box>
    </Box>
  );

  if (sharedFields.length === 0 && guideFields.length === 0) return null;
  return (
    <Stack
      component="section"
      spacing={2}
      aria-label={t("worlds.entries.fields", "{{name}} fields", {
        name: entry.name,
      })}
    >
      {sharedFields.length > 0 && (
        <WorldEntryWell
          variant="details"
          title={t("worlds.entries.details", "Details")}
          icon={<DescriptionIcon />}
        >
          {renderGrid(sharedFields)}
        </WorldEntryWell>
      )}
      {guideFields.length > 0 && (
        <WorldEntryWell
          variant="guide"
          title={t("worlds.entries.guide-only", "Guide only")}
          description={t(
            "worlds.entries.guide-only-description",
            "Players never see these",
          )}
          icon={<LockIcon />}
        >
          {renderGrid(guideFields)}
        </WorldEntryWell>
      )}
    </Stack>
  );
}

// Whether a field takes a whole row of the grid rather than one column.
export function isWorldEntryFieldFullRow(
  field: Pick<ResolvedWorldFieldDefinition, "type" | "configuration">,
): boolean {
  switch (getWorldFieldKind(field)) {
    case "longText":
      return true;
    case "text":
      return !!field.configuration.fullWidth;
    default:
      return !!field.configuration.multiple;
  }
}
