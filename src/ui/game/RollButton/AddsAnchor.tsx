import { ReactNode } from "react";

import { CssProp, withCssProp } from "ui/styles/cssProp";

import { cx } from "styled-system/css";

import { AddsBadge } from "./AddsBadge";
import { addsAnchorStyles } from "./addsBadgeStyles";

export interface AddsAnchorProps extends CssProp {
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
  const { children, adds, fullWidth, className } = withCssProp(props);
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
