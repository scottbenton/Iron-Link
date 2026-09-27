import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import { Button, IconButton, Paper, Stack, Tooltip } from "@mui/material";

import { IWorldCategory } from "services/worldCategories.service";

import { WorldCategoryIcon } from "./WorldCategoryIcon";

export function WorldCategoryConfigurationRow({
  category,
  selected,
  canEdit,
  canDelete,
  disabled,
  onSelect,
  onEdit,
  onDelete,
}: {
  category: IWorldCategory;
  selected: boolean;
  canEdit: boolean;
  canDelete: boolean;
  disabled: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const {
    setNodeRef,
    setActivatorNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id, disabled: !canEdit || disabled });
  return (
    <Paper
      ref={setNodeRef}
      role="group"
      aria-label={`${category.name} category`}
      variant="outlined"
      style={{ transform: CSS.Transform.toString(transform), transition }}
      sx={{
        p: 0.5,
        borderColor: selected ? "primary.main" : "divider",
        position: "relative",
        zIndex: isDragging ? 1 : undefined,
      }}
    >
      <Stack direction="row" alignItems="center">
        {canEdit && (
          <Tooltip title={`Reorder ${category.name}`}>
            <span>
              <IconButton
                ref={setActivatorNodeRef}
                {...attributes}
                {...listeners}
                aria-label={`Reorder ${category.name}`}
                disabled={disabled}
                sx={{ cursor: "grab", touchAction: "none" }}
              >
                <DragIndicatorIcon />
              </IconButton>
            </span>
          </Tooltip>
        )}
        <Button
          onClick={onSelect}
          aria-pressed={selected}
          startIcon={<WorldCategoryIcon icon={category.icon} />}
          sx={{ flex: 1, justifyContent: "flex-start" }}
        >
          {category.name}
        </Button>
        {canEdit && (
          <Tooltip title={`Edit ${category.name}`}>
            <span>
              <IconButton
                aria-label={`Edit ${category.name}`}
                disabled={disabled}
                onClick={onEdit}
              >
                <EditOutlinedIcon />
              </IconButton>
            </span>
          </Tooltip>
        )}
        {canDelete && (
          <Tooltip title={`Delete ${category.name}`}>
            <span>
              <IconButton
                aria-label={`Delete ${category.name}`}
                disabled={disabled}
                color="error"
                onClick={onDelete}
              >
                <DeleteOutlineIcon />
              </IconButton>
            </span>
          </Tooltip>
        )}
      </Stack>
    </Paper>
  );
}
