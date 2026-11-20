import type { IconWeight, Icon as PhosphorIcon } from "@phosphor-icons/react";

import { CssProp, withCssProp } from "ui/styles/cssProp";

import { cva, cx } from "styled-system/css";
import type { RecipeVariantProps } from "styled-system/css";

const iconStyles = cva({
  base: { flex: "none", display: "inline-block", verticalAlign: "middle" },
  variants: {
    color: {
      inherit: { color: "inherit" },
      default: { color: "fg.default" },
      muted: { color: "fg.muted" },
      subtle: { color: "fg.subtle" },
      accent: { color: "accent.fg" },
      success: { color: "success.fg" },
      warning: { color: "warning.fg" },
      danger: { color: "danger.fg" },
    },
  },
  defaultVariants: { color: "inherit" },
});

const sizes = { inherit: "1em", sm: 16, md: 20, lg: 24 } as const;

export type IconSize = keyof typeof sizes;

export type IconProps = RecipeVariantProps<typeof iconStyles> &
  CssProp & {
    /** The icon, one of the exports of `ui/icons`. */
    icon: PhosphorIcon;
    /**
     * `inherit` (default) follows the text around it. MUI's
     * `fontSize="small"` is `md` (20px) and its default is `lg` (24px).
     */
    size?: IconSize;
    /** Phosphor's weights; `regular` matches the rest of the library. */
    weight?: IconWeight;
    /**
     * Names an icon that means something on its own. Without it the icon is
     * decorative and hidden from screen readers.
     */
    label?: string;
    className?: string;
  };

/**
 * An icon. Screens use this rather than Phosphor's components, so sizes,
 * colours and screen reader handling stay the same everywhere:
 * `<Icon icon={DiceFiveIcon} size="md" color="muted" />`.
 *
 * Library components that take an icon (`Button` `startIcon`, `IconButton`)
 * size it themselves, so pass them the bare icon: `<DiceFiveIcon />`.
 */
export function Icon(props: IconProps) {
  const {
    icon: Component,
    size = "inherit",
    weight = "regular",
    color,
    label,
    className,
  } = withCssProp(props);
  return (
    <Component
      size={sizes[size]}
      weight={weight}
      className={cx(iconStyles({ color }), className)}
      {...(label
        ? { role: "img", "aria-label": label }
        : { "aria-hidden": true, focusable: false })}
    />
  );
}
