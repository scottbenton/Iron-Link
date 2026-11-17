import LockIcon from "@mui/icons-material/Lock";
import { Box, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

import { MarkdownRenderer } from "components/MarkdownRenderer";

// A truth's quest starter, in an inlay marked Guide only. Only Guides' screens
// render it; players never receive a written one.
export function WorldTruthQuestStarter({
  markdown,
  disableLinks,
}: {
  markdown: string;
  // Inside a card that is itself a button, links can't be followed.
  disableLinks?: boolean;
}) {
  const { t } = useTranslation();
  return (
    <Box
      sx={{
        mt: 2,
        px: 1.5,
        py: 1,
        borderRadius: 1,
        bgcolor: "background.paperInlay",
        border: (theme) =>
          `1px dashed ${
            theme.palette.mode === "light"
              ? "rgba(0, 0, 0, 0.23)"
              : "rgba(255, 255, 255, 0.23)"
          }`,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Typography variant="overline" component="p" sx={{ flexGrow: 1 }}>
          {t("worlds.truths.quest-starter", "Quest starter")}
        </Typography>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
        >
          <LockIcon sx={{ fontSize: 14 }} />
          {t("worlds.entries.guide-only", "Guide only")}
        </Typography>
      </Box>
      <MarkdownRenderer
        markdown={markdown}
        typographyVariant="body2"
        disableLinks={disableLinks}
      />
    </Box>
  );
}
