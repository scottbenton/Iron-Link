import { ReactNode } from "react";

import { css } from "styled-system/css";

import {
  SectionTab,
  SectionTabList,
  SectionTabWell,
  Tabs,
} from "../../components/Tabs";
import { SidebarHeaderEnd } from "../Sidebar";
import type { LayoutSection } from "../shared/layoutPanel";

/**
 * A side column's tabs in a well, with the column's own controls (Collapse)
 * at its end, as the game page's columns do.
 */
export function ColumnTabs(props: {
  label: string;
  sections: LayoutSection[];
  value: string;
  onValueChange: (value: string) => void;
  children: ReactNode;
}) {
  const { label, sections, value, onValueChange, children } = props;
  return (
    <Tabs
      value={value}
      onValueChange={(next) => onValueChange(String(next))}
      className={columnTabsStyles}
    >
      <div className={columnTabRowStyles}>
        <SectionTabWell end={<SidebarHeaderEnd />}>
          <SectionTabList aria-label={label}>
            {sections.map((section) => (
              <SectionTab key={section.id} value={section.id}>
                {section.title}
              </SectionTab>
            ))}
          </SectionTabList>
        </SectionTabWell>
      </div>
      {children}
    </Tabs>
  );
}

const columnTabsStyles = css({
  display: "flex",
  flexDirection: "column",
  height: "100%",
});

const columnTabRowStyles = css({
  flex: "none",
  position: "sticky",
  top: 0,
  zIndex: 2,
});
