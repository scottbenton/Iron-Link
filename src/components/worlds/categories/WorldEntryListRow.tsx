import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { Box, ButtonBase, IconButton, Typography } from "@mui/material";
import { useId } from "react";
import { useTranslation } from "react-i18next";

import { LinkComponent } from "components/LinkComponent";

import { useIsTouchDevice } from "hooks/useIsTouchDevice";

import { useWorldEntryLayoutStore } from "stores/worldEntryLayout.store";

import { IWorldCategory } from "services/worldCategories.service";
import { IWorldEntry } from "services/worldEntries.service";

import { WorldEntryActions } from "../entries/WorldEntryActions";
import { WorldEntryIcon } from "../entries/WorldEntryIcon";
import type { WorldNavigation } from "../worldNavigation";
import { WorldEntryGuidesOnlyIcon } from "./WorldEntryGuidesOnlyIcon";
import { useWorldEntryItemActions } from "./useWorldEntryItemActions";

const INDENT = 3;

// One entry in a list: a button that opens or closes the entries inside it
// (or a gap the same width), then a link to the entry with its icon, name and
// subtitle, the Guides-only lock and its menu. Its open branch is a nested
// list under it.
export function WorldEntryListRow({
  entry,
  subtitle,
  depth,
  ancestorIds,
  tree,
  subtitleOf,
  category,
  guided,
  navigation,
  onDeleted,
  onError,
}: {
  entry: IWorldEntry;
  subtitle?: string;
  depth: number;
  // Existing bad data may hold a loop; a branch never repeats its ancestors.
  ancestorIds: string[];
  tree: Record<string, IWorldEntry[]>;
  subtitleOf: (entry: IWorldEntry) => string | undefined;
  category: IWorldCategory;
  guided: boolean;
  navigation: Pick<WorldNavigation, "getLinkProps">;
  onDeleted: () => void;
  onError: (cause: unknown) => void;
}) {
  const { t } = useTranslation();
  const touch = useIsTouchDevice();
  const branchId = useId();
  const { canShare, canMove, canDelete, hasMenu, guidesOnly } =
    useWorldEntryItemActions(entry, category, guided);
  const open = useWorldEntryLayoutStore(
    (state) => !!state.expanded[category.id]?.includes(entry.id),
  );
  const setExpanded = useWorldEntryLayoutStore((state) => state.setExpanded);
  const path = [...ancestorIds, entry.id];
  const inside = (tree[entry.id] ?? []).filter(
    (child) => !path.includes(child.id),
  );
  const hasChildren = inside.length > 0;
  const rowHeight = touch ? 44 : 40;

  return (
    <Box component="li" sx={{ minWidth: 0 }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          minHeight: rowHeight,
          pl: 0.5 + depth * INDENT,
          pr: 0.5,
          gap: 0.25,
          "&:hover": { bgcolor: "action.hover" },
        }}
      >
        {hasChildren ? (
          <IconButton
            size="small"
            aria-label={t("worlds.entries.places-in", "Places in {{name}}", {
              name: entry.name,
            })}
            aria-expanded={open}
            aria-controls={open ? branchId : undefined}
            onClick={() => setExpanded(category.id, entry.id, !open)}
            sx={{ width: rowHeight - 8, height: rowHeight - 8 }}
          >
            <ChevronRightIcon
              fontSize="small"
              sx={{
                transition: "transform 120ms",
                transform: open ? "rotate(90deg)" : undefined,
                "@media (prefers-reduced-motion: reduce)": {
                  transition: "none",
                },
              }}
            />
          </IconButton>
        ) : (
          <Box sx={{ width: rowHeight - 8, flexShrink: 0 }} />
        )}
        <ButtonBase
          LinkComponent={LinkComponent}
          {...navigation.getLinkProps({
            type: "entry",
            categoryId: category.id,
            entryId: entry.id,
          })}
          sx={{
            flexGrow: 1,
            minWidth: 0,
            alignSelf: "stretch",
            justifyContent: "flex-start",
            gap: 1.25,
            px: 0.75,
            borderRadius: 1,
            textAlign: "left",
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
                sx={{
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  minWidth: 0,
                }}
              >
                {subtitle}
              </Typography>
            )}
          </Box>
          {guidesOnly && <WorldEntryGuidesOnlyIcon />}
        </ButtonBase>
        {hasMenu && (
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
        )}
      </Box>
      {hasChildren && open && (
        <Box
          component="ul"
          id={branchId}
          sx={{ listStyle: "none", m: 0, p: 0 }}
        >
          {inside.map((child) => (
            <WorldEntryListRow
              key={child.id}
              entry={child}
              subtitle={subtitleOf(child)}
              depth={depth + 1}
              ancestorIds={path}
              tree={tree}
              subtitleOf={subtitleOf}
              category={category}
              guided={guided}
              navigation={navigation}
              onDeleted={onDeleted}
              onError={onError}
            />
          ))}
        </Box>
      )}
    </Box>
  );
}
