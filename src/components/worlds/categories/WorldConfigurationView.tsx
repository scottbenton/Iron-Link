import { Alert, Button, Stack, Typography } from "@mui/material";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { LinkComponent } from "components/LinkComponent";
import type { WorldNavigation } from "components/worlds/worldNavigation";

import type { IWorldCategory } from "services/worldCategories.service";
import type { IWorldFieldDefinition } from "services/worldFieldDefinitions.service";

import { WorldCategoryFields } from "./WorldCategoryFields";
import { WorldConfigurationNavigation } from "./WorldConfigurationNavigation";

export function WorldConfigurationView({
  configurationNotice,
  categories,
  navigation,
  fields,
  canEdit,
  canDelete,
  configurationReady,
  busy,
  generalSettings,
  onAdd,
  onEdit,
  onDelete,
  onReorder,
}: {
  configurationNotice: string;
  categories: IWorldCategory[];
  navigation: WorldNavigation;
  fields: IWorldFieldDefinition[];
  canEdit: boolean;
  canDelete: boolean;
  configurationReady: boolean;
  busy: boolean;
  generalSettings: ReactNode;
  onAdd: () => void;
  onEdit: (category: IWorldCategory) => void;
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
    <Stack
      component="section"
      aria-label={t("worlds.settings.title", "World settings")}
      spacing={3}
    >
      <Typography
        component="h1"
        variant="h5"
        fontFamily={(theme) => theme.typography.fontFamilyTitle}
        sx={{ overflowWrap: "anywhere" }}
      >
        {t("worlds.settings.title", "World settings")}
      </Typography>
      <Stack
        alignItems="flex-start"
        sx={{
          gap: 3,
          flexDirection: "column",
          "@container world-configuration (min-width: 720px)": {
            flexDirection: "row",
          },
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
        <Stack spacing={2} sx={{ flex: 1, minWidth: 0, width: "100%" }}>
          <Typography color="text.secondary" variant="body2">
            {configurationNotice}
          </Typography>
          {selectedId === undefined ? (
            generalSettings
          ) : !selected ? (
            <Stack spacing={2}>
              <Alert severity="warning">
                {t(
                  "worlds.categories.not-found",
                  "This category is no longer available.",
                )}
              </Alert>
              <Button
                component={LinkComponent}
                {...navigation.getLinkProps({ type: "world" })}
                sx={{ alignSelf: "flex-start" }}
              >
                {t("worlds.categories.back-to-world", "Back to world")}
              </Button>
            </Stack>
          ) : (
            <Stack spacing={3}>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                useFlexGap
                sx={{ flexWrap: "wrap", gap: 1 }}
              >
                <Typography
                  component="h2"
                  variant="h6"
                  fontFamily={(theme) => theme.typography.fontFamilyTitle}
                  sx={{ overflowWrap: "anywhere" }}
                >
                  {selected.name}
                </Typography>
                <Stack
                  direction="row"
                  spacing={1}
                  useFlexGap
                  sx={{ flexWrap: "wrap" }}
                >
                  <Button
                    aria-label={
                      canEdit
                        ? t("worlds.categories.edit-named", "Edit {{name}}", {
                            name: selected.name,
                          })
                        : undefined
                    }
                    disabled={busy || (canEdit && !configurationReady)}
                    onClick={() => onEdit(selected)}
                  >
                    {canEdit
                      ? t("worlds.categories.edit", "Edit category")
                      : t("worlds.categories.view", "Category configuration")}
                  </Button>
                  {canDelete && (
                    <Button
                      color="error"
                      aria-label={t(
                        "worlds.categories.delete-named",
                        "Delete {{name}}",
                        { name: selected.name },
                      )}
                      disabled={busy || !configurationReady}
                      onClick={() => onDelete(selected)}
                    >
                      {t("worlds.categories.delete", "Delete category")}
                    </Button>
                  )}
                </Stack>
              </Stack>
              <WorldCategoryFields
                key={selected.id}
                category={selected}
                fields={fields}
                canEdit={canEdit}
                canDelete={canDelete}
                configurationReady={configurationReady && !busy}
              />
            </Stack>
          )}
        </Stack>
      </Stack>
    </Stack>
  );
}
