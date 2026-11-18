import { cx } from "styled-system/css";

import { formatSigned } from "../shared/format";
import { addsBadgeStyles } from "./addsBadgeStyles";

export interface AddsBadgeProps {
  /** The adds, such as 1 or -1. Draw nothing for 0. */
  value: number;
  className?: string;
}

/**
 * Adds as a pill: "+1", "−2". Decorative: the control it sits in puts the
 * adds in its accessible name (see each component's `addsLabel`).
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
