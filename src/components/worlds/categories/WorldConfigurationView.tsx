import { Box, Button, Stack, Typography } from "@mui/material";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import type { IWorldCategory } from "services/worldCategories.service";
import type { IWorldFieldDefinition } from "services/worldFieldDefinitions.service";

import { WorldCategoryFields } from "./WorldCategoryFields";
import { WorldConfigurationNavigation } from "./WorldConfigurationNavigation";

export function WorldConfigurationView({
  configurationNotice,
  categories,
  selectedId,
  fields,
  canEdit,
  canDelete,
  configurationReady,
  busy,
  generalSettings,
  onSelect,
  onAdd,
  onEdit,
  onDelete,
  onReorder,
  onDone,
}: {
  configurationNotice: string;
  categories: IWorldCategory[];
  selectedId?: string;
  fields: IWorldFieldDefinition[];
  canEdit: boolean;
  canDelete: boolean;
  configurationReady: boolean;
  busy: boolean;
  generalSettings: ReactNode;
  onSelect: (id: string | undefined) => void;
  onAdd: () => void;
  onEdit: (category: IWorldCategory) => void;
  onDelete: (category: IWorldCategory) => void;
  onReorder: (ids: string[]) => void;
  onDone: () => void;
}) {
  const { t } = useTranslation();
  const selected = categories.find((category) => category.id === selectedId);
  return (
    <Stack
      component="section"
      aria-label={t("worlds.settings.title", "World settings")}
      spacing={3}
    >
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        gap={2}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography component="h2" variant="h5">
            {t("worlds.settings.title", "World settings")}
          </Typography>
        </Box>
        <Button variant="outlined" onClick={onDone} disabled={busy}>
          {t("common.done", "Done")}
        </Button>
      </Stack>
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
          selectedId={selectedId}
          canEdit={canEdit}
          disabled={busy || !configurationReady}
          onSelect={onSelect}
          onAdd={onAdd}
          onReorder={onReorder}
        />
        <Stack spacing={2} sx={{ flex: 1, minWidth: 0, width: "100%" }}>
          <Typography color="text.secondary" variant="body2">
            {configurationNotice}
          </Typography>
          {!selected ? (
            generalSettings
          ) : (
            <Stack spacing={3}>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                useFlexGap
                sx={{ flexWrap: "wrap", gap: 1 }}
              >
                <Typography variant="h6" sx={{ overflowWrap: "anywhere" }}>
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
      {selected && (
        <Box>
          <Button variant="outlined" onClick={onDone} disabled={busy}>
            {t("common.done", "Done")}
          </Button>
        </Box>
      )}
    </Stack>
  );
}
