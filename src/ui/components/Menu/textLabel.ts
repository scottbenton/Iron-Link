import { ReactNode } from "react";

/** Text for typeahead when the label is a plain string. */
export function textLabel(children: ReactNode, label?: string) {
  if (label !== undefined) return label;
  if (typeof children === "string" || typeof children === "number") {
    return String(children);
  }
  return undefined;
}
