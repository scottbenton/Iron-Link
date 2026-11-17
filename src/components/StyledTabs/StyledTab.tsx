import { Tab, TabProps } from "@mui/material";

import {
  TOUCH_DEVICE_MEDIA_QUERY,
  TOUCH_TARGET_SIZE,
} from "hooks/useIsTouchDevice";

export function StyledTab(props: TabProps) {
  const { ...tabProps } = props;

  const selected = (tabProps as unknown as { selected: boolean }).selected;
  return (
    <Tab
      sx={(theme) => ({
        zIndex: 1,
        borderRadius: `${theme.shape.borderRadius}px`,
        height: "32px",
        minWidth: 64,
        minHeight: 1,
        textTransform: "unset",
        [TOUCH_DEVICE_MEDIA_QUERY]: {
          height: TOUCH_TARGET_SIZE,
        },

        color:
          theme.palette.text[selected ? "primary" : "secondary"] + "!important",
      })}
      {...tabProps}
    />
  );
}
