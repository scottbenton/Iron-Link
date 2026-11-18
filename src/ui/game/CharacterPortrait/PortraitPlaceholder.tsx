import { Button as BaseButton } from "@base-ui/react/button";
import { Camera } from "@phosphor-icons/react";
import { CSSProperties, ComponentProps, forwardRef } from "react";

import { LayoutProps, withLayoutProps } from "ui/styles/layoutProps";

import { cva, cx } from "styled-system/css";

import { PortraitSize, portraitSizes } from "./portraitData";

const placeholderStyles = cva({
  base: {
    "--portrait-radius": "{radii.full}",
    position: "relative",
    display: "inline-flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "1",
    flex: "none",
    width: "var(--portrait-size)",
    height: "var(--portrait-size)",
    padding: 0,
    borderRadius: "var(--portrait-radius)",
    borderWidth: "1.5px",
    borderStyle: "dashed",
    borderColor: "border.control",
    background: "bg.muted",
    color: "fg.muted",
    fontFamily: "body",
    fontSize: "xs",
    fontWeight: "semibold",
    lineHeight: "tight",
    textAlign: "center",
    cursor: "pointer",
    WebkitTapHighlightColor: "transparent",
    transitionProperty: "background-color, border-color, color",
    transitionDuration: "fast",
    transitionTimingFunction: "out",
    outline: "none",
    "& svg": {
      width: "max(14px, calc(var(--portrait-size) * 0.32))",
      height: "max(14px, calc(var(--portrait-size) * 0.32))",
    },
    _hover: {
      borderColor: "accent.fg",
      color: "accent.fg",
      background: "accent.soft",
    },
    _pressed: { background: "overlay.pressed" },
    _focusVisible: {
      outline: "2px solid token(colors.focusRing)",
      outlineOffset: "2px",
    },
    "&:is(:disabled, [data-disabled])": {
      cursor: "not-allowed",
      color: "fg.disabled",
      borderColor: "border.default",
      background: "bg.muted",
    },
    "&[data-busy]": { cursor: "progress" },
  },
  variants: {
    shape: {
      circle: { "--portrait-radius": "{radii.full}" },
      rounded: { "--portrait-radius": "{radii.lg}" },
    },
  },
  defaultVariants: { shape: "circle" },
});

export interface PortraitPlaceholderProps
  extends LayoutProps,
    Omit<
      ComponentProps<typeof BaseButton>,
      "className" | "children" | "style"
    > {
  size?: PortraitSize;
  shape?: "circle" | "rounded";
  /** The button's name, and its visible caption at xl. */
  label?: string;
  className?: string;
  style?: CSSProperties;
}

/**
 * An empty portrait to press for uploading one: a dashed outline with a
 * camera, the same size as the portrait it stands in for.
 */
export const PortraitPlaceholder = forwardRef<
  HTMLElement,
  PortraitPlaceholderProps
>(function PortraitPlaceholder(props, ref) {
  const {
    size = "lg",
    shape,
    label = "Upload portrait",
    className,
    style,
    ...rest
  } = withLayoutProps(props);
  const pixels = portraitSizes[size];
  const showCaption = pixels >= portraitSizes.xl;
  return (
    <BaseButton
      ref={ref}
      className={cx(placeholderStyles({ shape }), className)}
      style={{ "--portrait-size": `${pixels}px`, ...style } as CSSProperties}
      aria-label={showCaption ? undefined : label}
      {...rest}
    >
      <Camera aria-hidden />
      {showCaption && <span>{label}</span>}
    </BaseButton>
  );
});
