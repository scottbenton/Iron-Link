import { ReactNode } from "react";

import { cx } from "styled-system/css";

import { fieldHeaderStyles } from "./fieldStyles";

export interface FieldHeaderProps {
  children: ReactNode;
  className?: string;
}

/**
 * Holds a label and its help text close together above the control, for
 * fields built from parts.
 */
export function FieldHeader(props: FieldHeaderProps) {
  const { children, className } = props;
  return <div className={cx(fieldHeaderStyles, className)}>{children}</div>;
}
