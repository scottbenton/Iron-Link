import { ReactNode } from "react";

import { css, cva, cx } from "styled-system/css";

const rootStyles = cva({
  base: {
    boxSizing: "border-box",
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    columnGap: "4",
    rowGap: "2",
    color: "fg.default",
    fontFamily: "body",
  },
  variants: {
    variant: {
      /** A heading on the page, with a rule under it. */
      plain: {
        paddingBlockEnd: "2",
        borderBottom: "1px solid token(colors.border.subtle)",
      },
      /** A muted band, for sections inside a dense sheet. */
      band: {
        minHeight: "40px",
        paddingBlock: "1",
        paddingInline: "3",
        borderRadius: "md",
        background: "bg.emphasized",
      },
      /** No rule or band. */
      bare: {},
    },
  },
  defaultVariants: { variant: "plain" },
});

const textStyles = css({
  display: "flex",
  flexDirection: "column",
  gap: "0.5",
  flex: "1 1 200px",
  minWidth: 0,
});

const headingStyles = cva({
  base: {
    margin: 0,
    fontFamily: "heading",
    fontWeight: "bold",
    lineHeight: "tight",
    textWrap: "balance",
    overflowWrap: "anywhere",
  },
  variants: {
    level: { h2: {}, h3: {} },
    variant: { plain: {}, bare: {}, band: {} },
  },
  compoundVariants: [
    { level: "h2", variant: ["plain", "bare"], css: { fontSize: "xl" } },
    { level: "h3", variant: ["plain", "bare"], css: { fontSize: "lg" } },
    // The band's label is quieter: uppercase and muted, like the old grey
    // section headings on the sheet.
    {
      variant: "band",
      css: {
        fontSize: "md",
        textTransform: "uppercase",
        letterSpacing: "label",
        color: "fg.muted",
      },
    },
  ],
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
  variant?: "plain" | "band" | "bare";
  className?: string;
}

/** A section's heading with optional actions beside it. */
export function SectionHeading(props: SectionHeadingProps) {
  const {
    title,
    as: Heading = "h2",
    id,
    description,
    actions,
    variant = "plain",
    className,
  } = props;

  return (
    <div className={cx(rootStyles({ variant }), className)}>
      <div className={textStyles}>
        <Heading id={id} className={headingStyles({ level: Heading, variant })}>
          {title}
        </Heading>
        {description && <p className={descriptionStyles}>{description}</p>}
      </div>
      {actions && <div className={actionsStyles}>{actions}</div>}
    </div>
  );
}
