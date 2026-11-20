import { css } from "styled-system/css";

import {
  SectionTab,
  SectionTabList,
  SectionTabWell,
} from "../../components/Tabs";
import { SidebarHeaderEnd } from "../Sidebar";
import type { LayoutSection } from "../shared/layoutPanel";

/**
 * The row holding a column's tabs: a well edge to edge. It stays at the top
 * while the column scrolls, as the header did, so the tabs and (stacked)
 * Collapse never scroll away.
 */
const tabRowStyles = css({
  flex: "none",
  marginBlockEnd: "4",
  position: "sticky",
  top: 0,
  zIndex: 2,
});

/**
 * A column's tabs in a well. The band also takes the column header's
 * controls when the sidebars stack into one column (`SidebarHeaderEnd`), so
 * the stacked column has no title rows and the tabs are its top row.
 */
export function ColumnTabList(props: {
  label: string;
  sections: LayoutSection[];
}) {
  const { label, sections } = props;
  return (
    <div className={tabRowStyles}>
      <SectionTabWell end={<SidebarHeaderEnd />}>
        <SectionTabList aria-label={label}>
          {sections.map((tab) => (
            <SectionTab key={tab.id} value={tab.id}>
              {tab.title}
            </SectionTab>
          ))}
        </SectionTabList>
      </SectionTabWell>
    </div>
  );
}
