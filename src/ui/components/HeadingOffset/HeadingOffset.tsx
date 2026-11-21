import { PropsWithChildren, useContext } from "react";

import { HeadingOffsetContext } from "./headingOffsetContext";

export interface HeadingOffsetProps extends PropsWithChildren {
  /**
   * How many levels deeper headings below sit than they are written. A
   * surface that is a page on its own (h1 and down) but is also shown inside
   * another page's section passes that depth.
   */
  offset?: number;
  /**
   * Starts again from the written levels. Dialogs and drawers reset, since
   * their title is always their h2.
   */
  reset?: boolean;
}

/**
 * Shifts the headings below by `offset` levels: `useHeadingComponent`,
 * `useHeadingLevel`, and library parts that pick their own level (Accordion,
 * ReferenceCategory) read it. One context for the app and the library.
 */
export function HeadingOffset(props: HeadingOffsetProps) {
  const { offset = 0, reset, children } = props;
  const parentOffset = useContext(HeadingOffsetContext);
  return (
    <HeadingOffsetContext.Provider value={reset ? 0 : parentOffset + offset}>
      {children}
    </HeadingOffsetContext.Provider>
  );
}
