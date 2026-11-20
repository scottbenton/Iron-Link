import { Menu as BaseMenu } from "@base-ui/react/menu";

import { cx } from "styled-system/css";

import { menuSeparatorStyles } from "./menuStyles";

export function MenuSeparator(props: { className?: string }) {
  return (
    <BaseMenu.Separator className={cx(menuSeparatorStyles, props.className)} />
  );
}
