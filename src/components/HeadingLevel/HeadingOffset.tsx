import { PropsWithChildren, useContext } from "react";

import { HeadingOffsetContext } from "./headingOffsetContext";

export interface HeadingOffsetProps extends PropsWithChildren {
  // How many levels deeper headings below sit than they are written. A
  // surface that is a page on its own (h1 and down) but is also shown inside
  // another page's section passes that depth. Dialogs pass `reset`, since a
  // dialog's title is always its h2.
  offset?: number;
  reset?: boolean;
}

export function HeadingOffset(props: HeadingOffsetProps) {
  const { offset = 0, reset, children } = props;
  const parentOffset = useContext(HeadingOffsetContext);
  return (
    <HeadingOffsetContext.Provider value={reset ? 0 : parentOffset + offset}>
      {children}
    </HeadingOffsetContext.Provider>
  );
}
