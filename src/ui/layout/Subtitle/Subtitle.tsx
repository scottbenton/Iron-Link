import { ElementType, Fragment, ReactNode } from "react";

import { cva, cx } from "styled-system/css";

import { VisuallyHidden } from "../../components/VisuallyHidden";

const subtitleStyles = cva({
  base: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    columnGap: "2",
    rowGap: "0.5",
    margin: 0,
    minWidth: 0,
    color: "fg.muted",
    fontFamily: "body",
    "& [data-part=separator]": { color: "fg.subtle" },
    "& [data-part=item]": {
      display: "inline-flex",
      alignItems: "center",
      gap: "1.5",
      minWidth: 0,
    },
    "& svg": { width: "1.1em", height: "1.1em", flex: "none" },
  },
  variants: {
    variant: {
      /** Body text: a line of facts under a page title. */
      default: { fontSize: "md", lineHeight: "normal" },
      /** Smaller, for card and section titles. */
      small: { fontSize: "sm", lineHeight: "snug" },
      /** Uppercase heading face, like the old page header sub-label. */
      label: {
        fontFamily: "heading",
        fontWeight: "semibold",
        fontSize: "sm",
        lineHeight: "snug",
        textTransform: "uppercase",
        letterSpacing: "label",
      },
    },
  },
  defaultVariants: { variant: "default" },
});

export interface SubtitleProps {
  /**
   * The facts to show, joined by a middle dot: "Ironsworn", "Co-op",
   * "3 characters". Each may hold an icon before its text.
   */
  items?: ReactNode[];
  /** Free text instead of `items`. */
  children?: ReactNode;
  variant?: "default" | "small" | "label";
  /**
   * The element. A paragraph by default; never a heading, since a subtitle
   * belongs to the title above it rather than starting a section.
   */
  as?: ElementType;
  className?: string;
}

/**
 * The line under a page or section title: free text, or a few facts joined
 * by dots. Screen readers hear commas in place of the dots.
 */
export function Subtitle(props: SubtitleProps) {
  const { items, children, variant, as: Element = "p", className } = props;

  return (
    <Element className={cx(subtitleStyles({ variant }), className)}>
      {items
        ? items.map((item, index) => (
            <Fragment key={index}>
              {index > 0 && (
                <>
                  <VisuallyHidden>, </VisuallyHidden>
                  <span data-part="separator" aria-hidden="true">
                    ·
                  </span>
                </>
              )}
              <span data-part="item">{item}</span>
            </Fragment>
          ))
        : children}
    </Element>
  );
}
