import { Box, Stack, Typography } from "@mui/material";
import { PropsWithChildren, ReactNode } from "react";

import { useHeadingComponent } from "components/HeadingLevel";

// Heading for a group of controls inside an editor dialog or a category's
// settings.
export function WorldEditorSection({
  title,
  description,
  action,
  children,
}: PropsWithChildren<{
  title: string;
  description?: ReactNode;
  action?: ReactNode;
}>) {
  const headingComponent = useHeadingComponent(3);
  return (
    <Stack component="section" aria-label={title} spacing={2} useFlexGap>
      <Box
        sx={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: 1,
          flexWrap: "wrap",
          borderBottom: 1,
          borderColor: "divider",
          pb: 0.5,
        }}
      >
        <Box>
          <Typography
            variant="h6"
            component={headingComponent}
            fontFamily={(theme) => theme.typography.fontFamilyTitle}
          >
            {title}
          </Typography>
          {description && (
            <Typography variant="body2" color="text.secondary">
              {description}
            </Typography>
          )}
        </Box>
        {action}
      </Box>
      {children}
    </Stack>
  );
}
