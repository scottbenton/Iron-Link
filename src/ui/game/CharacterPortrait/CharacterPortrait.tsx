import { UserCircle } from "@phosphor-icons/react";
import { CSSProperties, ComponentPropsWithoutRef, useState } from "react";

import type { SchemeName } from "ui/theme";

import { cva, cx } from "styled-system/css";

import {
  PortraitSize,
  getInitials,
  getPortraitGradient,
  portraitSizes,
} from "./portraitData";

export const portraitStyles = cva({
  base: {
    "--portrait-radius": "{radii.full}",
    position: "relative",
    display: "inline-flex",
    flex: "none",
    width: "var(--portrait-size)",
    height: "var(--portrait-size)",
    borderRadius: "var(--portrait-radius)",
    isolation: "isolate",
    verticalAlign: "middle",
    // The active ring: the scheme's ring gradient just outside the portrait,
    // with a gap of the surface between.
    _before: {
      content: '""',
      position: "absolute",
      zIndex: -1,
      inset: "calc(var(--portrait-ring) * -2)",
      borderRadius: "calc(var(--portrait-radius) + var(--portrait-ring) * 2)",
      background: "var(--gradients-ring)",
      opacity: 0,
      scale: "0.92",
      transitionProperty: "opacity, scale",
      transitionDuration: "normal",
      transitionTimingFunction: "out",
      _reducedMotion: { scale: "1" },
    },
    "&[data-active]::before": { opacity: 1, scale: "1" },
    "& > [data-portrait-face]": {
      position: "relative",
      display: "grid",
      placeItems: "center",
      width: "100%",
      height: "100%",
      overflow: "hidden",
      borderRadius: "inherit",
      background: "var(--portrait-gradient)",
      color: "white",
      fontFamily: "heading",
      fontWeight: "semibold",
      fontSize: "var(--portrait-font)",
      lineHeight: "none",
      letterSpacing: "0.02em",
      textShadow: "0 1px 2px rgb(0 0 0 / 0.3)",
      boxShadow: "inset 0 0 0 1px rgb(0 0 0 / 0.08)",
      userSelect: "none",
    },
    "&[data-active] > [data-portrait-face]": {
      boxShadow:
        "0 0 0 var(--portrait-ring) token(colors.bg.surface), inset 0 0 0 1px rgb(0 0 0 / 0.08)",
    },
    "& [data-portrait-image]": {
      position: "absolute",
      left: "50%",
      top: "50%",
      maxWidth: "none",
      translate: "var(--portrait-x) var(--portrait-y)",
    },
    "& [data-portrait-image][data-fit=tall]": {
      width: "var(--portrait-scale)",
      height: "auto",
    },
    "& [data-portrait-image][data-fit=wide]": {
      height: "var(--portrait-scale)",
      width: "auto",
    },
    "&[data-loading] > [data-portrait-face]": {
      background:
        "linear-gradient(90deg, token(colors.bg.emphasized) 25%, token(colors.bg.muted) 50%, token(colors.bg.emphasized) 75%)",
      backgroundSize: "200% 100%",
      animation: "shimmer 1.4s linear infinite",
      _reducedMotion: { animation: "none" },
    },
    "& [data-portrait-status]": {
      position: "absolute",
      insetInlineEnd: "calc(var(--portrait-size) * 0.02)",
      bottom: "calc(var(--portrait-size) * 0.02)",
      width: "max(8px, calc(var(--portrait-size) * 0.26))",
      height: "max(8px, calc(var(--portrait-size) * 0.26))",
      borderRadius: "full",
      background: "var(--portrait-status)",
      boxShadow: "0 0 0 2px token(colors.bg.surface)",
    },
    "& [data-portrait-status=online]": {
      "--portrait-status": "{colors.success.fg}",
    },
    "& [data-portrait-status=away]": {
      "--portrait-status": "{colors.warning.fg}",
    },
    // Doubled to outrank the plain [data-portrait-status] rule above.
    "& [data-portrait-status][data-portrait-status=offline]": {
      "--portrait-status": "{colors.fg.subtle}",
      background: "bg.surface",
      boxShadow:
        "0 0 0 2px token(colors.bg.surface), inset 0 0 0 2px token(colors.fg.subtle)",
    },
  },
  variants: {
    size: {
      xs: { "--portrait-font": "0.625rem", "--portrait-ring": "1.5px" },
      sm: { "--portrait-font": "0.8125rem", "--portrait-ring": "2px" },
      md: { "--portrait-font": "1.0625rem", "--portrait-ring": "2px" },
      lg: { "--portrait-font": "1.375rem", "--portrait-ring": "2px" },
      xl: { "--portrait-font": "2rem", "--portrait-ring": "3px" },
    },
    shape: {
      circle: { "--portrait-radius": "{radii.full}" },
      rounded: { "--portrait-radius": "{radii.md}" },
    },
  },
  compoundVariants: [
    {
      shape: "rounded",
      size: "xl",
      css: { "--portrait-radius": "{radii.lg}" },
    },
    {
      shape: "rounded",
      size: "xs",
      css: { "--portrait-radius": "{radii.sm}" },
    },
  ],
  defaultVariants: { size: "md", shape: "circle" },
});

export type PortraitStatus = "online" | "away" | "offline";

export interface PortraitCrop {
  /** The point to centre on, as fractions of the image (0 to 1). */
  position: { x: number; y: number };
  /** 1 fills the portrait; above 1 zooms in. */
  scale: number;
}

export interface CharacterPortraitProps
  extends Omit<ComponentPropsWithoutRef<"span">, "children"> {
  /** The character's name: the initials and the accessible name. */
  name: string;
  /** The portrait image. Without one, initials on a gradient. */
  portraitUrl?: string;
  /** Where the image is centred and how far it is zoomed, as Iron Link stores it. */
  crop?: PortraitCrop;
  size?: PortraitSize;
  shape?: "circle" | "rounded";
  /** Tints the initials' gradient with the character's colour scheme. */
  colorScheme?: SchemeName;
  /** A hue (0 to 360) for the gradient when there is no scheme. */
  colorSeed?: number;
  /** Rings the portrait with the gradient, for the active character. */
  active?: boolean;
  /** A dot at the bottom corner. */
  status?: PortraitStatus;
  /** What the dot means, for screen readers, such as "Online". */
  statusLabel?: string;
  /** Shows a shimmer while the character or image is loading. */
  loading?: boolean;
  /**
   * Hide from screen readers, where the name is written beside it, so it is
   * not read twice.
   */
  decorative?: boolean;
  /** The accessible name. "Portrait of {name}" by default. */
  label?: string;
  className?: string;
}

/**
 * A character's portrait: their image, or initials over a gradient tinted by
 * their colour scheme. A gradient ring marks the active character and a dot
 * shows a status.
 */
export function CharacterPortrait(props: CharacterPortraitProps) {
  const {
    name,
    portraitUrl,
    crop,
    size = "md",
    shape,
    colorScheme,
    colorSeed,
    active,
    status,
    statusLabel,
    loading,
    decorative,
    label,
    className,
    style,
    ...rest
  } = props;

  const [fit, setFit] = useState<"tall" | "wide">("tall");
  const [failedUrl, setFailedUrl] = useState<string>();
  const showImage = !!portraitUrl && failedUrl !== portraitUrl && !loading;

  const pixels = portraitSizes[size];
  const scale = crop?.scale ?? 1;
  const position = crop?.position ?? { x: 0.5, y: 0.5 };

  const accessibleName = [label ?? `Portrait of ${name}`, statusLabel]
    .filter(Boolean)
    .join(", ");
  const a11y =
    decorative || loading || !name
      ? { "aria-hidden": true as const }
      : { role: "img", "aria-label": accessibleName };

  const variables = {
    "--portrait-size": `${pixels}px`,
    "--portrait-gradient": getPortraitGradient({
      name,
      colorScheme,
      colorSeed,
    }),
    "--portrait-scale": `${scale * 100}%`,
    "--portrait-x": `${position.x * -100}%`,
    "--portrait-y": `${position.y * -100}%`,
  } as CSSProperties;

  return (
    <span
      className={cx(portraitStyles({ size, shape }), className)}
      data-active={active || undefined}
      data-loading={loading || undefined}
      style={{ ...variables, ...style }}
      {...a11y}
      {...rest}
    >
      <span data-portrait-face="">
        {showImage ? (
          <img
            data-portrait-image=""
            data-fit={fit}
            src={portraitUrl}
            alt=""
            draggable={false}
            onLoad={(event) => {
              const image = event.currentTarget;
              setFit(
                image.naturalWidth > image.naturalHeight ? "wide" : "tall",
              );
            }}
            onError={() => setFailedUrl(portraitUrl)}
          />
        ) : loading ? null : name ? (
          <span aria-hidden>{getInitials(name, pixels < 40 ? 1 : 2)}</span>
        ) : (
          <UserCircle aria-hidden width="60%" height="60%" />
        )}
      </span>
      {status && <span data-portrait-status={status} aria-hidden />}
    </span>
  );
}
