import {
  Box,
  Chip,
  TextField,
  Typography,
} from "@mui/material";
import { useTranslation } from "react-i18next";

import { IconColors, type IconDefinition } from "types/Icon.type";

import type { WorldFieldKind } from "lib/worldFieldRules";

import { WorldCategoryIcon } from "./WorldCategoryIcon";

// The setting defaults' Locations icon.
const PREVIEW_CATEGORY_ICON: IconDefinition = {
  key: "GiCompass",
  color: IconColors.Green,
};

// A small sample of the control an entry gets for this kind of field. It is
// built from the real components so it follows the theme and translation, and
// it is inert: the card around it is the only thing to interact with.
export function WorldFieldKindPreview({ kind }: { kind: WorldFieldKind }) {
  const { t } = useTranslation();
  let preview;
  switch (kind) {
    case "text":
      preview = (
        <TextField
          size="small"
          fullWidth
          value={t("worlds.fields.preview-text", "Brinehold")}
          slotProps={{ htmlInput: { readOnly: true, tabIndex: -1 } }}
        />
      );
      break;
    case "longText":
      preview = (
        <Typography
          variant="body2"
          sx={{
            px: 1.5,
            py: 1,
            border: 1,
            borderColor: "divider",
            borderRadius: 1,
          }}
        >
          <Box component="strong">
            {t("worlds.fields.preview-long-text-lead", "Founded in salt.")}
          </Box>{" "}
          {t(
            "worlds.fields.preview-long-text",
            "The harbor freezes each winter, and the elders still argue over who first lit the beacon.",
          )}
        </Typography>
      );
      break;
    case "optionList":
      preview = (
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
          <Chip
            size="small"
            color="primary"
            label={t("worlds.fields.preview-option-1", "Settlement")}
          />
          <Chip
            size="small"
            variant="outlined"
            label={t("worlds.fields.preview-option-2", "Ruin")}
          />
          <Chip
            size="small"
            variant="outlined"
            label={t("worlds.fields.preview-option-3", "Wilds")}
          />
        </Box>
      );
      break;
    case "linkedEntry":
      // An entry from another category, not a text box: the category's icon,
      // the entry's name, and where it lives.
      preview = (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            px: 1,
            py: 0.75,
            border: 1,
            borderColor: "divider",
            borderRadius: 1,
            bgcolor: "background.paper",
          }}
        >
          <WorldCategoryIcon icon={PREVIEW_CATEGORY_ICON} />
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
              {t("worlds.fields.preview-entry", "Thornwatch")}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap>
              {t("worlds.fields.preview-entry-category", "Locations")}
            </Typography>
          </Box>
        </Box>
      );
      break;
  }
  return (
    <Box
      inert
      aria-hidden
      sx={{ width: "100%", mt: 1.5, pointerEvents: "none" }}
    >
      {preview}
    </Box>
  );
}
