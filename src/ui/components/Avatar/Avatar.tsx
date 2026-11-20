import { Avatar as BaseAvatar } from "@base-ui/react/avatar";
import { UserIcon } from "@phosphor-icons/react";
import { CSSProperties, ReactNode, useContext } from "react";

import { CssProp, withCssProp } from "ui/styles/cssProp";

import { css, cx } from "styled-system/css";

import { avatarStyles } from "./avatarStyles";
import { getAvatarHue, getInitials } from "./avatarUtils";
import { SizeContext } from "./sizeContext";

export type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl";

const imageStyles = css({
  width: "100%",
  height: "100%",
  objectFit: "cover",
});

export interface AvatarProps extends CssProp {
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
  } = withCssProp(props);
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
