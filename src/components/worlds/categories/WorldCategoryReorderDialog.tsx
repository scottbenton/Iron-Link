import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  List,
} from "@mui/material";
import { useTranslation } from "react-i18next";

import { DialogTitleWithCloseButton } from "components/DialogTitleWithCloseButton";

import type { IWorldCategory } from "services/worldCategories.service";

import { WorldConfigurationSortList } from "./WorldConfigurationSortList";
import { WorldSettingsCategoryItem } from "./WorldSettingsCategoryItem";

// Narrow settings have no sidebar, so category order is edited here. Each
// drop saves immediately, like the sidebar.
export function WorldCategoryReorderDialog({
  categories,
  disabled,
  onReorder,
  onClose,
}: {
  categories: IWorldCategory[];
  disabled: boolean;
  onReorder: (ids: string[]) => void;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  return (
    <Dialog open fullWidth maxWidth="xs" onClose={onClose}>
      <DialogTitleWithCloseButton onClose={onClose}>
        {t("worlds.categories.reorder", "Reorder categories")}
      </DialogTitleWithCloseButton>
      <DialogContent sx={{ px: 1 }}>
        <List disablePadding>
          <WorldConfigurationSortList
            items={categories.map((category) => ({
              id: category.id,
              label: category.name,
            }))}
            onReorder={onReorder}
          >
            {categories.map((category) => (
              <WorldSettingsCategoryItem
                key={category.id}
                category={category}
                selected={false}
                sortable
                disabled={disabled}
              />
            ))}
          </WorldConfigurationSortList>
        </List>
      </DialogContent>
      <DialogActions>
        <Button variant="contained" onClick={onClose}>
          {t("common.done", "Done")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
