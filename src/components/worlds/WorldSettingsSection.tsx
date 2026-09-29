import { Box, Typography } from "@mui/material";
import { PropsWithChildren, ReactNode } from "react";

export interface WorldSettingsSectionProps extends PropsWithChildren {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  danger?: boolean;
}

// A settings group with the same banded heading as SectionHeading, sized for
// the narrow Notes column as well as the standalone page.
export function WorldSettingsSection(props: WorldSettingsSectionProps) {
  const { title, description, action, danger, children } = props;

  return (
    <Box component="section" aria-label={title}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 1,
          minHeight: 44,
          px: 2,
          py: 0.5,
          borderRadius: 1,
          bgcolor: "background.default",
        }}
      >
        <Typography
          variant="h6"
          component="h2"
          fontFamily={(theme) => theme.typography.fontFamilyTitle}
          color={danger ? "error" : "text.secondary"}
        >
          {title}
        </Typography>
        {action}
      </Box>
      <Box sx={{ pt: 1.5 }}>
        {description && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {description}
          </Typography>
        )}
        {children}
      </Box>
    </Box>
  );
}
