import { Button as BaseButton } from "@base-ui/react/button";
import { DiceFive } from "@phosphor-icons/react";
import { ComponentProps, ReactNode, forwardRef } from "react";

import { cx } from "styled-system/css";

import { rollButtonInnerStyles, rollButtonStyles } from "./rollButtonStyles";

export interface RollButtonProps
  extends Omit<ComponentProps<typeof BaseButton>, "className" | "children"> {
  /** The label, such as "Roll +Iron" or "Ask the Oracle". */
  children: ReactNode;
  /** An icon before the label. A die by default; `null` for none. */
  icon?: ReactNode;
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  className?: string;
}

/**
 * The button that rolls: a dark chip inside an always-on gradient ring, on a
 * ledge. Use it for stat and progress rolls, Ask the Oracle and oracle table
 * rolls. Hover brightens the ring; a press sinks the button 1px.
 */
export const RollButton = forwardRef<HTMLElement, RollButtonProps>(
  function RollButton(props, ref) {
    const { children, icon, size, fullWidth, className, ...rest } = props;
    const iconNode =
      icon === undefined ? <DiceFive weight="bold" aria-hidden /> : icon;
    return (
      <BaseButton
        ref={ref}
        className={cx(rollButtonStyles({ size, fullWidth }), className)}
        {...rest}
      >
        <span data-ring-inner="" className={rollButtonInnerStyles}>
          {iconNode}
          {children}
        </span>
      </BaseButton>
    );
  },
);
