import { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import {
  SectionTab,
  SectionTabList,
  SectionTabWell,
  Tabs,
} from "ui/components/Tabs";
import { LayoutSection, SidebarHeaderEnd } from "ui/layout";
import { Box } from "ui/primitives";

export interface ColumnTabsProps<Id extends string> {
  /** Names the tab list, such as "Character Sections". */
  label: string;
  /** `unread` draws a count after the name, as on the notes' tabs. */
  sections: (LayoutSection & { id: Id; unread?: number })[];
  value: Id;
  onValueChange: (value: Id) => void;
  /**
   * Give each panel its own scrolling under the tabs, rather than the
   * column scrolling as a whole.
   */
  fill?: boolean;
  /** The column's `ColumnTabPanel`s. */
  children: ReactNode;
}

/**
 * A game page column's own tabs in a well, the column's controls (its
 * menu and Collapse) at the well's end, and the panels under them.
 */
export function ColumnTabs<Id extends string>(props: ColumnTabsProps<Id>) {
  const { label, sections, value, onValueChange, fill, children } = props;
  const { t } = useTranslation();
  return (
    <Tabs
      value={value}
      onValueChange={(next) => onValueChange(next as Id)}
      // With fill, each panel scrolls on its own under the tabs (the
      // reference). Panda reads these at build time, so each is a literal.
      css={{
        display: "flex",
        flexDirection: "column",
        flex: fill ? "1 1 auto" : undefined,
        height: fill ? "100%" : undefined,
        minHeight: fill ? "0" : "100%",
      }}
    >
      {/* The tabs stay put while the column scrolls. */}
      <Box flex="none" position="sticky" top="0" zIndex="2">
        <SectionTabWell end={<SidebarHeaderEnd />}>
          <SectionTabList aria-label={label}>
            {sections.map((section) => (
              <SectionTab
                key={section.id}
                value={section.id}
                aria-label={
                  section.unread
                    ? t("game.column-tabs.unread", "{{name}}, {{count}} new", {
                        name: section.title,
                        count: section.unread,
                      })
                    : undefined
                }
              >
                {section.title}
                {section.unread ? (
                  <Box
                    as="span"
                    aria-hidden
                    display="inline-grid"
                    placeItems="center"
                    minWidth="18px"
                    height="18px"
                    paddingInline="1"
                    boxSizing="border-box"
                    borderRadius="full"
                    bg="accent.solid"
                    color="accent.onSolid"
                    fontSize="2xs"
                    fontWeight="bold"
                    fontVariantNumeric="tabular-nums"
                  >
                    {section.unread}
                  </Box>
                ) : null}
              </SectionTab>
            ))}
          </SectionTabList>
        </SectionTabWell>
      </Box>
      {children}
    </Tabs>
  );
}
