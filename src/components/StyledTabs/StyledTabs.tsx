import { Tabs, TabsProps } from "@mui/material";

import {
  TOUCH_DEVICE_MEDIA_QUERY,
  TOUCH_TARGET_SIZE,
} from "hooks/useIsTouchDevice";

export interface StyledTabsProps extends TabsProps {
  /**
   * "pill" centres the tabs and draws the selected one as a round, filled
   * neutral pill inside a full height target (44px on touch); the rest are
   * plain text. "block" is the original square-cornered strip.
   */
  appearance?: "block" | "pill";
}

// The space between a pill and the edge of its tab, so a pill reads as a
// pill inside its (larger) tap target.
const PILL_INSET = 2;

export function StyledTabs(props: StyledTabsProps) {
  const { sx, appearance = "block", ...otherProps } = props;
  const isPill = appearance === "pill";

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
          ...(isPill && {
            top: PILL_INSET,
            bottom: PILL_INSET,
            height: "auto",
            borderRadius: 999,
          }),
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
        isPill &&
          ((theme) => ({
            py: 0.5,
            "& .MuiTabs-flexContainer": {
              gap: 0.75,
            },
            "& .MuiTab-root": {
              height: 36,
              px: 2.5,
              borderRadius: 999,
              fontSize: theme.typography.body1.fontSize,
              fontWeight: theme.typography.fontWeightMedium,
              [TOUCH_DEVICE_MEDIA_QUERY]: {
                height: TOUCH_TARGET_SIZE,
              },
            },
            "& .MuiTab-root.Mui-selected": {
              fontWeight: 600,
            },
          })),
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      scrollButtons
      allowScrollButtonsMobile
      {...otherProps}
      centered={isPill || otherProps.centered}
    />
  );
}
