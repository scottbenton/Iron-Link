import LockIcon from "@mui/icons-material/Lock";
import { Box, Paper, Typography } from "@mui/material";
import { PropsWithChildren, useId } from "react";

// A marked group of fields, such as those only Guides can see.
export function WorldEntryFieldSection({
  title,
  description,
  children,
}: PropsWithChildren<{ title: string; description: string }>) {
  const titleId = useId();
  return (
    <Paper
      component="section"
      variant="outlined"
      aria-labelledby={titleId}
      sx={{ p: 2, borderStyle: "dashed", bgcolor: "action.hover" }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
        <LockIcon fontSize="small" color="action" />
        <Typography
          id={titleId}
          variant="h6"
          component="h2"
          fontFamily={(theme) => theme.typography.fontFamilyTitle}
        >
          {title}
        </Typography>
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {description}
      </Typography>
      {children}
    </Paper>
  );
}
