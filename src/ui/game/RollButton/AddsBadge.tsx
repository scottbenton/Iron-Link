import { ReactNode, useLayoutEffect, useRef, useState } from "react";

import { LayoutProps, withLayoutProps } from "ui/styles/layoutProps";

import { cx } from "styled-system/css";

import { formatSigned } from "../shared/format";
import { playAddsChange } from "./addsBadgeMotion";
import { addsAnchorStyles, addsBadgeStyles } from "./addsBadgeStyles";

export interface AddsBadgeProps {
  /** The adds, such as 1 or -1. 0 hides the badge. */
  value: number;
  className?: string;
}

/**
 * Adds as a pill: "+1", "−2". Decorative: the control it sits on puts the
 * adds in its accessible name (see each component's `addsLabel`). Place it
 * with `AddsAnchor`, which pins it to the control's top-right corner.
 *
 * It stays mounted at 0 so it can animate: it fades and grows in when adds
 * are set, shrinks away (still showing its last value) when they clear, and
 * gives a small bump with the new number fading in when they change. A
 * badge that is already set when the page loads just shows. Reduced motion
 * keeps only the fade in and out.
 */
export function AddsBadge(props: AddsBadgeProps) {
  const { value, className } = props;

  // The last non-zero value, so a clearing badge keeps its number while it
  // fades out instead of flashing "0".
  const [shown, setShown] = useState(value);
  if (value !== 0 && value !== shown) setShown(value);

  const badgeRef = useRef<HTMLSpanElement>(null);
  const numberRef = useRef<HTMLSpanElement>(null);
  const previous = useRef(value);

  useLayoutEffect(() => {
    const from = previous.current;
    previous.current = value;
    // Arriving and leaving are CSS transitions; only a change between two
    // set values needs the bump.
    if (from === 0 || value === 0 || from === value) return;
    return playAddsChange(
      badgeRef.current,
      numberRef.current,
      value > from ? "up" : "down",
    );
  }, [value]);

  return (
    <span
      ref={badgeRef}
      data-adds=""
      data-hidden={value === 0 || undefined}
      aria-hidden
      className={cx(addsBadgeStyles, className)}
    >
      <span ref={numberRef} data-adds-value="">
        {shown !== 0 && formatSigned(shown)}
      </span>
    </span>
  );
}

export interface AddsAnchorProps extends LayoutProps {
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
  const { children, adds, fullWidth, className } = withLayoutProps(props);
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
