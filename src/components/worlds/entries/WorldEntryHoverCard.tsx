import { Box, Stack, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

import { useWorldCategoriesStore } from "stores/worldCategories.store";

import { getWorldEntryPreviewFields } from "lib/worldEntryPreview";

import { IWorldEntry } from "services/worldEntries.service";

import { WorldEntryIcon } from "./WorldEntryIcon";
import { useResolvedWorldEntryFields } from "./useResolvedWorldEntryFields";

// A glance at an entry from a link to it: its picture, name and category,
// then the first few fields this reader can see. Read-only and built from
// the entries already loaded, so it costs no request.
export function WorldEntryHoverCard({ entry }: { entry: IWorldEntry }) {
  const { t } = useTranslation();
  const categoryName = useWorldCategoriesStore(
    (store) => store.categories[entry.categoryId]?.name,
  );
  const { fields, values, entries } = useResolvedWorldEntryFields(entry);
  const previewFields = getWorldEntryPreviewFields(fields, values, entries);

  return (
    <Box sx={{ p: 1.5, width: 280, maxWidth: "100%" }}>
      <Stack direction="row" spacing={1.5} alignItems="center">
        <WorldEntryIcon entry={entry} size="large" />
        <Box sx={{ minWidth: 0 }}>
          <Typography
            component="span"
            variant="subtitle1"
            sx={{ display: "block", fontWeight: 600, lineHeight: 1.3 }}
          >
            {entry.name}
          </Typography>
          {categoryName && (
            <Typography
              component="span"
              variant="caption"
              color="text.secondary"
              sx={{ display: "block" }}
            >
              {categoryName}
            </Typography>
          )}
        </Box>
      </Stack>
      {previewFields.length > 0 ? (
        <Box component="dl" sx={{ m: 0, mt: 1.5 }}>
          {previewFields.map((field) => (
            <Box key={field.id} sx={{ "& + &": { mt: 1 } }}>
              <Typography
                component="dt"
                variant="caption"
                color="text.secondary"
                sx={{ display: "block", fontWeight: 600 }}
              >
                {field.label}
              </Typography>
              <Typography
                component="dd"
                variant="body2"
                sx={{
                  m: 0,
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                  overflowWrap: "anywhere",
                }}
              >
                {field.text}
              </Typography>
            </Box>
          ))}
        </Box>
      ) : (
        <Typography
          component="p"
          variant="body2"
          color="text.secondary"
          sx={{ mt: 1.5 }}
        >
          {t("worlds.entries.hover-card-empty", "No details filled in yet")}
        </Typography>
      )}
    </Box>
  );
}
