import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogContent,
  Link,
  MenuItem,
  Pagination,
  Stack,
  SvgIcon,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import type { IconType } from "react-icons";

import { DialogTitleWithCloseButton } from "components/DialogTitleWithCloseButton";

import { IconColors, IconDefinition } from "types/Icon.type";

import { WorldCategoryIcon } from "./WorldCategoryIcon";
import { categoryIconName, loadCategoryIcons } from "./categoryIcons";

const PAGE_SIZE = 96;
export function WorldCategoryIconPicker({
  value,
  onChange,
  disabled,
}: {
  value: IconDefinition | null;
  onChange: (value: IconDefinition | null) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [icons, setIcons] = useState<Record<string, IconType>>();
  const [error, setError] = useState(false);
  useEffect(() => {
    if (!open) return;
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
  }, [open]);
  const matches = Object.entries(icons ?? {}).filter(([key]) =>
    categoryIconName(key).toLowerCase().includes(search.trim().toLowerCase()),
  );
  return (
    <>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        gap={2}
        alignItems={{ sm: "center" }}
      >
        <Button
          variant="outlined"
          disabled={disabled}
          onClick={() => setOpen(true)}
          startIcon={<WorldCategoryIcon icon={value} />}
          sx={{ flex: 1 }}
        >
          {value?.key ? categoryIconName(value.key) : "Choose icon"}
        </Button>
        <TextField
          select
          label="Icon color"
          value={value?.color ?? IconColors.Grey}
          disabled={disabled}
          onChange={(event) =>
            onChange({
              key: value?.key ?? null,
              color: event.target.value as IconColors,
            })
          }
          sx={{ minWidth: 150 }}
        >
          {Object.values(IconColors).map((color) => (
            <MenuItem key={color} value={color}>
              {color.charAt(0).toUpperCase() + color.slice(1)}
            </MenuItem>
          ))}
        </TextField>
      </Stack>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitleWithCloseButton onClose={() => setOpen(false)}>
          Choose category icon
        </DialogTitleWithCloseButton>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              autoFocus
              label="Search icons"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
            />
            {error ? (
              <Alert severity="error">
                Could not load icons. Please reload and try again.
              </Alert>
            ) : !icons ? (
              <CircularProgress />
            ) : (
              <>
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(48px, 1fr))",
                    gap: 0.5,
                  }}
                >
                  {matches
                    .slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
                    .map(([key, Icon]) => (
                      <Tooltip key={key} title={categoryIconName(key)}>
                        <Button
                          aria-label={categoryIconName(key)}
                          aria-pressed={value?.key === key}
                          onClick={() => {
                            onChange({
                              key,
                              color: value?.color ?? IconColors.Grey,
                            });
                            setOpen(false);
                          }}
                          sx={{
                            minWidth: 0,
                            p: 1,
                            color: "text.primary",
                            bgcolor:
                              value?.key === key
                                ? "action.selected"
                                : undefined,
                          }}
                        >
                          <SvgIcon component={Icon} inheritViewBox />
                        </Button>
                      </Tooltip>
                    ))}
                </Box>
                {matches.length === 0 && (
                  <Typography color="text.secondary">
                    No matching icons.
                  </Typography>
                )}
                {matches.length > PAGE_SIZE && (
                  <Pagination
                    count={Math.ceil(matches.length / PAGE_SIZE)}
                    page={page}
                    onChange={(_, next) => setPage(next)}
                  />
                )}
              </>
            )}
            <Button
              onClick={() => {
                onChange(null);
                setOpen(false);
              }}
            >
              No icon
            </Button>
            <Typography variant="caption">
              Icons by{" "}
              <Link
                href="https://game-icons.net/"
                target="_blank"
                rel="noreferrer"
              >
                Game Icons
              </Link>
              , licensed under{" "}
              <Link
                href="https://creativecommons.org/licenses/by/3.0/"
                target="_blank"
                rel="noreferrer"
              >
                CC BY 3.0
              </Link>
              .
            </Typography>
          </Stack>
        </DialogContent>
      </Dialog>
    </>
  );
}
