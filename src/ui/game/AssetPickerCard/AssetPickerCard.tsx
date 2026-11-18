import type { Datasworn } from "@datasworn-community/core";
import { Check, CheckCircle } from "@phosphor-icons/react";
import {
  CSSProperties,
  ComponentPropsWithoutRef,
  ElementType,
  ReactElement,
  ReactNode,
} from "react";

import { Card, CardButtonOverlay } from "ui/components/Card";
import { Text } from "ui/components/Text";

import { css, cx } from "styled-system/css";

import { RulesText } from "../RulesText/RulesText";

const pickerStyles = css({
  "& [data-picker-head]": {
    display: "flex",
    alignItems: "center",
    gap: "2",
    minWidth: 0,
    minHeight: "24px",
  },
  "& [data-picker-head] > [data-swatch]": {
    flex: "none",
    width: "8px",
    height: "8px",
    rotate: "45deg",
    borderRadius: "1px",
    background: "var(--asset-color, token(colors.fg.subtle))",
  },
  "& [data-picker-head] > [data-category]": { flex: "1", minWidth: 0 },
  "& [data-picker-head] > [data-check]": { flex: "none", color: "accent.fg" },
  "& [data-picker-head-actions]": {
    display: "flex",
    alignItems: "center",
    gap: "0.5",
    flex: "none",
    marginBlock: "-1",
  },
  "& [data-picker-foot]": {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: "2",
  },
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
  /** Called by the Select button, or a click anywhere on the card. */
  onSelect?: (asset: Datasworn.Asset) => void;
  /** Renders Select as a link instead: `render={<Link to={href} />}`. */
  render?: ReactElement;
  /**
   * Shows it as chosen, for picking several; Select then toggles. Leave it
   * undefined when one press picks the asset and moves on.
   */
  selected?: boolean;
  disabled?: boolean;
  /** Show the three abilities' text. On by default. */
  showAbilities?: boolean;
  /**
   * Icon buttons in the head, such as a toggle for the abilities. They stay
   * their own controls above the card's hit area.
   */
  headerActions?: ReactNode;
  /** The element around the name, so headings nest. An h3 by default. */
  headingAs?: ElementType;
  /** The button's visible label. */
  selectLabel?: string;
  /** The button's accessible name; it must contain the visible label. */
  selectName?: (assetName: string) => string;
  /** Added to the name of a selected link, which has no pressed state. */
  selectedLabel?: string;
  className?: string;
}

/**
 * An asset to choose from a list. A Select button says how to choose it,
 * and its hit area covers the whole card, so a click anywhere selects it.
 * Rules text reads as plain text; links in it and `headerActions` stay
 * their own controls. Selected shows at once, hovered or not.
 */
export function AssetPickerCard(props: AssetPickerCardProps) {
  const {
    asset,
    onSelect,
    render,
    selected,
    disabled,
    showAbilities = true,
    headerActions,
    headingAs = "h3",
    selectLabel = "Select",
    selectName = (name) => `Select ${name}`,
    selectedLabel = "Selected",
    className,
    style,
    ...rest
  } = props;

  const name = selectName(asset.name);

  return (
    <Card
      render={<article />}
      selected={selected}
      className={cx(pickerStyles, className)}
      style={{ "--asset-color": asset.color, ...style } as CSSProperties}
      {...rest}
    >
      <div data-picker-head="">
        <span data-swatch="" aria-hidden />
        <Text variant="label" color="muted" data-category="" truncate>
          {asset.category}
        </Text>
        {selected && (
          <CheckCircle data-check="" size={18} weight="fill" aria-hidden />
        )}
        {headerActions && (
          <div data-picker-head-actions="">{headerActions}</div>
        )}
      </div>
      <Text as={headingAs} variant="h3">
        {asset.name}
      </Text>
      {(asset.requirement || showAbilities) && (
        <div className={css({ display: "grid", gap: "3" })}>
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
      )}
      <div data-picker-foot="">
        <CardButtonOverlay
          variant={selected ? "primary" : "outline"}
          startIcon={selected ? <Check weight="bold" /> : undefined}
          render={render}
          disabled={disabled}
          pressed={render ? undefined : selected}
          aria-label={selected && render ? `${name}, ${selectedLabel}` : name}
          onClick={() => onSelect?.(asset)}
        >
          {selectLabel}
        </CardButtonOverlay>
      </div>
    </Card>
  );
}
