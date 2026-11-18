import { Button as BaseButton } from "@base-ui/react/button";
import { DiceFive } from "@phosphor-icons/react";
import { ComponentProps, Ref, forwardRef } from "react";

import { cx } from "styled-system/css";

import { formatSigned } from "../shared/format";
import {
  statAddsStyles,
  statCardBaseStyles,
  statInnerStyles,
  statNameStyles,
  statRollableStyles,
  statStaticStyles,
  statValueStyles,
} from "./statCardStyles";

export interface StatCardProps
  extends Omit<
    ComponentProps<typeof BaseButton>,
    "className" | "children" | "onClick"
  > {
  /** The stat's name: Edge, Heart, Iron, Shadow, Wits. */
  name: string;
  value: number;
  /** Rolls the stat. Without it the card is a static readout, no ledge. */
  onRoll?: () => void;
  /**
   * Adds that apply to the next roll, shown as a small badge and read with
   * the card's name. Zero hides it.
   */
  adds?: number;
  /** The verb in the accessible name, "Roll" by default ("Roll Edge, +3"). */
  rollLabel?: string;
  /** Read after the value when adds apply, "plus {adds} adds" by default. */
  addsLabel?: (adds: string) => string;
  className?: string;
}

/** A stat: its name and value. With `onRoll`, the whole card rolls it. */
export const StatCard = forwardRef<HTMLElement, StatCardProps>(
  function StatCard(props, ref) {
    const {
      name,
      value,
      onRoll,
      adds = 0,
      rollLabel = "Roll",
      addsLabel = (a) => `plus ${a} adds`,
      className,
      disabled,
      ...rest
    } = props;

    const valueText = formatSigned(value);
    const addsText = adds ? formatSigned(adds) : undefined;

    const content = (
      <span data-stat-inner="" className={statInnerStyles}>
        <span className={statNameStyles}>{name}</span>
        <span className={statValueStyles}>
          {onRoll && <DiceFive weight="fill" aria-hidden />}
          {valueText}
        </span>
        {addsText && (
          <span className={statAddsStyles} aria-hidden>
            {addsText}
          </span>
        )}
      </span>
    );

    if (!onRoll) {
      return (
        <div
          ref={ref as Ref<HTMLDivElement>}
          className={cx(statCardBaseStyles, statStaticStyles, className)}
          role="group"
          aria-label={
            addsText
              ? `${name}, ${valueText}, ${addsLabel(addsText)}`
              : `${name}, ${valueText}`
          }
        >
          {content}
        </div>
      );
    }

    return (
      <BaseButton
        ref={ref}
        className={cx(statCardBaseStyles, statRollableStyles, className)}
        aria-label={
          addsText
            ? `${rollLabel} ${name}, ${valueText}, ${addsLabel(addsText)}`
            : `${rollLabel} ${name}, ${valueText}`
        }
        disabled={disabled}
        onClick={() => onRoll()}
        {...rest}
      >
        {content}
      </BaseButton>
    );
  },
);
