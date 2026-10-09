import DeleteIcon from "@mui/icons-material/Delete";
import { Button, Stack } from "@mui/material";
import { useTranslation } from "react-i18next";

import { WorldSettingsSection } from "components/worlds/WorldSettingsSection";

import type { IWorldCategory } from "services/worldCategories.service";
import type { IWorldFieldDefinition } from "services/worldFieldDefinitions.service";

import { WorldCategoryDetails } from "./WorldCategoryDetails";
import { WorldCategoryFields } from "./WorldCategoryFields";

export function WorldCategorySettings({
  category,
  fields,
  canEdit,
  canDelete,
  configurationReady,
  onDelete,
}: {
  category: IWorldCategory;
  fields: IWorldFieldDefinition[];
  canEdit: boolean;
  canDelete: boolean;
  configurationReady: boolean;
  onDelete: () => void;
}) {
  const { t } = useTranslation();
  return (
    <Stack spacing={4}>
      <WorldCategoryDetails
        category={category}
        fields={fields}
        readOnly={!canEdit}
        disabled={!configurationReady}
      />
      <WorldCategoryFields
        category={category}
        fields={fields}
        canEdit={canEdit}
        canDelete={canDelete}
        configurationReady={configurationReady}
      />
      {canDelete && (
        <WorldSettingsSection
          danger
          title={t("worlds.settings.danger-zone", "Danger zone")}
          description={t(
            "worlds.categories.delete-help",
            "Only empty categories can be deleted. Deleting a category also deletes its fields.",
          )}
        >
          <Button
            color="error"
            variant="outlined"
            startIcon={<DeleteIcon />}
            disabled={!configurationReady}
            onClick={onDelete}
            aria-label={t("worlds.categories.delete-named", "Delete {{name}}", {
              name: category.name,
            })}
          >
            {t("worlds.categories.delete", "Delete category")}
          </Button>
        </WorldSettingsSection>
      )}
    </Stack>
  );
}
