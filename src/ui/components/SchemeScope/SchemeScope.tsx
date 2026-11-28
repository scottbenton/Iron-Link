import { ReactNode } from "react";

import { SchemeName, schemeScopeStyle, schemes } from "ui/theme";

import { css, cx } from "styled-system/css";

const scopeStyles = css({ display: "contents" });

export interface SchemeScopeProps {
  /** The scheme its children wear. */
  scheme: SchemeName;
  children: ReactNode;
  className?: string;
}

/**
 * Its children wear `scheme`'s accent instead of the page's, Default
 * included. It draws no box of its own (`display: contents`), so a child
 * stays a grid or flex item of the parent.
 */
export function SchemeScope(props: SchemeScopeProps) {
  const { scheme, children, className } = props;
  return (
    <div
      className={cx(scopeStyles, className)}
      data-scheme-scope=""
      style={schemeScopeStyle(schemes[scheme])}
    >
      {children}
    </div>
  );
}
