import { ReactNode } from "react";

/** A top-level destination: Games, Worlds, Homebrew, Reference. */
export interface NavItem {
  /** Stable key. */
  id: string;
  label: string;
  href: string;
  /** A Phosphor icon, sized by the component. */
  icon: ReactNode;
  /** Shown instead of `icon` while current, such as the `fill` weight. */
  currentIcon?: ReactNode;
  /** Whether this is the page the reader is on (marked with aria-current). */
  current?: boolean;
}
