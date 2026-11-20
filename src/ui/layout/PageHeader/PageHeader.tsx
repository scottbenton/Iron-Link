import { ReactNode } from "react";

import { css, cx } from "styled-system/css";

import { Text } from "../../components/Text";
import { CssProp, withCssProp } from "../../styles/cssProp";
import { Subtitle } from "../Subtitle";
import { contentRailStyles } from "../shared/contentRail";
import { pageInset } from "../shared/shell";

const rootStyles = css({
  boxSizing: "border-box",
  flex: "none",
  background: "bg.surface",
  color: "fg.default",
  fontFamily: "body",
  paddingBlockStart: "6",
  paddingBlockEnd: "6",
  "@container shell (min-width: 900px)": { paddingBlockStart: "8" },
});

const dividerStyles = css({
  borderBottom: "1px solid token(colors.border.default)",
});

const railStyles = css({
  display: "flex",
  flexDirection: "column",
  gap: "4",
});

const heroStyles = css({
  position: "relative",
  overflow: "hidden",
  height: "140px",
  borderRadius: "lg",
  border: "1px solid token(colors.border.default)",
  background: "bg.emphasized",
  "@container shell (min-width: 600px)": { height: "200px" },
  "& img": {
    display: "block",
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  // A soft fade into the page under the band, so a busy image ends cleanly.
  _after: {
    content: '""',
    position: "absolute",
    inset: 0,
    background:
      "linear-gradient(to bottom, transparent 55%, color-mix(in oklab, token(colors.gray.950) 35%, transparent))",
    pointerEvents: "none",
  },
});

const rowStyles = css({
  display: "flex",
  flexWrap: "wrap",
  alignItems: "flex-end",
  justifyContent: "space-between",
  columnGap: "6",
  rowGap: "4",
});

const textStyles = css({
  display: "flex",
  flexDirection: "column",
  gap: "1",
  flex: "1 1 320px",
  minWidth: 0,
  margin: 0,
});

const groupStyles = css({
  display: "flex",
  flexDirection: "column",
  gap: "1",
  margin: 0,
  minWidth: 0,
});

const titleStyles = css({
  margin: 0,
  fontFamily: "heading",
  fontWeight: "bold",
  lineHeight: "tight",
  letterSpacing: "-0.005em",
  textWrap: "balance",
  overflowWrap: "anywhere",
});

const titleSizeStyles = {
  h1: css({
    fontSize: "2xl",
    "@container shell (min-width: 600px)": {
      fontSize: "3xl",
      lineHeight: "none",
    },
  }),
  h2: css({ fontSize: "2xl" }),
};

const descriptionStyles = css({
  margin: 0,
  marginBlockStart: "1",
  maxWidth: "70ch",
  color: "fg.muted",
  fontSize: "md",
  lineHeight: "normal",
});

const actionsStyles = css({
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  gap: "2",
});

export interface PageHeaderProps extends CssProp {
  /** The page's title. */
  title: ReactNode;
  /**
   * The title's element. h1 when the header names the page (a list page);
   * h2 where the NavBar already holds the page's h1 (the game page).
   */
  titleAs?: "h1" | "h2";
  titleId?: string;
  /** A short accent line above the title, such as the game's ruleset. */
  eyebrow?: ReactNode;
  /**
   * The line under the title. An array becomes facts joined by dots
   * ("Ironsworn", "Co-op", "3 characters"); see Subtitle.
   */
  subtitle?: ReactNode | ReactNode[];
  /** A paragraph under the subtitle. */
  description?: ReactNode;
  /** Above the title: Breadcrumbs. */
  breadcrumbs?: ReactNode;
  /** Beside the title, below it on phones: the page's main buttons. */
  actions?: ReactNode;
  /** A decorative image band above the title, such as a world's cover. */
  heroImage?: { src: string; alt?: string; position?: string };
  /** A rule under the header, for pages whose content sits on the canvas. */
  divider?: boolean;
  /** Content under the title row, such as page tabs. */
  children?: ReactNode;
  className?: string;
}

/**
 * The top of a page: optional breadcrumbs and image band, then the eyebrow,
 * title, subtitle and description beside the page's actions. Its insets and
 * rail match PageContent's, so the two line up.
 */
export function PageHeader(props: PageHeaderProps) {
  const {
    title,
    titleAs = "h1",
    titleId,
    eyebrow,
    subtitle,
    description,
    breadcrumbs,
    actions,
    heroImage,
    divider,
    children,
    className,
  } = withCssProp(props);

  const Heading = titleAs;
  // An hgroup keeps the eyebrow and subtitle with the heading they belong
  // to, without making either a heading.
  const hasGroup = !!eyebrow || !!subtitle;
  const Group = hasGroup ? "hgroup" : "div";

  return (
    <div
      className={cx(rootStyles, pageInset, divider && dividerStyles, className)}
    >
      <div className={cx(contentRailStyles(), railStyles)}>
        {heroImage && (
          <div className={heroStyles}>
            <img
              src={heroImage.src}
              alt={heroImage.alt ?? ""}
              style={{ objectPosition: heroImage.position }}
            />
          </div>
        )}
        {breadcrumbs}
        <div className={rowStyles}>
          <div className={textStyles}>
            <Group className={groupStyles}>
              {eyebrow && <Text variant="eyebrow">{eyebrow}</Text>}
              <Heading
                id={titleId}
                className={cx(titleStyles, titleSizeStyles[titleAs])}
              >
                {title}
              </Heading>
              {subtitle !== undefined &&
                subtitle !== null &&
                (Array.isArray(subtitle) ? (
                  <Subtitle items={subtitle} />
                ) : (
                  <Subtitle>{subtitle}</Subtitle>
                ))}
            </Group>
            {description && <p className={descriptionStyles}>{description}</p>}
          </div>
          {actions && <div className={actionsStyles}>{actions}</div>}
        </div>
        {children}
      </div>
    </div>
  );
}
