import { Box, Button } from "@mui/material";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { EmptyState } from "components/Layout/EmptyState";
import { LinkComponent } from "components/LinkComponent";
import type { WorldNavigation } from "components/worlds/worldNavigation";

import type { IWorldCategory } from "services/worldCategories.service";
import type { IWorldFieldDefinition } from "services/worldFieldDefinitions.service";

import { WorldCategorySettings } from "./WorldCategorySettings";
import {
  NARROW_SETTINGS,
  WorldConfigurationNavigation,
} from "./WorldConfigurationNavigation";

export function WorldConfigurationView({
  categories,
  navigation,
  fields,
  canEdit,
  canDelete,
  configurationReady,
  busy,
  generalSettings,
  onAdd,
  onDelete,
  onReorder,
}: {
  categories: IWorldCategory[];
  navigation: WorldNavigation;
  fields: IWorldFieldDefinition[];
  canEdit: boolean;
  canDelete: boolean;
  configurationReady: boolean;
  busy: boolean;
  generalSettings: ReactNode;
  onAdd: () => void;
  onDelete: (category: IWorldCategory) => void;
  onReorder: (ids: string[]) => void;
}) {
  const { t } = useTranslation();
  const selectedId =
    navigation.view.type === "category-settings"
      ? navigation.view.categoryId
      : undefined;
  const selected = categories.find((category) => category.id === selectedId);
  return (
    <Box
      aria-label={t("worlds.settings.title", "World settings")}
      sx={{
        display: "flex",
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 3,
        [NARROW_SETTINGS]: { flexDirection: "column", alignItems: "stretch" },
      }}
    >
      <WorldConfigurationNavigation
        categories={categories}
        navigation={navigation}
        canEdit={canEdit}
        disabled={busy || !configurationReady}
        onAdd={onAdd}
        onReorder={onReorder}
      />
      <Box sx={{ flex: 1, minWidth: 0, width: "100%" }}>
        {selectedId === undefined ? (
          generalSettings
        ) : !selected ? (
          <EmptyState
            title={t("worlds.category.missing", "Category unavailable")}
            message={t(
              "worlds.categories.not-found",
              "This category is no longer available.",
            )}
            action={
              <Button
                LinkComponent={LinkComponent}
                {...navigation.getLinkProps({ type: "world" })}
              >
                {t("worlds.categories.back-to-world", "Back to world")}
              </Button>
            }
            sx={{ py: 4 }}
          />
        ) : (
          <WorldCategorySettings
            key={selected.id}
            category={selected}
            fields={fields}
            canEdit={canEdit}
            canDelete={canDelete}
            configurationReady={configurationReady && !busy}
            onDelete={() => onDelete(selected)}
          />
        )}
      </Box>
    </Box>
  );
}
