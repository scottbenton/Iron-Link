import { ReactNode } from "react";

import { cx } from "styled-system/css";

import { formatSigned } from "../shared/format";
import { addsAnchorStyles, addsBadgeStyles } from "./addsBadgeStyles";

export interface AddsBadgeProps {
  /** The adds, such as 1 or -1. Draw nothing for 0. */
  value: number;
  className?: string;
}

/**
 * Adds as a pill: "+1", "−2". Decorative: the control it sits on puts the
 * adds in its accessible name (see each component's `addsLabel`). Place it
 * with `AddsAnchor`, which pins it to the control's top-right corner.
 */
export function AddsBadge(props: AddsBadgeProps) {
  const { value, className } = props;
  if (!value) return null;
  return (
    <span data-adds="" aria-hidden className={cx(addsBadgeStyles, className)}>
      {formatSigned(value)}
    </span>
  );
}

export interface AddsAnchorProps {
  /** The roll control: a stat card, a meter's roller, a roll button. */
  children: ReactNode;
  adds: number;
  /** Fill the width, for a full-width roll button. */
  fullWidth?: boolean;
  className?: string;
}

/**
 * Holds a roll control and pins its adds badge to the top-right corner,
 * overhanging the edge like a notification count. The badge sits outside
 * the control, so adds coming and going never changes the control's width
 * (and the control's own clipping, which its ring needs, doesn't cut it
 * off). Always rendered, with or without adds, so the control is never
 * remounted and keeps focus.
 */
export function AddsAnchor(props: AddsAnchorProps) {
  const { children, adds, fullWidth, className } = props;
  return (
    <span
      className={cx(addsAnchorStyles, className)}
      data-adds-anchor=""
      data-full-width={fullWidth || undefined}
    >
      {children}
      <AddsBadge value={adds} />
    </span>
  );
}
