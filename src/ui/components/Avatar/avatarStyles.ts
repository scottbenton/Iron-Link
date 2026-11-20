import { cva } from "styled-system/css";

export const avatarStyles = cva({
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
