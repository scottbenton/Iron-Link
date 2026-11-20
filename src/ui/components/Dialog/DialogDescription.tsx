import { Dialog as BaseDialog } from "@base-ui/react/dialog";
import { ComponentProps } from "react";

import { css, cx } from "styled-system/css";

export function DialogDescription(props: ComponentProps<"p">) {
  const { className, ...rest } = props;
  return (
    <BaseDialog.Description
      className={cx(
        css({ color: "fg.muted", fontSize: "sm", margin: 0 }),
        className,
      )}
      {...rest}
    />
  );
}
