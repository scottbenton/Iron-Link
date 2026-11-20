import { ReactNode } from "react";

/**
 * Headings inside rules text are labels within someone else's section, so
 * they look like headings without joining the page's outline.
 */
export function HeadingLike(props: { children?: ReactNode }) {
  return <p data-rules-heading="">{props.children}</p>;
}
