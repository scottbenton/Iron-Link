import { Box, Card, CardActionArea, Typography } from "@mui/material";

import { LinkComponent } from "components/LinkComponent";

import { IWorldCategory } from "services/worldCategories.service";
import { IWorldEntry } from "services/worldEntries.service";

import { WorldEntryActions } from "../entries/WorldEntryActions";
import { WorldEntryIcon } from "../entries/WorldEntryIcon";
import type { WorldLinkProps } from "../worldNavigation";
import { WorldEntryGuidesOnlyIcon } from "./WorldEntryGuidesOnlyIcon";
import { useWorldEntryItemActions } from "./useWorldEntryItemActions";

// An entry in its category folder, drawn like a note card: its icon, its name
// with the subtitle beside it in grey, a lock when only Guides can see it in a
// guided world, and a menu with its actions. An entry holding other entries
// is drawn as a folder card instead, its subtitle under its name.
export function WorldCategoryEntryItem({
  entry,
  category,
  subtitle,
  guided,
  linkProps,
  folder = false,
  onDeleted,
  onError,
}: {
  entry: IWorldEntry;
  category: Pick<IWorldCategory, "name" | "supportsHierarchy">;
  subtitle?: string;
  guided: boolean;
  linkProps: WorldLinkProps;
  folder?: boolean;
  onDeleted: () => void;
  onError: (cause: unknown) => void;
}) {
  const { canShare, canMove, canDelete, hasMenu, guidesOnly } =
    useWorldEntryItemActions(entry, category, guided);

  return (
    <Card
      component="li"
      variant="outlined"
      sx={{
        position: "relative",
        display: "flex",
        minWidth: 0,
        bgcolor: folder ? "background.default" : undefined,
      }}
    >
      <CardActionArea
        LinkComponent={LinkComponent}
        {...linkProps}
        sx={{
          py: folder ? 1.5 : 1,
          pl: folder ? 2 : 1.5,
          pr: hasMenu ? 6 : 1.5,
          display: "flex",
          alignItems: "center",
          gap: 1.25,
          minHeight: 48,
        }}
      >
        <WorldEntryIcon entry={entry} size="small" />
        <Box
          component="span"
          sx={{
            flexGrow: 1,
            minWidth: 0,
            display: "flex",
            flexDirection: folder ? "column" : "row",
            alignItems: folder ? "flex-start" : "baseline",
            gap: folder ? 0 : 1.25,
            overflow: "hidden",
            whiteSpace: "nowrap",
          }}
        >
          <Typography
            component="span"
            sx={{
              overflow: "hidden",
              textOverflow: "ellipsis",
              flexShrink: 0,
              maxWidth: "100%",
            }}
          >
            {entry.name}
          </Typography>
          {subtitle && (
            <Typography
              component="span"
              variant={folder ? "caption" : "body2"}
              color="text.secondary"
              sx={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                minWidth: 0,
                maxWidth: "100%",
              }}
            >
              {subtitle}
            </Typography>
          )}
        </Box>
        {guidesOnly && <WorldEntryGuidesOnlyIcon />}
      </CardActionArea>
      {hasMenu && (
        <Box
          sx={{
            position: "absolute",
            right: 8,
            top: "50%",
            transform: "translateY(-50%)",
          }}
        >
          <WorldEntryActions
            entry={entry}
            variant="card"
            categoryName={category.name}
            canShare={canShare}
            canMove={canMove}
            canDelete={canDelete}
            onDeleted={onDeleted}
            onError={onError}
          />
        </Box>
      )}
    </Card>
  );
}
