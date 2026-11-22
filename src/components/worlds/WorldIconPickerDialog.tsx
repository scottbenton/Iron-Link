import AddPhotoIcon from "@mui/icons-material/AddPhotoAlternate";
import SearchIcon from "@mui/icons-material/Search";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  IconButton,
  InputAdornment,
  LinearProgress,
  Link,
  Stack,
  Tab,
  Tabs,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from "@mui/material";
import type { TFunction } from "i18next";
import { useDeferredValue, useEffect, useId, useState } from "react";
import { useTranslation } from "react-i18next";

import { DialogTitleWithCloseButton } from "components/DialogTitleWithCloseButton";
import { EmptyState } from "components/Layout/EmptyState";

import { IconColors, IconDefinition } from "types/Icon.type";

import { useIsTouchDevice } from "hooks/useIsTouchDevice";

import { GameIconGlyph } from "./categories/GameIconGlyph";
import { WorldCategoryIcon } from "./categories/WorldCategoryIcon";
import {
  MATERIAL_CATEGORY_ICON_KEYS,
  categoryIconName,
  getCanonicalCategoryIconKey,
  getCategoryIconColor,
  getCategoryIconPaths,
  getLoadedCategoryIcons,
  isMaterialCategoryIconKey,
  loadCategoryIcons,
} from "./categories/categoryIcons";
import { MaterialCategoryIconGlyph } from "./categories/materialCategoryIcons";

const BATCH_SIZE = 240;

function getColorLabel(t: TFunction, color: IconColors): string {
  switch (color) {
    case IconColors.White:
      return t("worlds.categories.color-default", "Default");
    case IconColors.Pink:
      return t("worlds.categories.color-pink", "Pink");
    case IconColors.Red:
      return t("worlds.categories.color-red", "Red");
    case IconColors.Orange:
      return t("worlds.categories.color-orange", "Orange");
    case IconColors.Yellow:
      return t("worlds.categories.color-yellow", "Yellow");
    case IconColors.Green:
      return t("worlds.categories.color-green", "Green");
    case IconColors.Blue:
      return t("worlds.categories.color-blue", "Blue");
    case IconColors.Purple:
      return t("worlds.categories.color-purple", "Purple");
    case IconColors.Grey:
      return t("worlds.categories.color-grey", "Grey");
    case IconColors.Brown:
      return t("worlds.categories.color-brown", "Brown");
  }
}

// Follows Crew Link's image editor: color swatches, a filterable scrolling
// icon grid, and a live preview. Nothing is saved until Save.
// Chooses an icon and its color for a world category or entry. It opens on
// the icon shown today (an entry's own, else the one it inherits) so either
// the icon or the color can be changed alone. An entry's picker passes
// onUploadImage, which adds Icon and Image tabs so an upload is as easy to
// find as an icon; categories have no images and get no tabs. Both tabs
// share one grid cell, so switching never resizes the dialog.
export function WorldIconPickerDialog({
  value,
  inherited = null,
  title,
  onSave,
  onClose,
  onUploadImage,
  uploadDisabled = false,
}: {
  value: IconDefinition | null;
  // Shown when value has no icon. Saving it unchanged keeps inheriting.
  inherited?: IconDefinition | null;
  title: string;
  onSave: (value: IconDefinition | null) => void;
  onClose: () => void;
  // Starts the upload with the dropped file, or with none to open the file
  // chooser. The caller closes the picker once a file reaches cropping, so a
  // cancelled or refused file leaves it open.
  onUploadImage?: (file?: File) => void;
  uploadDisabled?: boolean;
}) {
  const { t } = useTranslation();
  const initial = value?.key ? value : inherited?.key ? inherited : null;
  const [draft, setDraft] = useState<IconDefinition>({
    key: initial?.key ?? null,
    color: initial?.color ?? IconColors.Grey,
  });
  const [search, setSearch] = useState("");
  const query = useDeferredValue(search.trim().toLowerCase());
  const [limit, setLimit] = useState(BATCH_SIZE);
  // One tooltip at a time, closed on scroll: the icons move under a still
  // pointer, which never leaves the one it opened on.
  const [tooltipKey, setTooltipKey] = useState<string | null>(null);
  const [icons, setIcons] = useState(getLoadedCategoryIcons);
  const [error, setError] = useState(false);
  useEffect(() => {
    if (icons) return;
    let active = true;
    loadCategoryIcons()
      .then((loaded) => {
        if (active) setIcons(loaded);
      })
      .catch(() => {
        if (active) setError(true);
      });
    return () => {
      active = false;
    };
  }, [icons]);
  // The icon it opened on leads the grid, so it is in view and selected. A
  // renamed icon's stored key stands in for its new name, so it shows once.
  const initialKey =
    initial?.key &&
    (isMaterialCategoryIconKey(initial.key) ||
      getCategoryIconPaths(icons, initial.key))
      ? initial.key
      : null;
  const initialCanonicalKey =
    initialKey && getCanonicalCategoryIconKey(initialKey);
  const matches = [
    ...(initialKey ? [initialKey] : []),
    ...[...MATERIAL_CATEGORY_ICON_KEYS, ...Object.keys(icons ?? {})].filter(
      (key) => key !== initialKey && key !== initialCanonicalKey,
    ),
  ].filter((key) => categoryIconName(key).toLowerCase().includes(query));
  const color = draft.color ?? IconColors.Grey;
  const [tab, setTab] = useState<"icon" | "image">("icon");
  const tabsId = useId();
  const [dragging, setDragging] = useState(false);
  const touch = useIsTouchDevice();
  return (
    <Dialog open fullWidth maxWidth="sm" onClose={onClose}>
      <DialogTitleWithCloseButton onClose={onClose}>
        {title}
      </DialogTitleWithCloseButton>
      {onUploadImage && (
        <Tabs
          value={tab}
          onChange={(_, next: "icon" | "image") => setTab(next)}
          sx={{ px: 3, borderBottom: 1, borderColor: "divider" }}
        >
          <Tab
            value="icon"
            label={t("worlds.entries.icon-tab", "Icon")}
            id={`${tabsId}-icon`}
            aria-controls={`${tabsId}-icon-panel`}
          />
          <Tab
            value="image"
            label={t("worlds.entries.image-tab", "Image")}
            id={`${tabsId}-image`}
            aria-controls={`${tabsId}-image-panel`}
          />
        </Tabs>
      )}
      <DialogContent
        {...(onUploadImage && {
          role: "tabpanel",
          id: `${tabsId}-${tab}-panel`,
          "aria-labelledby": `${tabsId}-${tab}`,
        })}
        sx={onUploadImage ? { pt: 2 } : undefined}
      >
        <Box sx={{ display: "grid", "& > *": { gridArea: "1 / 1" } }}>
          {onUploadImage && (
            <Stack
              alignItems="center"
              justifyContent="center"
              onDragOver={(event) => {
                if (uploadDisabled) return;
                event.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(event) => {
                event.preventDefault();
                setDragging(false);
                const file = event.dataTransfer.files[0];
                if (!file || uploadDisabled) return;
                onUploadImage(file);
              }}
              sx={{
                // Phones show one tab at a time; wider screens keep both in
                // the cell so the dialog keeps the Icon tab's size.
                display: { xs: tab === "image" ? "flex" : "none", sm: "flex" },
                minHeight: { xs: 280, sm: 0 },
                visibility: tab === "image" ? undefined : "hidden",
                border: 2,
                borderStyle: "dashed",
                borderColor: dragging ? "primary.main" : "divider",
                bgcolor: dragging ? "action.hover" : undefined,
                borderRadius: 1,
                p: 3,
              }}
            >
              <EmptyState
                title={t("worlds.entries.upload-image-title", "Use an image")}
                message={
                  touch
                    ? t(
                        "worlds.entries.upload-image-description-touch",
                        "Upload a picture to use as this entry's icon. You choose which part shows next.",
                      )
                    : t(
                        "worlds.entries.upload-image-description",
                        "Drop a picture here or upload one to use as this entry's icon. You choose which part shows next.",
                      )
                }
                action={
                  <Button
                    variant="contained"
                    startIcon={<AddPhotoIcon />}
                    disabled={uploadDisabled}
                    onClick={() => {
                      onUploadImage();
                    }}
                  >
                    {t("worlds.entries.upload-image", "Upload image")}
                  </Button>
                }
              />
            </Stack>
          )}
          <Box
            sx={{
              flexDirection: { xs: "column-reverse", sm: "row" },
              gap: 2,
              display: { xs: tab === "icon" ? "flex" : "none", sm: "flex" },
              visibility: tab === "icon" ? undefined : "hidden",
            }}
          >
            <Stack spacing={1.5} sx={{ flexGrow: 1, minWidth: 0 }}>
              <ToggleButtonGroup
                exclusive
                size="small"
                value={color}
                aria-label={t("worlds.categories.icon-color", "Icon color")}
                onChange={(_, next: IconColors | null) =>
                  next && setDraft({ ...draft, color: next })
                }
                sx={{ display: "flex" }}
              >
                {Object.values(IconColors).map((option) => (
                  <ToggleButton
                    key={option}
                    value={option}
                    aria-label={getColorLabel(t, option)}
                    sx={{ flexGrow: 1, px: 0.5, py: 1 }}
                  >
                    <Box
                      sx={(theme) => ({
                        width: 18,
                        height: 18,
                        borderRadius: "50%",
                        bgcolor: getCategoryIconColor(
                          option,
                          theme.palette.mode,
                        ),
                        border: 1,
                        borderColor: "divider",
                      })}
                    />
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
              <TextField
                autoFocus
                size="small"
                label={t("worlds.categories.search-icons", "Search icons")}
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setLimit(BATCH_SIZE);
                }}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon fontSize="small" />
                      </InputAdornment>
                    ),
                  },
                }}
              />
              <Box
                onScroll={(event) => {
                  setTooltipKey(null);
                  const target = event.currentTarget;
                  if (
                    target.scrollTop + target.clientHeight >
                    target.scrollHeight - 160
                  )
                    setLimit((current) =>
                      Math.min(current + BATCH_SIZE, matches.length),
                    );
                }}
                sx={{
                  height: 280,
                  overflowY: "auto",
                  border: 1,
                  borderColor: "divider",
                  borderRadius: 1,
                  p: 0.5,
                }}
              >
                {error ? (
                  <Alert severity="error">
                    {t(
                      "worlds.categories.icons-error",
                      "Could not load icons. Please reload and try again.",
                    )}
                  </Alert>
                ) : !icons ? (
                  <LinearProgress />
                ) : matches.length === 0 ? (
                  <Typography color="text.secondary" sx={{ p: 1 }}>
                    {t("worlds.categories.no-icons", "No matching icons.")}
                  </Typography>
                ) : (
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fill, minmax(44px, 1fr))",
                    }}
                  >
                    {matches.slice(0, limit).map((key) => (
                      <Tooltip
                        key={key}
                        title={categoryIconName(key)}
                        open={tooltipKey === key}
                        onOpen={() => setTooltipKey(key)}
                        onClose={() =>
                          setTooltipKey((open) => (open === key ? null : open))
                        }
                      >
                        <IconButton
                          aria-label={categoryIconName(key)}
                          aria-pressed={draft.key === key}
                          onClick={() => setDraft({ ...draft, key })}
                          sx={(theme) => ({
                            borderRadius: 1,
                            color: getCategoryIconColor(
                              draft.color,
                              theme.palette.mode,
                            ),
                            bgcolor:
                              draft.key === key ? "action.selected" : undefined,
                          })}
                        >
                          {isMaterialCategoryIconKey(key) ? (
                            <MaterialCategoryIconGlyph iconKey={key} />
                          ) : (
                            <GameIconGlyph
                              paths={getCategoryIconPaths(icons, key) ?? []}
                            />
                          )}
                        </IconButton>
                      </Tooltip>
                    ))}
                  </Box>
                )}
              </Box>
              <Typography variant="caption" color="text.secondary">
                {t("worlds.categories.icon-credit-prefix", "Icons by")}{" "}
                <Link
                  href="https://game-icons.net/"
                  target="_blank"
                  rel="noreferrer"
                >
                  Game Icons
                </Link>
                {" ("}
                <Link
                  href="https://creativecommons.org/licenses/by/3.0/"
                  target="_blank"
                  rel="noreferrer"
                >
                  CC BY 3.0
                </Link>
                {") · "}
                <Link
                  href="https://fonts.google.com/icons"
                  target="_blank"
                  rel="noreferrer"
                >
                  Material Icons
                </Link>
              </Typography>
            </Stack>
            <Stack spacing={1} alignItems="center" sx={{ flexShrink: 0 }}>
              <Typography variant="overline" color="text.secondary">
                {t("worlds.categories.icon-preview", "Preview")}
              </Typography>
              {draft.key ? (
                <WorldCategoryIcon icon={draft} size="xlarge" />
              ) : (
                <Box
                  sx={{
                    width: 72,
                    height: 72,
                    borderRadius: 1,
                    border: 1,
                    borderStyle: "dashed",
                    borderColor: "divider",
                  }}
                />
              )}
              <Button
                color="inherit"
                disabled={!draft.key}
                onClick={() => setDraft({ ...draft, key: null })}
              >
                {t("worlds.categories.remove-icon", "Remove icon")}
              </Button>
            </Stack>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button color="inherit" onClick={onClose}>
          {t("common.cancel", "Cancel")}
        </Button>
        {tab === "icon" && (
          <Button
            variant="contained"
            onClick={() => {
              const keepsInherited =
                !value?.key &&
                draft.key === inherited?.key &&
                draft.color === (inherited?.color ?? IconColors.Grey);
              onSave(draft.key && !keepsInherited ? draft : null);
              onClose();
            }}
          >
            {t("common.save", "Save")}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
