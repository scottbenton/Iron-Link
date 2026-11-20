import { Menu as BaseMenu } from "@base-ui/react/menu";
import { ComponentProps, ReactNode } from "react";

import { menuGroupLabelStyles } from "./menuStyles";

export interface MenuRadioGroupProps
  extends Omit<ComponentProps<typeof BaseMenu.RadioGroup>, "className"> {
  /** A label shown above the choices, which also names the group. */
  label?: ReactNode;
  className?: string;
}

/** One choice out of several, such as a colour scheme. */
export function MenuRadioGroup(props: MenuRadioGroupProps) {
  const { label, children, ...rest } = props;
  return (
    <BaseMenu.RadioGroup {...rest}>
      {label && (
        <BaseMenu.GroupLabel className={menuGroupLabelStyles}>
          {label}
        </BaseMenu.GroupLabel>
      )}
      {children}
    </BaseMenu.RadioGroup>
  );
}
