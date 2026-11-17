import { Tabs, TabsProps } from "@mui/material";

export interface StyledTabsProps extends TabsProps {
  /**
   * "large" is the same strip with taller tabs (48px) and larger labels,
   * filling the width; for a panel's own view switcher on phones, where it
   * stands alone at the top of the screen.
   */
  size?: "medium" | "large";
}

const LARGE_TAB_HEIGHT = 48;

export function StyledTabs(props: StyledTabsProps) {
  const { sx, size = "medium", ...otherProps } = props;
  const isLarge = size === "large";

  return (
    <Tabs
      TabIndicatorProps={{
        sx: (theme) => ({
          height: "100%",
          backgroundColor:
            theme.palette.mode === "light"
              ? theme.palette.grey[300]
              : theme.palette.grey[700],
          color: theme.palette.text.secondary,
          borderRadius: `${theme.shape.borderRadius}px`,
        }),
      }}
      TabScrollButtonProps={{
        sx: {
          alignSelf: "stretch",
        },
      }}
      sx={[
        (theme) => ({
          py: 0,
          backgroundColor: undefined,
          borderBottom: `1px solid ${theme.palette.divider}`,
          alignItems: "center",
        }),
        isLarge &&
          ((theme) => ({
            "& .MuiTab-root": {
              height: LARGE_TAB_HEIGHT,
              fontSize: theme.typography.body1.fontSize,
            },
          })),
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      scrollButtons
      allowScrollButtonsMobile
      {...otherProps}
      {...(isLarge && { variant: "fullWidth", centered: false })}
    />
  );
}
