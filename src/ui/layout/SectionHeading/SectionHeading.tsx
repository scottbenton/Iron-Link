import { ReactNode } from "react";

import { css, cx } from "styled-system/css";

/** A muted band, for sections inside a dense sheet. */
const rootStyles = css({
  boxSizing: "border-box",
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  justifyContent: "space-between",
  columnGap: "4",
  rowGap: "2",
  minHeight: "40px",
  paddingBlock: "1",
  paddingInline: "3",
  borderRadius: "md",
  background: "bg.emphasized",
  color: "fg.default",
  fontFamily: "body",
});

const textStyles = css({
  display: "flex",
  flexDirection: "column",
  gap: "0.5",
  flex: "1 1 200px",
  minWidth: 0,
});

// The label is quiet: uppercase and muted, like the old grey section
// headings on the sheet.
const headingStyles = css({
  margin: 0,
  fontFamily: "heading",
  fontWeight: "bold",
  fontSize: "md",
  lineHeight: "tight",
  textTransform: "uppercase",
  letterSpacing: "label",
  color: "fg.muted",
  textWrap: "balance",
  overflowWrap: "anywhere",
});

const descriptionStyles = css({
  margin: 0,
  color: "fg.muted",
  fontSize: "sm",
  lineHeight: "normal",
});

const actionsStyles = css({
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  gap: "1",
});

export interface SectionHeadingProps {
  title: ReactNode;
  /** The heading level; headings nest by section (CLAUDE.md). */
  as?: "h2" | "h3";
  /** An id for the heading, for aria-labelledby on the section. */
  id?: string;
  /** A line of help under the title. */
  description?: ReactNode;
  /** Buttons at the end of the row. */
  actions?: ReactNode;
  className?: string;
}

/**
 * A section's heading in a muted band, with optional actions beside it, for
 * sections inside a dense sheet.
 */
export function SectionHeading(props: SectionHeadingProps) {
  const {
    title,
    as: Heading = "h2",
    id,
    description,
    actions,
    className,
  } = props;

  return (
    <div className={cx(rootStyles, className)}>
      <div className={textStyles}>
        <Heading id={id} className={headingStyles}>
          {title}
        </Heading>
        {description && <p className={descriptionStyles}>{description}</p>}
      </div>
      {actions && <div className={actionsStyles}>{actions}</div>}
    </div>
  );
}
