import { Tabs as BaseTabs } from "@base-ui/react/tabs";
import { ComponentProps, ReactNode, forwardRef, useContext } from "react";

import { focusRing } from "ui/styles/focus";

import { cva, cx } from "styled-system/css";

import { VariantContext } from "./variantContext";

const tabStyles = cva({
  base: {
    position: "relative",
    zIndex: 1,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "1.5",
    boxSizing: "border-box",
    margin: 0,
    border: 0,
    background: "transparent",
    cursor: "pointer",
    color: "fg.muted",
    fontFamily: "body",
    fontWeight: "semibold",
    fontSize: "sm",
    lineHeight: "1.2",
    whiteSpace: "nowrap",
    userSelect: "none",
    WebkitTapHighlightColor: "transparent",
    transition:
      "color token(durations.fast) linear, background-color token(durations.fast) linear",
    outline: "none",
    _hover: { color: "fg.default" },
    "&[aria-selected=true]": { color: "fg.default" },
    _focusVisible: focusRing.outset,
    _disabled: { cursor: "not-allowed", color: "fg.disabled" },
    "& svg": { flex: "none", width: "icon.md", height: "icon.md" },
  },
  variants: {
    variant: {
      underline: {
        flex: "none",
        minHeight: "control.md",
        paddingInline: "0.5",
        borderRadius: "xs",
        _focusVisible: { outlineOffset: "-2px" },
        _touch: { minHeight: "touch" },
      },
      // NoteTabs' chip: 34px with its transparent border, 44px on touch.
      well: {
        flex: "none",
        minHeight: "34px",
        paddingInline: "3",
        borderRadius: "md",
        "&:hover:not([aria-selected=true])": { background: "overlay.hover" },
        _focusVisible: { outlineOffset: "-2px" },
        _touch: { minHeight: "touch", paddingInline: "14px" },
      },
    },
    size: {
      md: {},
      lg: {},
    },
  },
  compoundVariants: [
    // Large: 48px at any pointer, as the phone screens' tabs are.
    {
      size: "lg",
      css: {
        minHeight: "touch",
        paddingInline: "4",
        _touch: { minHeight: "touch" },
      },
    },
    {
      size: "lg",
      variant: "underline",
      css: { paddingInline: "2" },
    },
  ],
  defaultVariants: { variant: "well", size: "md" },
});

export interface SectionTabProps
  extends Omit<ComponentProps<typeof BaseTabs.Tab>, "className"> {
  /** An icon before the label. */
  icon?: ReactNode;
  className?: string;
}

/** One tab in a `SectionTabList`. */
export const SectionTab = forwardRef<HTMLButtonElement, SectionTabProps>(
  function SectionTab(props, ref) {
    const { icon, className, children, ...rest } = props;
    const { variant, size } = useContext(VariantContext);
    return (
      <BaseTabs.Tab
        ref={ref}
        className={cx(tabStyles({ variant, size }), className)}
        {...rest}
      >
        {icon}
        {children}
      </BaseTabs.Tab>
    );
  },
);
