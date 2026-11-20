import { CSSProperties, Children, ReactNode } from "react";

import { CssProp, withCssProp } from "ui/styles/cssProp";

import { css, cx } from "styled-system/css";

import { AvatarSize } from "./Avatar";
import { avatarStyles } from "./avatarStyles";
import { SizeContext } from "./sizeContext";

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

export interface AvatarGroupProps extends CssProp {
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
  } = withCssProp(props);
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
