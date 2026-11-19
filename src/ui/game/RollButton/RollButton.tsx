import { DiceFive } from "@phosphor-icons/react";
import { ReactNode, forwardRef } from "react";

import { Button, type ButtonProps } from "ui/components/Button";
import { VisuallyHidden } from "ui/components/VisuallyHidden";
import { withLayoutProps } from "ui/styles/layoutProps";

import { cx } from "styled-system/css";

import { formatSigned } from "../shared/format";
import { AddsAnchor } from "./AddsBadge";
import { rollButtonStyles } from "./rollButtonStyles";

export interface RollButtonProps
  extends Omit<
    ButtonProps,
    | "variant"
    | "size"
    | "startIcon"
    | "endIcon"
    | "iconOnly"
    | "loading"
    | "loadingLabel"
    | "children"
  > {
  /**
   * The label, such as "Roll +Iron" or "Ask the Oracle", shown as given.
   * Capitalise names that come in lower case (`capitalize` from
   * `ui/game/shared`).
   */
  children: ReactNode;
  /** An icon before the label. A die by default; `null` for none. */
  icon?: ReactNode;
  size?: "sm" | "md" | "lg";
  /**
   * Adds on this roll, shown as a badge on the button's top-right corner
   * and read after the label. Zero hides it.
   */
  adds?: number;
  /** Read after the label when adds apply, "adds +1" by default. */
  addsLabel?: (adds: string) => string;
}

/**
 * The button that rolls: the gradient button (a turning ring on its own
 * gradient ledge) with a die before the label, exactly as Button's gradient
 * variant looks, plus a large size. Use it for stat
 * and progress rolls, Ask the Oracle and oracle table rolls. Hover thickens
 * the ring and lifts the button; a press sinks it onto the ledge. Adds for
 * the next roll show as the same corner badge a stat card uses.
 */
export const RollButton = forwardRef<HTMLElement, RollButtonProps>(
  function RollButton(props, ref) {
    const {
      children,
      icon,
      size,
      fullWidth,
      adds = 0,
      addsLabel = (a) => `adds ${a}`,
      className,
      ...rest
    } = withLayoutProps<RollButtonProps>(props);
    const iconNode =
      icon === undefined ? <DiceFive weight="bold" aria-hidden /> : icon;
    return (
      <AddsAnchor adds={adds} fullWidth={fullWidth} className={className}>
        <Button
          ref={ref}
          variant="gradient"
          size={size === "sm" ? "sm" : "md"}
          fullWidth={fullWidth}
          startIcon={iconNode}
          className={cx(rollButtonStyles({ size, fullWidth }))}
          data-roll=""
          {...rest}
        >
          <span data-roll-label="">{children}</span>
          {adds !== 0 && (
            <VisuallyHidden>, {addsLabel(formatSigned(adds))}</VisuallyHidden>
          )}
        </Button>
      </AddsAnchor>
    );
  },
);
