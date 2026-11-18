import { Button as BaseButton } from "@base-ui/react/button";
import type { Datasworn } from "@datasworn-community/core";
import { CheckCircle } from "@phosphor-icons/react";
import {
  CSSProperties,
  ComponentPropsWithoutRef,
  ElementType,
  ReactElement,
} from "react";

import { Text } from "ui/components/Text";
import { VisuallyHidden } from "ui/components/VisuallyHidden";

import { css, cx } from "styled-system/css";

import { contentCardStyles } from "../MoveCard/cardStyles";
import { RulesText } from "../RulesText/RulesText";

const pickerStyles = css({
  position: "relative",
  display: "grid",
  gap: "2.5",
  alignContent: "start",
  paddingBlock: "3",
  paddingInline: "4",
  boxShadow: "0 var(--border-widths-ledge) 0 token(colors.border.edge)",
  transform: "translateY(0)",
  transitionProperty: "transform, box-shadow, border-color, background-color",
  transitionDuration: "fast",
  transitionTimingFunction: "out",
  "&:has([data-pick]:hover)": {
    borderColor: "border.control",
    background: "bg.muted",
    transform: "translateY(var(--spacing-lift))",
    boxShadow:
      "0 calc(var(--border-widths-ledge) - var(--spacing-lift)) 0 token(colors.border.edge)",
  },
  "&:has([data-pick]:is(:active, [data-pressed]))": {
    transform: "translateY(var(--spacing-sink))",
    boxShadow:
      "0 max(0px, calc(var(--border-widths-ledge) - var(--spacing-sink))) 0 token(colors.border.edge)",
    transitionDuration: "instant",
  },
  "&:has([data-pick]:focus-visible)": {
    outline: "2px solid token(colors.focusRing)",
    outlineOffset: "2px",
  },
  "&[data-selected]": {
    borderColor: "accent.solid",
    boxShadow:
      "inset 0 0 0 1px token(colors.accent.solid), 0 var(--border-widths-ledge) 0 token(colors.border.edge)",
  },
  "&[data-disabled]": { opacity: 0.6 },
  "&[data-disabled]:has([data-pick])": {
    transform: "none",
    background: "bg.surface",
  },
  "& [data-picker-head]": {
    display: "flex",
    alignItems: "center",
    gap: "2",
    minWidth: 0,
  },
  "& [data-picker-head] > [data-swatch]": {
    flex: "none",
    width: "8px",
    height: "8px",
    rotate: "45deg",
    borderRadius: "1px",
    background: "var(--asset-color, token(colors.fg.subtle))",
  },
  "& [data-picker-head] > [data-check]": {
    flex: "none",
    marginInlineStart: "auto",
    color: "accent.fg",
  },
});

/** The name is the button, stretched over the whole card. */
const pickStyles = css({
  color: "inherit",
  textDecoration: "none",
  font: "inherit",
  padding: 0,
  margin: 0,
  border: 0,
  background: "transparent",
  textAlign: "left",
  cursor: "pointer",
  outline: "none",
  WebkitTapHighlightColor: "transparent",
  _after: {
    content: '""',
    position: "absolute",
    inset: 0,
    borderRadius: "lg",
  },
  "&:is([data-disabled])": { cursor: "not-allowed" },
});

const abilityListStyles = css({
  display: "grid",
  gap: "1.5",
  margin: 0,
  padding: 0,
  listStyle: "none",
  "& > li": {
    display: "grid",
    gridTemplateColumns: "auto minmax(0, 1fr)",
    gap: "2",
    alignItems: "start",
  },
  // An open or filled pip, as the abilities sit on a fresh asset.
  "& > li > [data-pip]": {
    width: "8px",
    height: "8px",
    marginTop: "0.45em",
    borderRadius: "full",
    borderWidth: "1.5px",
    borderStyle: "solid",
    borderColor: "fg.muted",
  },
  "& > li > [data-pip][data-on]": {
    background: "fg.default",
    borderColor: "fg.default",
  },
});

export interface AssetPickerCardProps
  extends Omit<ComponentPropsWithoutRef<"article">, "children" | "onSelect"> {
  asset: Datasworn.Asset;
  onSelect?: (asset: Datasworn.Asset) => void;
  /** Renders the pick as a link instead: `render={<Link to={href} />}`. */
  render?: ReactElement;
  /** Shows it as chosen, for picking several. */
  selected?: boolean;
  /** Read out after the name while selected. */
  selectedLabel?: string;
  disabled?: boolean;
  /** Show the three abilities' text. On by default. */
  showAbilities?: boolean;
  /** The element around the name, so headings nest. An h3 by default. */
  headingAs?: ElementType;
  className?: string;
}

/**
 * An asset to choose from a list. The whole card presses as one button,
 * named by the asset; its rules text reads as plain text inside it.
 */
export function AssetPickerCard(props: AssetPickerCardProps) {
  const {
    asset,
    onSelect,
    render,
    selected,
    selectedLabel = "Selected",
    disabled,
    showAbilities = true,
    headingAs = "h3",
    className,
    style,
    ...rest
  } = props;

  return (
    <article
      className={cx(contentCardStyles, pickerStyles, className)}
      data-selected={selected || undefined}
      data-disabled={disabled || undefined}
      style={{ "--asset-color": asset.color, ...style } as CSSProperties}
      {...rest}
    >
      <div data-picker-head="">
        <span data-swatch="" aria-hidden />
        <Text variant="label" color="muted" truncate>
          {asset.category}
        </Text>
        {selected && <CheckCircle data-check="" weight="fill" aria-hidden />}
      </div>
      <Text as={headingAs} variant="h3">
        <BaseButton
          data-pick=""
          className={pickStyles}
          render={render}
          nativeButton={!render}
          disabled={disabled}
          aria-pressed={render || selected === undefined ? undefined : selected}
          onClick={() => onSelect?.(asset)}
        >
          {asset.name}
          {selected && render && (
            <VisuallyHidden>, {selectedLabel}</VisuallyHidden>
          )}
        </BaseButton>
      </Text>
      <div className={css({ display: "grid", gap: "2.5" })}>
        {asset.requirement && (
          <RulesText markdown={asset.requirement} size="sm" color="muted" />
        )}
        {showAbilities && (
          <ul className={abilityListStyles}>
            {asset.abilities.map((ability, index) => (
              <li key={ability._id ?? index}>
                <span
                  data-pip=""
                  data-on={ability.enabled || undefined}
                  aria-hidden
                />
                <RulesText
                  markdown={
                    ability.name
                      ? `__${ability.name}:__ ${ability.text}`
                      : ability.text
                  }
                  size="sm"
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </article>
  );
}
