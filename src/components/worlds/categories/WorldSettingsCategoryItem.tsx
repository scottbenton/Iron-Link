import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import FolderIcon from "@mui/icons-material/Folder";
import {
  Box,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import { useTranslation } from "react-i18next";

import { LinkComponent } from "components/LinkComponent";
import type { WorldLinkProps } from "components/worlds/worldNavigation";

import { IWorldCategory } from "services/worldCategories.service";

import { WorldCategoryIcon } from "./WorldCategoryIcon";

// A settings sidebar entry. The drag handle only appears for editors and is
// the only draggable part, so the row itself stays a normal link.
export function WorldSettingsCategoryItem({
  category,
  selected,
  sortable,
  disabled,
  linkProps,
}: {
  category: IWorldCategory;
  selected: boolean;
  sortable: boolean;
  disabled: boolean;
  linkProps?: WorldLinkProps;
}) {
  const { t } = useTranslation();
  const {
    setNodeRef,
    setActivatorNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id, disabled: !sortable || disabled });
  const dragLabel = t("worlds.categories.reorder-named", "Reorder {{name}}", {
    name: category.name,
  });
  const content = (
    <>
      <ListItemIcon sx={{ minWidth: 36 }}>
        {category.icon?.key ? (
          <WorldCategoryIcon icon={category.icon} size="small" />
        ) : (
          <FolderIcon color="action" />
        )}
      </ListItemIcon>
      <ListItemText
        primary={category.name}
        slotProps={{ primary: { sx: { overflowWrap: "anywhere" } } }}
      />
    </>
  );
  return (
    <ListItem
      ref={setNodeRef}
      disablePadding
      style={{ transform: CSS.Transform.toString(transform), transition }}
      sx={{
        position: "relative",
        zIndex: isDragging ? 1 : undefined,
        bgcolor: isDragging ? "background.paper" : undefined,
        boxShadow: isDragging ? 4 : undefined,
      }}
    >
      {linkProps ? (
        <ListItemButton
          LinkComponent={LinkComponent}
          {...linkProps}
          selected={selected}
          aria-current={selected ? "page" : undefined}
          sx={{ pr: sortable ? 6 : 2 }}
        >
          {content}
        </ListItemButton>
      ) : (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            py: 1,
            px: 2,
            pr: 6,
            flexGrow: 1,
          }}
        >
          {content}
        </Box>
      )}
      {sortable && (
        <IconButton
          ref={setActivatorNodeRef}
          {...attributes}
          {...listeners}
          size="small"
          aria-label={dragLabel}
          title={dragLabel}
          disabled={disabled}
          sx={{
            position: "absolute",
            right: 8,
            cursor: "grab",
            touchAction: "none",
          }}
        >
          <DragIndicatorIcon fontSize="small" />
        </IconButton>
      )}
    </ListItem>
  );
}
