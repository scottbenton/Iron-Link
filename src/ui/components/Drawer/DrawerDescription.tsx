import { Drawer as BaseDrawer } from "@base-ui/react/drawer";
import { ComponentProps } from "react";

import { css, cx } from "styled-system/css";

export function DrawerDescription(props: ComponentProps<"p">) {
  const { className, ...rest } = props;
  return (
    <BaseDrawer.Description
      className={cx(
        css({
          margin: 0,
          paddingInline: "5",
          color: "fg.muted",
          fontSize: "sm",
        }),
        className,
      )}
      {...rest}
    />
  );
}
