import DescriptionIcon from "@mui/icons-material/Description";
import LockIcon from "@mui/icons-material/Lock";
import { Box, Stack } from "@mui/material";
import { useTranslation } from "react-i18next";

import {
  type ResolvedWorldFieldDefinition,
  getWorldFieldKind,
} from "lib/worldFieldRules";

import { IWorldCategory } from "services/worldCategories.service";
import { IWorldEntry } from "services/worldEntries.service";

import type { WorldNavigation } from "../worldNavigation";
import { WorldEntryField } from "./WorldEntryField";
import { WorldEntryParentHints } from "./WorldEntryParentHints";
import { WorldEntryWell } from "./WorldEntryWell";
import { useResolvedWorldEntryFields } from "./useResolvedWorldEntryFields";
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
// They fill a grid of up to three columns, as wide as the page allows. Every
// field takes one column, whatever its kind or number of values, except a Text
// field set to Full width, which takes a whole row.
// A field a rule hides keeps its value. Read-only, empty fields are left out.
// Fields sit in a Details well. Guide-only fields are hidden from everyone
// else, and in a guided world they get a dashed Guide only well of their own.
// Editors also see a note above them for any field that cannot roll until the
// entry sits under the right parent.
export function WorldEntryFields({
  entry,
  canEdit,
  guided,
  navigation,
}: WorldEntryFieldsProps) {
  const { t } = useTranslation();
  const {
    fields: resolved,
    values,
    entries,
    isGuide,
    parentRequirements,
  } = useResolvedWorldEntryFields(entry);
  const fields = resolved.filter(
    (field) =>
      canEdit || hasWorldEntryFieldValue(field, values[field.id], entries),
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
      {canEdit && <WorldEntryParentHints hints={parentRequirements} />}
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

// Whether a field takes a whole row of the grid rather than one column. Only
// a Text field set to Full width does.
export function isWorldEntryFieldFullRow(
  field: Pick<ResolvedWorldFieldDefinition, "type" | "configuration">,
): boolean {
  return getWorldFieldKind(field) === "text" && !!field.configuration.fullWidth;
}
