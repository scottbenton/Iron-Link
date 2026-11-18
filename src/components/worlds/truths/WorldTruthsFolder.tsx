import AutoStoriesIcon from "@mui/icons-material/AutoStories";
import { Card, CardActionArea, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

import { LinkComponent } from "components/LinkComponent";

import type { WorldLinkProps } from "../worldNavigation";

// The Truths card beside the category folders, styled like them.
export function WorldTruthsFolder({
  linkProps,
  subtitle,
}: {
  linkProps: WorldLinkProps;
  subtitle?: string;
}) {
  const { t } = useTranslation();
  return (
    <Card
      variant="outlined"
      sx={{ bgcolor: "background.default", height: "100%" }}
    >
      <CardActionArea
        LinkComponent={LinkComponent}
        {...linkProps}
        sx={{
          py: 1.5,
          px: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-start",
          gap: 1,
          height: "100%",
        }}
      >
        <AutoStoriesIcon color="action" />
        <Typography sx={{ flexGrow: 1, minWidth: 0 }}>
          {t("worlds.truths.title", "Truths")}
          {subtitle && (
            <Typography
              component="span"
              variant="caption"
              color="text.secondary"
              display="block"
            >
              {subtitle}
            </Typography>
          )}
        </Typography>
      </CardActionArea>
    </Card>
  );
}
