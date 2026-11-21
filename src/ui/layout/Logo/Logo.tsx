import { CSSProperties, ComponentProps } from "react";

import { css, cx } from "styled-system/css";

import { CssProp, withCssProp } from "../../styles/cssProp";

const rootStyles = css({
  display: "inline-flex",
  alignItems: "center",
  gap: "2",
  flex: "none",
  minWidth: 0,
  color: "inherit",
});

/**
 * The hexagon wears `gradients.icon` as a background, cut to shape by a
 * mask, so it follows the colour scheme with no script. The figure is a
 * white SVG on top.
 */
const markStyles = css({
  position: "relative",
  display: "inline-block",
  flex: "none",
  width: "var(--logo-size, 32px)",
  height: "var(--logo-size, 32px)",
  backgroundImage: "token(gradients.icon)",
  maskImage:
    'url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 128 128%27%3E%3Cpath d=%27M58 3.4641C61.7128 1.32051 66.2872 1.32051 70 3.4641L113.426 28.5359C117.138 30.6795 119.426 34.641 119.426 38.9282V89.0718C119.426 93.359 117.138 97.3205 113.426 99.4641L70 124.536C66.2872 126.679 61.7128 126.679 58 124.536L14.5744 99.4641C10.8616 97.3205 8.57438 93.359 8.57438 89.0718V38.9282C8.57438 34.641 10.8616 30.6795 14.5744 28.5359L58 3.4641Z%27/%3E%3C/svg%3E")',
  maskSize: "100% 100%",
  maskRepeat: "no-repeat",
  forcedColorAdjust: "none",
  "& svg": {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
  },
});

const wordmarkStyles = css({
  fontFamily: "heading",
  fontWeight: "bold",
  fontSize: "var(--logo-wordmark-size, token(fontSizes.xl))",
  lineHeight: "none",
  letterSpacing: "0.01em",
  whiteSpace: "nowrap",
});

export interface LogoProps
  extends Omit<ComponentProps<"span">, "children">,
    CssProp {
  /** The mark's width and height, in pixels or any CSS length. */
  size?: number | string;
  /** Shows the name beside the mark. */
  wordmark?: boolean;
  /** The name the wordmark shows. */
  wordmarkLabel?: string;
  /**
   * Names the mark for screen readers. Leave it out where the mark only
   * decorates (the page heading or a link's text already says where you
   * are); give it when the mark alone is a link's content.
   */
  label?: string;
}

/**
 * Iron Link's mark: a hexagon in the scheme's icon gradient with the figure
 * on it, and an optional wordmark in the heading face.
 */
export function Logo(props: LogoProps) {
  const {
    size = 32,
    wordmark = false,
    wordmarkLabel = "Iron Link",
    label,
    className,
    style,
    ...rest
  } = withCssProp(props);

  const sizeValue = typeof size === "number" ? `${size}px` : size;
  // The wordmark scales with the mark, so a bigger logo stays balanced.
  const wordmarkSize = `calc(${sizeValue} * 0.72)`;

  // An element needs role="img" for its label to be read as its name. The
  // wordmark is real text, so with it the mark stays decorative.
  const a11yProps =
    label && !wordmark
      ? { role: "img", "aria-label": label }
      : { "aria-hidden": true };

  return (
    <span
      className={cx(rootStyles, className)}
      style={
        {
          "--logo-size": sizeValue,
          "--logo-wordmark-size": wordmarkSize,
          ...style,
        } as CSSProperties
      }
      {...rest}
    >
      <span className={markStyles} {...a11yProps}>
        <svg
          viewBox="0 0 128 128"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
          focusable="false"
        >
          <path
            d="M64.1222 44.2444C70.8171 44.2444 76.2444 38.8171 76.2444 32.1222C76.2444 25.4273 70.8171 20 64.1222 20C57.4273 20 52 25.4273 52 32.1222C52 38.8171 57.4273 44.2444 64.1222 44.2444Z"
            fill="white"
          />
          <path
            d="M35.0935 57.884C33.6421 57.884 32.6895 59.3714 33.3043 60.6862C34.453 63.1426 36.0884 66.6302 37.1322 68.8575C37.4615 69.5602 38.1661 70.0062 38.9422 70.0062H90.2414C91.0175 70.0062 91.7221 69.5602 92.0515 68.8575C93.0958 66.6303 94.7325 63.1426 95.8822 60.6862C96.4975 59.3715 95.5452 57.884 94.0937 57.884H35.0935Z"
            fill="white"
          />
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M62.0024 125.976C60.6149 125.742 59.2593 125.262 58.0024 124.536L52.5601 121.394L54.3452 77.8362C54.4331 75.6926 56.1964 74 58.3418 74H62.0024V125.976Z"
            fill="white"
          />
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M75.4424 121.394L70 124.536C68.7431 125.262 67.3875 125.742 66 125.976V74H69.6606C71.806 74 73.5694 75.6926 73.6572 77.8362L75.4424 121.394Z"
            fill="white"
          />
        </svg>
      </span>
      {wordmark && <span className={wordmarkStyles}>{wordmarkLabel}</span>}
    </span>
  );
}
