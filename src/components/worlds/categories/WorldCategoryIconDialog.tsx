import Groups2Icon from "@mui/icons-material/Groups2";
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
  SvgIcon,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from "@mui/material";
import type { TFunction } from "i18next";
import { useDeferredValue, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import type { IconType } from "react-icons";

import { DialogTitleWithCloseButton } from "components/DialogTitleWithCloseButton";

import { IconColors, IconDefinition } from "types/Icon.type";

import { WorldCategoryIcon } from "./WorldCategoryIcon";
import {
  GROUPS_CATEGORY_ICON_KEY,
  categoryIconName,
  getCategoryIconColor,
  loadCategoryIcons,
} from "./categoryIcons";

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
export function WorldCategoryIconDialog({
  value,
  onSave,
  onClose,
}: {
  value: IconDefinition | null;
  onSave: (value: IconDefinition | null) => void;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const [draft, setDraft] = useState<IconDefinition>({
    key: value?.key ?? null,
    color: value?.color ?? IconColors.Grey,
  });
  const [search, setSearch] = useState("");
  const query = useDeferredValue(search.trim().toLowerCase());
  const [limit, setLimit] = useState(BATCH_SIZE);
  const [icons, setIcons] = useState<Record<string, IconType>>();
  const [error, setError] = useState(false);
  useEffect(() => {
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
  }, []);
  const matches = [
    GROUPS_CATEGORY_ICON_KEY,
    ...Object.keys(icons ?? {}),
  ].filter((key) => categoryIconName(key).toLowerCase().includes(query));
  const color = draft.color ?? IconColors.Grey;
  return (
    <Dialog open fullWidth maxWidth="sm" onClose={onClose}>
      <DialogTitleWithCloseButton onClose={onClose}>
        {t("worlds.categories.choose-icon", "Choose category icon")}
      </DialogTitleWithCloseButton>
      <DialogContent>
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column-reverse", sm: "row" },
            gap: 2,
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
                      bgcolor: getCategoryIconColor(option, theme.palette.mode),
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
                    gridTemplateColumns: "repeat(auto-fill, minmax(44px, 1fr))",
                  }}
                >
                  {matches.slice(0, limit).map((key) => (
                    <Tooltip key={key} title={categoryIconName(key)}>
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
                        {key === GROUPS_CATEGORY_ICON_KEY ? (
                          <Groups2Icon />
                        ) : (
                          <SvgIcon component={icons[key]} inheritViewBox />
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
      </DialogContent>
      <DialogActions>
        <Button color="inherit" onClick={onClose}>
          {t("common.cancel", "Cancel")}
        </Button>
        <Button
          variant="contained"
          onClick={() => {
            onSave(draft.key ? draft : null);
            onClose();
          }}
        >
          {t("common.save", "Save")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
