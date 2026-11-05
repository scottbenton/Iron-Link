import { Box, Stack, SxProps, Theme, Typography } from "@mui/material";
import { ReactNode } from "react";

export interface SectionHeadingProps {
  label: string;
  action?: ReactNode;
  breakContainer?: boolean;
  sx?: SxProps<Theme>;
  rounded?: boolean;
}

export function SectionHeading(props: SectionHeadingProps) {
  const { label, action, breakContainer, rounded, sx } = props;

  return (
    <Box
      bgcolor={"background.default"}
      py={0.5}
      display={"flex"}
      justifyContent={"space-between"}
      sx={[
        (theme) => ({
          alignItems: "center",

          marginX: breakContainer ? -3 : 0,
          paddingX: 3,

          [theme.breakpoints.down("sm")]: {
            flexDirection: "column",
            paddingX: 2,
            marginX: breakContainer ? -2 : 0,
          },
          [theme.breakpoints.up("md")]: {
            px: 3,
            mx: breakContainer ? -3 : 0,
            flexDirection: "row",
          },
        }),
        rounded && {
          borderRadius: 1,
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      <Typography
        variant={"h6"}
        component={"h2"}
        fontFamily={(theme) => theme.typography.fontFamilyTitle}
        color={"text.secondary"}
      >
        {label}
      </Typography>
      {action && (
        <Stack direction={{ xs: "column", md: "row" }} spacing={1}>
          {action}
        </Stack>
      )}
    </Box>
  );
}
