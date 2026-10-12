import { Box } from "@mui/material";
import { useTranslation } from "react-i18next";

import { IWorldCategory } from "services/worldCategories.service";
import { IWorldEntry } from "services/worldEntries.service";

export interface WorldEntryFieldsProps {
  entry: IWorldEntry;
  category: IWorldCategory;
  // False for viewers and anyone the entry's edit permissions exclude; every
  // field then renders read-only.
  canEdit: boolean;
  // Whether Guide-only fields are marked apart; see
  // useWorldPermissionControlsShown.
  permissionControlsShown: boolean;
}

// The entry's field values, laid out below the entry header. Field inputs are
// not available yet, so the section is empty for now.
export function WorldEntryFields({ entry }: WorldEntryFieldsProps) {
  const { t } = useTranslation();
  return (
    <Box
      component="section"
      aria-label={t("worlds.entries.fields", "{{name}} fields", {
        name: entry.name,
      })}
    />
  );
}
