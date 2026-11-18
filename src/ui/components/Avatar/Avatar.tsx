import { Avatar as BaseAvatar } from "@base-ui/react/avatar";
import { UserIcon } from "@phosphor-icons/react";
import {
  CSSProperties,
  Children,
  ReactNode,
  createContext,
  useContext,
} from "react";

import { LayoutProps, withLayoutProps } from "ui/styles/layoutProps";

import { css, cva, cx } from "styled-system/css";

import { getAvatarHue, getInitials } from "./avatarUtils";

export type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl";

const SizeContext = createContext<AvatarSize | undefined>(undefined);

const avatarStyles = cva({
  base: {
    position: "relative",
    boxSizing: "border-box",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    flex: "none",
    width: "var(--avatar-size)",
    height: "var(--avatar-size)",
    overflow: "hidden",
    borderRadius: "full",
    background: "oklch(0.9 0.06 var(--avatar-hue))",
    color: "oklch(0.36 0.09 var(--avatar-hue))",
    // `--avatar-ring` is set by AvatarGroup, so overlapping avatars stay
    // apart; one shadow list here means no second class has to override it.
    boxShadow:
      "var(--avatar-ring, 0 0 0 0 transparent), inset 0 0 0 1px color-mix(in oklab, currentColor 14%, transparent)",
    fontFamily: "heading",
    fontWeight: "bold",
    fontSize: "calc(var(--avatar-size) * 0.4)",
    lineHeight: 1,
    letterSpacing: "0.02em",
    userSelect: "none",
    verticalAlign: "middle",
    _dark: {
      background: "oklch(0.4 0.08 var(--avatar-hue))",
      color: "oklch(0.95 0.03 var(--avatar-hue))",
    },
    "& svg": { width: "55%", height: "55%" },
  },
  variants: {
    size: {
      xs: { "--avatar-size": "24px" },
      sm: { "--avatar-size": "32px" },
      md: { "--avatar-size": "40px" },
      lg: { "--avatar-size": "56px" },
      xl: { "--avatar-size": "80px" },
    },
    neutral: {
      true: {
        background: "bg.emphasized",
        color: "fg.muted",
        _dark: { background: "bg.emphasized", color: "fg.muted" },
      },
    },
  },
  defaultVariants: { size: "md" },
});

const imageStyles = css({
  width: "100%",
  height: "100%",
  objectFit: "cover",
});

export interface AvatarProps extends LayoutProps {
  /** The person or character; names the avatar and seeds its colour. */
  name?: string;
  src?: string;
  /** Overrides the initials worked out from `name`. */
  initials?: string;
  /** Overrides the colour seed, such as a user id. */
  colorSeed?: string;
  size?: AvatarSize;
  /**
   * Hide it from screen readers when the name is written beside it. By
   * default the avatar is an image named by `name`.
   */
  decorative?: boolean;
  className?: string;
  /** Shown while the image loads or when it fails; defaults to initials. */
  fallback?: ReactNode;
}

/**
 * A round picture of a person or character, falling back to initials on a
 * colour picked from the name.
 */
export function Avatar(props: AvatarProps) {
  const {
    name,
    src,
    initials,
    colorSeed,
    size,
    decorative = false,
    className,
    fallback,
  } = withLayoutProps(props);
  const groupSize = useContext(SizeContext);
  const shownInitials = initials ?? (name ? getInitials(name) : "");
  const seed = colorSeed ?? name ?? "";

  return (
    <BaseAvatar.Root
      className={cx(
        avatarStyles({ size: size ?? groupSize, neutral: !seed }),
        className,
      )}
      style={{ "--avatar-hue": getAvatarHue(seed) } as CSSProperties}
      role={decorative || !name ? undefined : "img"}
      aria-label={decorative ? undefined : name}
      aria-hidden={decorative || undefined}
    >
      {src && <BaseAvatar.Image src={src} alt="" className={imageStyles} />}
      <BaseAvatar.Fallback>
        {fallback ?? (shownInitials || <UserIcon weight="bold" />)}
      </BaseAvatar.Fallback>
    </BaseAvatar.Root>
  );
}

const groupStyles = css({
  display: "inline-flex",
  alignItems: "center",
  flexDirection: "row",
  // Each avatar is ringed in the surface colour and overlaps the one before.
  "--avatar-ring": "0 0 0 2px {colors.bg.surface}",
  "& > * + *": {
    marginInlineStart: "calc(var(--avatar-size, 40px) * -0.25)",
  },
});

export interface AvatarGroupProps extends LayoutProps {
  children: ReactNode;
  /** How many avatars show before "+N". */
  max?: number;
  size?: AvatarSize;
  /** Names the group, such as "Players". */
  label?: string;
  /** Names the overflow count; defaults to "N more". */
  moreLabel?: (count: number) => string;
  className?: string;
}

/** Overlapping avatars with a "+N" count for the rest. */
export function AvatarGroup(props: AvatarGroupProps) {
  const {
    children,
    max = 4,
    size = "md",
    label,
    moreLabel = (count: number) => `${count} more`,
    className,
  } = withLayoutProps(props);
  const items = Children.toArray(children);
  const shown = items.length > max ? items.slice(0, max - 1) : items;
  const rest = items.length - shown.length;

  return (
    <SizeContext.Provider value={size}>
      <div
        className={cx(groupStyles, className)}
        role={label ? "group" : undefined}
        aria-label={label}
        style={
          {
            "--avatar-size": `${{ xs: 24, sm: 32, md: 40, lg: 56, xl: 80 }[size]}px`,
          } as CSSProperties
        }
      >
        {shown}
        {rest > 0 && (
          <span
            className={avatarStyles({ size, neutral: true })}
            role="img"
            aria-label={moreLabel(rest)}
          >
            +{rest}
          </span>
        )}
      </div>
    </SizeContext.Provider>
  );
}
