import { Button as BaseButton } from "@base-ui/react/button";
import { ComponentProps, Ref, forwardRef } from "react";

import { CssProp, withCssProp } from "ui/styles/cssProp";

import { cx } from "styled-system/css";

import { DieFace, DieRollResult, useDieFace } from "../DieFace";
import { AddsAnchor } from "../RollButton/AddsAnchor";
import { formatSigned } from "../shared/format";
import {
  statCardBaseStyles,
  statInnerStyles,
  statNameStyles,
  statRollableStyles,
  statStaticStyles,
  statValueRowStyles,
  statValueStyles,
} from "./statCardStyles";

export interface StatCardProps
  extends CssProp,
    Omit<
      ComponentProps<typeof BaseButton>,
      "className" | "children" | "onClick"
    > {
  /** The stat's name: Edge, Heart, Iron, Shadow, Wits. */
  name: string;
  value: number;
  /**
   * Rolls the stat. Return the action die (1 to 6), or a promise of it, and
   * the card's die lands on it. Without it the card is a static readout, no
   * ledge.
   */
  onRoll?: () => DieRollResult;
  /**
   * Adds that apply to the next roll, shown as a pill after the value (under
   * it when the card is too narrow) and read after the value. Zero hides it.
   */
  adds?: number;
  /** The verb in the accessible name, "Roll" by default ("Roll Edge, +3"). */
  rollLabel?: string;
  /** Read after the value when adds apply, "adds +1" by default. */
  addsLabel?: (adds: string) => string;
  className?: string;
}

/**
 * A stat: its name and value. With `onRoll`, the whole card rolls it. The card
 * is never narrower than `--stat-min-width` (60px), room for "Shadow" and a
 * value, so nothing overlaps the name.
 */
export const StatCard = forwardRef<HTMLElement, StatCardProps>(
  function StatCard(props, ref) {
    const {
      name,
      value,
      onRoll,
      adds = 0,
      rollLabel = "Roll",
      addsLabel = (a) => `adds ${a}`,
      className,
      disabled,
      ...rest
    } = withCssProp<StatCardProps>(props);

    const [die, rollDie] = useDieFace();
    const valueText = formatSigned(value);
    const addsText = adds ? formatSigned(adds) : undefined;

    const content = (
      <span data-stat-inner="" className={statInnerStyles}>
        <span className={statNameStyles}>{name}</span>
        <span className={statValueRowStyles}>
          <span className={statValueStyles}>
            {onRoll && <DieFace {...die} size="inherit" weight="fill" />}
            {valueText}
          </span>
        </span>
      </span>
    );

    if (!onRoll) {
      return (
        <AddsAnchor adds={adds} className={className}>
          <div
            ref={ref as Ref<HTMLDivElement>}
            className={cx(statCardBaseStyles, statStaticStyles)}
            role="group"
            aria-label={
              addsText
                ? `${name}, ${valueText}, ${addsLabel(addsText)}`
                : `${name}, ${valueText}`
            }
          >
            {content}
          </div>
        </AddsAnchor>
      );
    }

    return (
      <AddsAnchor adds={adds} className={className}>
        <BaseButton
          ref={ref}
          className={cx(statCardBaseStyles, statRollableStyles)}
          aria-label={
            addsText
              ? `${rollLabel} ${name}, ${valueText}, ${addsLabel(addsText)}`
              : `${rollLabel} ${name}, ${valueText}`
          }
          disabled={disabled}
          onClick={() => {
            rollDie(onRoll());
          }}
          {...rest}
        >
          {content}
        </BaseButton>
      </AddsAnchor>
    );
  },
);
