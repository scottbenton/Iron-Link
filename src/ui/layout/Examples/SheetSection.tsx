import { ReactNode } from "react";

import { css } from "styled-system/css";

import { SectionHeading } from "../SectionHeading";

/** A headed part of the sheet. */
export function SheetSection(props: {
  title: string;
  as?: "h2" | "h3";
  actions?: ReactNode;
  children: ReactNode;
}) {
  const { title, as = "h3", actions, children } = props;
  return (
    <section className={sheetSectionStyles}>
      <SectionHeading title={title} as={as} actions={actions} />
      {children}
    </section>
  );
}

const sheetSectionStyles = css({ display: "grid", gap: "2", minWidth: 0 });
