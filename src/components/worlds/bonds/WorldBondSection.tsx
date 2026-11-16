import { Box, Typography } from "@mui/material";
import { ReactNode, useId } from "react";

import { useHeadingComponent } from "components/HeadingLevel";

// A titled section of the entry page, headed at the level the page allows.
export function WorldBondSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  const headingComponent = useHeadingComponent(2);
  const titleId = useId();
  return (
    <Box component="section" aria-labelledby={titleId}>
      <Typography
        id={titleId}
        component={headingComponent}
        // Matches the entry's Notes heading below it.
        sx={(theme) => ({
          fontFamily: theme.typography.fontFamilyTitle,
          fontWeight: 600,
          fontSize: 15,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: "text.secondary",
        })}
      >
        {title}
      </Typography>
      {description && (
        <Typography variant="body2" color="text.secondary">
          {description}
        </Typography>
      )}
      <Box sx={{ mt: 1 }}>{children}</Box>
    </Box>
  );
}
