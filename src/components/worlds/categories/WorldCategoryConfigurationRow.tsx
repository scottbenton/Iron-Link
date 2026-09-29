import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import { Button, IconButton, Paper, Stack, Tooltip } from "@mui/material";

import { LinkComponent } from "components/LinkComponent";
import type { WorldLinkProps } from "components/worlds/worldNavigation";

import { IWorldCategory } from "services/worldCategories.service";

import { WorldCategoryIcon } from "./WorldCategoryIcon";

export function WorldCategoryConfigurationRow({
  category,
  selected,
  canEdit,
  disabled,
  linkProps,
}: {
  category: IWorldCategory;
  selected: boolean;
  canEdit: boolean;
  disabled: boolean;
  linkProps: WorldLinkProps;
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
          component={LinkComponent}
          {...linkProps}
          aria-current={selected ? "page" : undefined}
          startIcon={<WorldCategoryIcon icon={category.icon} />}
          sx={{
            flex: 1,
            minWidth: 0,
            overflowWrap: "anywhere",
            textAlign: "left",
            justifyContent: "flex-start",
          }}
        >
          {category.name}
        </Button>
      </Stack>
    </Paper>
  );
}
