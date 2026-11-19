import { CSSProperties, ComponentPropsWithoutRef } from "react";

import { Tooltip } from "ui/components/Tooltip";
import { LayoutProps, withLayoutProps } from "ui/styles/layoutProps";

import { cva, cx } from "styled-system/css";

import {
  CharacterPortrait,
  CharacterPortraitProps,
} from "../CharacterPortrait/CharacterPortrait";
import { PortraitSize, portraitSizes } from "../CharacterPortrait/portraitData";

const groupStyles = cva({
  base: {
    display: "inline-flex",
    alignItems: "center",
    flexDirection: "row",
    isolation: "isolate",
    margin: 0,
    padding: 0,
    listStyle: "none",
    "& > li": {
      display: "inline-flex",
      position: "relative",
      borderRadius: "full",
    },
    "& > li + li": {
      marginInlineStart: "calc(var(--portrait-size) * var(--group-overlap))",
    },
    // A ring of the surface separates overlapping portraits.
    "& > li > [data-group-member] > [data-portrait-face], & > li > [data-group-overflow]":
      {
        boxShadow: "0 0 0 2px token(colors.bg.surface)",
      },
    "& [data-group-overflow]": {
      display: "inline-grid",
      placeItems: "center",
      width: "var(--portrait-size)",
      height: "var(--portrait-size)",
      paddingInline: "1",
      minWidth: "var(--portrait-size)",
      borderRadius: "full",
      background: "bg.emphasized",
      color: "fg.muted",
      fontFamily: "heading",
      fontWeight: "bold",
      fontSize: "calc(var(--portrait-size) * 0.36)",
      fontVariantNumeric: "tabular-nums",
      lineHeight: "none",
    },
  },
  variants: {
    spacing: {
      overlap: { "--group-overlap": "-0.28" },
      apart: { "--group-overlap": "0.18" },
    },
  },
  defaultVariants: { spacing: "overlap" },
});

export interface PortraitGroupMember
  extends Omit<CharacterPortraitProps, "size" | "decorative"> {
  id: string;
}

export interface PortraitGroupProps
  extends LayoutProps,
    Omit<ComponentPropsWithoutRef<"ul">, "children"> {
  /** The characters, in order. */
  members: PortraitGroupMember[];
  size?: PortraitSize;
  /**
   * The most items to show, the "+N" count included: with 6 members and a
   * max of 4, three portraits and "+3". All by default.
   */
  max?: number;
  /** Overlapping like a stack, or a little apart. */
  spacing?: "overlap" | "apart";
  /** The group's name for screen readers, such as "Party". */
  label?: string;
  /** What the "+N" count says to screen readers. */
  overflowLabel?: (count: number, names: string[]) => string;
  className?: string;
}

/**
 * A row of character portraits, overlapping by default, with a "+N" count
 * for any past `max`. Each name shows in a tooltip on hover.
 */
export function PortraitGroup(props: PortraitGroupProps) {
  const {
    members,
    size = "sm",
    max,
    spacing,
    label = "Characters",
    overflowLabel = (count, names) => `${count} more: ${names.join(", ")}`,
    className,
    style,
    ...rest
  } = withLayoutProps<PortraitGroupProps>(props);

  const visibleCount =
    max !== undefined && members.length > max
      ? Math.max(max - 1, 1)
      : members.length;
  const visible = members.slice(0, visibleCount);
  const hidden = members.slice(visibleCount);

  return (
    <ul
      className={cx(groupStyles({ spacing }), className)}
      aria-label={label}
      style={
        {
          "--portrait-size": `${portraitSizes[size]}px`,
          ...style,
        } as CSSProperties
      }
      {...rest}
    >
      {visible.map((member, index) => {
        const { id, ...portrait } = member;
        return (
          <li key={id} style={{ zIndex: visible.length - index }}>
            <Tooltip title={member.name}>
              <CharacterPortrait
                data-group-member=""
                size={size}
                {...portrait}
              />
            </Tooltip>
          </li>
        );
      })}
      {hidden.length > 0 && (
        <li>
          <span
            data-group-overflow=""
            role="img"
            aria-label={overflowLabel(
              hidden.length,
              hidden.map((member) => member.name),
            )}
          >
            <span aria-hidden>+{hidden.length}</span>
          </span>
        </li>
      )}
    </ul>
  );
}
