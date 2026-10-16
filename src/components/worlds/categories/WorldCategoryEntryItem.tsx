import LockIcon from "@mui/icons-material/Lock";
import { Box, Card, CardActionArea, Tooltip, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

import { LinkComponent } from "components/LinkComponent";

import { useWorldEntriesStore } from "stores/worldEntries.store";

import { ReadPermissions } from "repositories/shared.types";

import { IWorldEntry } from "services/worldEntries.service";

import { WorldEntryActions } from "../entries/WorldEntryActions";
import { WorldEntryIcon } from "../entries/WorldEntryIcon";
import type { WorldLinkProps } from "../worldNavigation";

// An entry in its category folder, drawn like a note card: its icon, its name
// with the subtitle beside it in grey, a lock when only Guides can see it in a
// guided world, and a menu with its actions.
export function WorldCategoryEntryItem({
  entry,
  subtitle,
  guided,
  linkProps,
  onDeleted,
  onError,
}: {
  entry: IWorldEntry;
  subtitle?: string;
  guided: boolean;
  linkProps: WorldLinkProps;
  onDeleted: () => void;
  onError: (cause: unknown) => void;
}) {
  const { t } = useTranslation();
  const permissions = useWorldEntriesStore(
    (store) => store.entryState.permissions[entry.id],
  );
  const canShare = !!permissions?.canChangePermissions && guided;
  const canDelete = !!permissions?.canDelete;
  const hasMenu = canShare || canDelete;
  const guidesOnly =
    guided && entry.readPermissions === ReadPermissions.OnlyGuides;
  const guidesOnlyLabel = t(
    "worlds.entries.guides-only-entry",
    "Only Guides can see this entry",
  );

  return (
    <Card
      component="li"
      variant="outlined"
      sx={{ mt: 1, position: "relative", display: "flex" }}
    >
      <CardActionArea
        LinkComponent={LinkComponent}
        {...linkProps}
        sx={{
          py: 1,
          pl: 1.5,
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
            alignItems: "baseline",
            gap: 1.25,
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
              variant="body2"
              color="text.secondary"
              sx={{ overflow: "hidden", textOverflow: "ellipsis", minWidth: 0 }}
            >
              {subtitle}
            </Typography>
          )}
        </Box>
        {guidesOnly && (
          <Tooltip title={guidesOnlyLabel}>
            <LockIcon
              role="img"
              aria-label={guidesOnlyLabel}
              aria-hidden={false}
              fontSize="small"
              sx={{ color: "text.disabled", fontSize: 16 }}
            />
          </Tooltip>
        )}
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
            canShare={canShare}
            canDelete={canDelete}
            onDeleted={onDeleted}
            onError={onError}
          />
        </Box>
      )}
    </Card>
  );
}
