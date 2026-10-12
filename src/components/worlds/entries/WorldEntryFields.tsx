import { Stack } from "@mui/material";
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
  resolveFieldDefinition,
} from "lib/worldFieldRules";
import { getWorldFieldSnapshot } from "lib/worldFieldSnapshot";

import { isGuideEquivalent } from "repositories/shared.types";

import { IWorldCategory } from "services/worldCategories.service";
import { IWorldEntry } from "services/worldEntries.service";

import type { WorldNavigation } from "../worldNavigation";
import { WorldEntryField } from "./WorldEntryField";
import { WorldEntryFieldSection } from "./WorldEntryFieldSection";
import { hasWorldEntryFieldValue } from "./worldEntryFieldValue";

export interface WorldEntryFieldsProps {
  entry: IWorldEntry;
  category: IWorldCategory;
  // False for viewers and anyone the entry's edit permissions exclude; every
  // field then renders read-only.
  canEdit: boolean;
  // Whether Guide-only fields are marked apart; see
  // useWorldPermissionControlsShown.
  permissionControlsShown: boolean;
  navigation: WorldNavigation;
}

// The entry's fields in their configured order, each with the visibility,
// label and help text its rules give it for this entry and its ancestors.
// A field a rule hides keeps its value. Read-only, empty fields are left out.
// Guide-only fields are hidden from everyone else, and set apart for Guides
// only when the world has players they are hidden from.
export function WorldEntryFields({
  entry,
  category,
  canEdit,
  permissionControlsShown,
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
  const marked = permissionControlsShown && isGuide;
  const sharedFields = marked
    ? fields.filter((field) => !field.gmOnly)
    : fields;
  const guideFields = marked ? fields.filter((field) => field.gmOnly) : [];

  const renderField = (field: ResolvedWorldFieldDefinition) => (
    <WorldEntryField
      // Keyed by entry too, so typing never carries over to another entry.
      key={`${entry.id}-${field.id}`}
      entry={entry}
      field={field}
      value={values[field.id]}
      canEdit={canEdit}
      navigation={navigation}
    />
  );

  return (
    <Stack
      component="section"
      spacing={3}
      aria-label={t("worlds.entries.fields", "{{name}} fields", {
        name: entry.name,
      })}
    >
      {sharedFields.map(renderField)}
      {guideFields.length > 0 && (
        <WorldEntryFieldSection
          title={t("worlds.entries.guide-only", "Guide only")}
          description={t(
            "worlds.entries.guide-only-description",
            "Players never see these fields.",
          )}
        >
          {guideFields.map(renderField)}
        </WorldEntryFieldSection>
      )}
    </Stack>
  );
}
