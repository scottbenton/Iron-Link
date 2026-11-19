import { UserCircle } from "@phosphor-icons/react";
import { CSSProperties, ComponentPropsWithoutRef, useState } from "react";

import { LayoutProps, withLayoutProps } from "ui/styles/layoutProps";
import { SchemeName, schemes } from "ui/theme";

import { cva, cx } from "styled-system/css";

import { PortraitSize, getInitials, portraitSizes } from "./portraitData";

export const portraitStyles = cva({
  base: {
    "--portrait-radius": "{radii.full}",
    position: "relative",
    display: "inline-flex",
    flex: "none",
    width: "var(--portrait-size)",
    height: "var(--portrait-size)",
    borderRadius: "var(--portrait-radius)",
    verticalAlign: "middle",
    "& > [data-portrait-face]": {
      position: "relative",
      display: "grid",
      placeItems: "center",
      width: "100%",
      height: "100%",
      overflow: "hidden",
      borderRadius: "inherit",
      background: "bg.emphasized",
      color: "fg.muted",
      fontFamily: "heading",
      fontWeight: "bold",
      fontSize: "var(--portrait-font)",
      lineHeight: "none",
      letterSpacing: "0.02em",
      userSelect: "none",
    },
    // A ring around a neutral face: the character's colour scheme, as the
    // app does today, or gray without one. Drawn over the image, inside the
    // clip.
    "& > [data-portrait-face]::after": {
      content: '""',
      position: "absolute",
      inset: 0,
      borderRadius: "inherit",
      boxShadow: "inset 0 0 0 var(--portrait-ring-width) var(--portrait-ring)",
      pointerEvents: "none",
    },
    "--portrait-ring": "{colors.border.control}",
    "&[data-scheme]": {
      "--portrait-ring": "var(--portrait-ring-light)",
      _dark: { "--portrait-ring": "var(--portrait-ring-dark)" },
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
    // Loading looks exactly like a Skeleton: the same colour and slow
    // pulse, and no ring, which drew a steady grey edge over the pulse.
    "&[data-loading] > [data-portrait-face]": {
      background: "bg.emphasized",
      animation: "pulse 1.8s ease-in-out infinite",
      _reducedMotion: { animation: "none" },
    },
    "&[data-loading] > [data-portrait-face]::after": { display: "none" },
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
      xs: { "--portrait-font": "0.625rem", "--portrait-ring-width": "1.5px" },
      sm: { "--portrait-font": "0.8125rem", "--portrait-ring-width": "2px" },
      md: { "--portrait-font": "1.0625rem", "--portrait-ring-width": "2px" },
      lg: { "--portrait-font": "1.375rem", "--portrait-ring-width": "2px" },
      xl: { "--portrait-font": "2rem", "--portrait-ring-width": "3px" },
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
  extends LayoutProps,
    Omit<ComponentPropsWithoutRef<"span">, "children"> {
  /** The character's name: the initials and the accessible name. */
  name: string;
  /** The portrait image. Without one, initials on a neutral face. */
  portraitUrl?: string;
  /** Where the image is centred and how far it is zoomed, as Iron Link stores it. */
  crop?: PortraitCrop;
  size?: PortraitSize;
  shape?: "circle" | "rounded";
  /**
   * The character's colour scheme: a ring in its colour around a neutral
   * face. Without one the ring is gray.
   */
  colorScheme?: SchemeName;
  /** A dot at the bottom corner. */
  status?: PortraitStatus;
  /** What the dot means, for screen readers, such as "Online". */
  statusLabel?: string;
  /** Pulses like a Skeleton while the character or image is loading. */
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
 * A character's portrait: their image, or their initials, ringed in their
 * colour scheme's colour (gray without one). A dot at the corner shows a
 * status.
 */
export function CharacterPortrait(props: CharacterPortraitProps) {
  const {
    name,
    portraitUrl,
    crop,
    size = "md",
    shape,
    colorScheme,
    status,
    statusLabel,
    loading,
    decorative,
    label,
    className,
    style,
    ...rest
  } = withLayoutProps(props);

  const [fit, setFit] = useState<"tall" | "wide">("tall");
  const [failedUrl, setFailedUrl] = useState<string>();
  const showImage = !!portraitUrl && failedUrl !== portraitUrl && !loading;

  const pixels = portraitSizes[size];
  const scheme =
    colorScheme && colorScheme in schemes ? schemes[colorScheme] : undefined;
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
    ...(scheme && {
      "--portrait-ring-light": scheme.light.solid,
      "--portrait-ring-dark": scheme.dark.solid,
    }),
    "--portrait-scale": `${scale * 100}%`,
    "--portrait-x": `${position.x * -100}%`,
    "--portrait-y": `${position.y * -100}%`,
  } as CSSProperties;

  return (
    <span
      className={cx(portraitStyles({ size, shape }), className)}
      data-loading={loading || undefined}
      data-scheme={scheme ? colorScheme : undefined}
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
