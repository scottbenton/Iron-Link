import { Button as BaseButton } from "@base-ui/react/button";
import { DiceFive } from "@phosphor-icons/react";
import { ComponentProps, ReactNode, forwardRef } from "react";

import { VisuallyHidden } from "ui/components/VisuallyHidden";

import { formatSigned } from "../shared/format";
import { AddsAnchor } from "./AddsBadge";
import { rollButtonInnerStyles, rollButtonStyles } from "./rollButtonStyles";

export interface RollButtonProps
  extends Omit<ComponentProps<typeof BaseButton>, "className" | "children"> {
  /** The label, such as "Roll +Iron" or "Ask the Oracle". */
  children: ReactNode;
  /** An icon before the label. A die by default; `null` for none. */
  icon?: ReactNode;
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  /**
   * Adds on this roll, shown as a badge on the button's top-right corner
   * and read after the label. Zero hides it.
   */
  adds?: number;
  /** Read after the label when adds apply, "adds +1" by default. */
  addsLabel?: (adds: string) => string;
  className?: string;
}

/**
 * The button that rolls: a dark chip inside an always-on gradient ring, on a
 * ledge. Use it for stat and progress rolls, Ask the Oracle and oracle table
 * rolls. Hover brightens the ring; a press sinks the button 1px. Adds for
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
    } = props;
    const iconNode =
      icon === undefined ? <DiceFive weight="bold" aria-hidden /> : icon;
    return (
      <AddsAnchor adds={adds} fullWidth={fullWidth} className={className}>
        <BaseButton
          ref={ref}
          className={rollButtonStyles({ size, fullWidth })}
          {...rest}
        >
          <span data-ring-inner="" className={rollButtonInnerStyles}>
            {iconNode}
            <span data-roll-label="">{children}</span>
            {adds !== 0 && (
              <VisuallyHidden>, {addsLabel(formatSigned(adds))}</VisuallyHidden>
            )}
          </span>
        </BaseButton>
      </AddsAnchor>
    );
  },
);
