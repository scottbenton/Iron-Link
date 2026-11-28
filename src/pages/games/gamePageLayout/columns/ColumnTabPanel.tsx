import { ReactNode } from "react";

import { TabPanel } from "ui/components/Tabs";

export interface ColumnTabPanelProps {
  value: string;
  id?: string;
  /** Scroll on its own, under the column's tabs. */
  fill?: boolean;
  /** Leave out the padding, for content that sets its own. */
  flush?: boolean;
  children: ReactNode;
}

/**
 * One of a game page column's panels. Panels stay mounted while hidden, so
 * each keeps its scroll position and open sections.
 */
export function ColumnTabPanel(props: ColumnTabPanelProps) {
  const { value, id, fill, flush, children } = props;
  return (
    <TabPanel
      value={value}
      id={id}
      keepMounted
      // Panda reads these at build time, so each value is a literal.
      css={{
        padding: flush ? "0" : "4",
        flex: fill ? "1 1 auto" : undefined,
        minHeight: fill ? "0" : undefined,
        overflowY: fill ? "auto" : undefined,
        "&[hidden]": { display: "none" },
      }}
    >
      {children}
    </TabPanel>
  );
}
