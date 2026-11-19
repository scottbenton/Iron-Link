import { Checkbox as BaseCheckbox } from "@base-ui/react/checkbox";
import type { Datasworn } from "@datasworn-community/core";
import { CaretDown, UsersThree, Warning } from "@phosphor-icons/react";
import { ComponentPropsWithoutRef, ElementType, ReactNode, useId } from "react";

import {
  checkboxFillStyles,
  checkboxMarkStyles,
  choiceBoxStyles,
} from "ui/components/Checkbox";
import { IconButton } from "ui/components/IconButton";
import { Text } from "ui/components/Text";
import { Tooltip } from "ui/components/Tooltip";
import { LayoutProps, withLayoutProps } from "ui/styles/layoutProps";

import { css, cx } from "styled-system/css";

import { contentCardStyles } from "../MoveCard/cardStyles";
import { RulesText } from "../RulesText/RulesText";
import { RulesTextOptions } from "../RulesText/RulesTextContext";
import { AssetControlField, AssetOptionField } from "./AssetFields";
import {
  AssetCardState,
  AssetControl,
  AssetControlValue,
  getAssetFields,
  getDisablingMarks,
  isAbilityEnabled,
  sortByLabel,
} from "./assetData";

export const assetCardStyles = css({
  overflow: "hidden",
  "& [data-asset-head]": {
    display: "flex",
    alignItems: "center",
    gap: "2",
    minHeight: "control.md",
    paddingInlineStart: "4",
    paddingInlineEnd: "2",
    paddingBlock: "1",
    background: "bg.muted",
    borderBottomWidth: "1px",
    borderBottomStyle: "solid",
    borderBottomColor: "border.subtle",
  },
  "& [data-asset-category]": { flex: "1", minWidth: 0 },
  "& [data-asset-head-actions]": {
    display: "flex",
    alignItems: "center",
    gap: "0.5",
    flex: "none",
  },
  "& [data-asset-body]": {
    display: "grid",
    gap: "3",
    paddingInline: "4",
    paddingBlock: "3",
    flex: "1",
    alignContent: "start",
  },
  "& [data-asset-title]": {
    display: "flex",
    alignItems: "center",
    gap: "2",
    minWidth: 0,
  },
  "& [data-asset-title] > svg": { flex: "none", color: "accent.fg" },
  "& [data-asset-foot]": {
    display: "flex",
    justifyContent: "flex-end",
    flexWrap: "wrap",
    gap: "2",
    paddingInline: "3",
    paddingBlock: "2",
    background: "bg.muted",
    borderTopWidth: "1px",
    borderTopStyle: "solid",
    borderTopColor: "border.subtle",
  },
  // A marked Broken or Out of Action: the abilities fade, the meter stays.
  "&[data-out-of-use] [data-asset-abilities]": { opacity: 0.55 },
});

const marksStyles = css({
  display: "flex",
  alignItems: "center",
  gap: "1.5",
  paddingBlock: "1.5",
  paddingInline: "3",
  borderRadius: "md",
  background: "warning.soft",
  color: "warning.fg",
  fontSize: "sm",
  fontWeight: "semibold",
  "& svg": { flex: "none" },
});

const abilitiesStyles = css({
  display: "grid",
  gap: "3",
  margin: 0,
  padding: 0,
  listStyle: "none",
  transition: "opacity token(durations.normal) linear",
  "& > li": {
    display: "grid",
    gridTemplateColumns: "auto minmax(0, 1fr)",
    alignItems: "start",
    // Room between the box and its text, so the text reads as the label.
    gap: "3",
  },
  // Line the box up with the first line of text. Only the box ticks, not
  // the text (a tap while reading would spend experience), so its hit area
  // reaches past it: 32px, and 44px for fingers.
  "& > li > [data-ability-box]": {
    marginTop: "1px",
    _before: {
      content: '""',
      position: "absolute",
      inset: "-6px",
      _touch: { inset: "-12px" },
    },
  },
  // Collapsed with nothing checked: kept for the toggle's aria-controls.
  "&:empty": { display: "none" },
});

const fieldsStyles = css({
  display: "grid",
  gap: "3",
  "&:empty": { display: "none" },
});

/** The asset's own fields (a name, a stat), set apart from what follows. */
const optionsStyles = css({ paddingBlockEnd: "2" });

export interface AssetCardStrings {
  shared: string;
  outOfUse: (marks: string[]) => string;
  expand: string;
  collapse: string;
  rollLabel: string;
}

export const defaultAssetCardStrings: AssetCardStrings = {
  shared: "Shared asset",
  outOfUse: (marks) => `${marks.join(", ")}: this asset is out of use`,
  expand: "Show all abilities",
  collapse: "Hide unchecked abilities",
  rollLabel: "Roll",
};

export interface AssetCardProps
  extends LayoutProps,
    RulesTextOptions,
    Omit<ComponentPropsWithoutRef<"article">, "children"> {
  asset: Datasworn.Asset;
  /** The character's ticks and values on it. */
  state?: AssetCardState;
  /** Ticks an ability. Without it, abilities are read-only. */
  onAbilityToggle?: (index: number, enabled: boolean) => void;
  /** Changes a field (name, chosen stat). Without it, fields are read-only. */
  onOptionChange?: (key: string, value: string) => void;
  /** Changes a control (meter, toggle, clock). Without it, read-only. */
  onControlChange?: (key: string, value: AssetControlValue) => void;
  /** Rolls a rollable meter such as Integrity or a companion's Health. */
  onRollControl?: (key: string, control: AssetControl, value: number) => void;
  /** Shows everything as it is, with no way to change it. */
  readOnly?: boolean;
  /** Marks shared assets (a command vehicle) with an icon. */
  showSharedIcon?: boolean;
  /**
   * Hides the abilities that are not checked, as the character sheet does.
   * Everything else stays: the requirement, fields, checked abilities,
   * meters and other controls. With `onCollapsedChange` the header carries
   * a toggle.
   */
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  /** Icon buttons in the header, such as Customize and Remove. */
  headerActions?: ReactNode;
  /** Buttons at the foot, such as Select Asset in a picker. */
  actions?: ReactNode;
  /** The element for the asset's name, so headings nest. An h3 by default. */
  headingAs?: ElementType;
  strings?: Partial<AssetCardStrings>;
  className?: string;
}

/**
 * A full asset card: category, name, requirement, its fields as inputs,
 * the three abilities with a checkbox each, and meters such as Integrity or
 * a companion's Health. A marked Broken or Out of Action shows the asset out
 * of use. Read-only without handlers or with `readOnly`.
 */
export function AssetCard(props: AssetCardProps) {
  const {
    asset,
    state,
    onAbilityToggle,
    onOptionChange,
    onControlChange,
    onRollControl,
    readOnly,
    showSharedIcon,
    collapsed,
    onCollapsedChange,
    headerActions,
    actions,
    headingAs = "h3",
    strings: stringsProp,
    className,
    style,
    onLinkClick,
    canOpenLink,
    resolveOracle,
    renderMacro,
    ...rest
  } = withLayoutProps(props);

  const strings = { ...defaultAssetCardStrings, ...stringsProp };
  const rulesOptions: RulesTextOptions = {
    onLinkClick,
    canOpenLink,
    resolveOracle,
    renderMacro,
  };
  const idPrefix = useId();

  const toggleAbility = readOnly ? undefined : onAbilityToggle;
  const changeOption = readOnly ? undefined : onOptionChange;
  const changeControl = readOnly ? undefined : onControlChange;
  const rollControl = readOnly ? undefined : onRollControl;

  const { controls, options } = getAssetFields(asset, state);
  const marks = getDisablingMarks(controls, state);

  const abilities = asset.abilities
    .map((ability, index) => ({
      ability,
      index,
      enabled: isAbilityEnabled(asset, state, index),
    }))
    .filter(({ enabled }) => enabled || !collapsed);

  const sortedControls = sortByLabel(controls);
  const meters = sortedControls.filter(
    ([, control]) => control.field_type === "condition_meter",
  );
  const otherControls = sortedControls.filter(
    ([, control]) => control.field_type !== "condition_meter",
  );

  return (
    <article
      className={cx(contentCardStyles, assetCardStyles, className)}
      data-out-of-use={marks.length > 0 || undefined}
      style={style}
      {...rest}
    >
      <div data-asset-head="">
        <Text variant="label" color="muted" data-asset-category="" truncate>
          {asset.category}
        </Text>
        {(headerActions || onCollapsedChange) && (
          <div data-asset-head-actions="">
            {headerActions}
            {onCollapsedChange && (
              <IconButton
                label={collapsed ? strings.expand : strings.collapse}
                size="sm"
                aria-expanded={!collapsed}
                aria-controls={`${idPrefix}-abilities`}
                onClick={() => onCollapsedChange(!collapsed)}
              >
                <CaretDown
                  style={{
                    rotate: collapsed ? "0deg" : "180deg",
                    transition:
                      "rotate var(--durations-normal) var(--easings-out)",
                  }}
                />
              </IconButton>
            )}
          </div>
        )}
      </div>

      <div data-asset-body="">
        <div data-asset-title="">
          <Text as={headingAs} variant="h3">
            {asset.name}
          </Text>
          {showSharedIcon && asset.shared && (
            <Tooltip title={strings.shared}>
              <UsersThree
                size={18}
                weight="bold"
                role="img"
                aria-label={strings.shared}
              />
            </Tooltip>
          )}
        </div>

        {marks.length > 0 && (
          <div className={marksStyles}>
            <Warning weight="bold" aria-hidden />
            {strings.outOfUse(marks)}
          </div>
        )}

        {asset.requirement && (
          <RulesText
            markdown={asset.requirement}
            size="sm"
            color="muted"
            {...rulesOptions}
          />
        )}

        <div className={cx(fieldsStyles, optionsStyles)}>
          {sortByLabel(options).map(([key, option]) => (
            <AssetOptionField
              key={key}
              optionKey={key}
              option={option}
              value={state?.optionValues?.[key]}
              onChange={changeOption}
            />
          ))}
        </div>

        {(abilities.length > 0 || onCollapsedChange) && (
          <ul
            className={abilitiesStyles}
            id={`${idPrefix}-abilities`}
            data-asset-abilities=""
          >
            {abilities.map(({ ability, index, enabled }) => {
              const textId = `${idPrefix}-ability-${index}`;
              const locked = ability.enabled || !toggleAbility;
              const markdown = ability.name
                ? `__${ability.name}:__ ${ability.text}`
                : ability.text;
              return (
                <li key={ability._id ?? index}>
                  <BaseCheckbox.Root
                    data-ability-box=""
                    className={choiceBoxStyles({ shape: "checkbox" })}
                    checked={enabled}
                    readOnly={locked}
                    onCheckedChange={(checked) =>
                      toggleAbility?.(index, checked)
                    }
                    aria-labelledby={textId}
                  >
                    <span className={checkboxFillStyles} aria-hidden />
                    <svg
                      className={checkboxMarkStyles}
                      viewBox="0 0 24 24"
                      aria-hidden
                    >
                      <path data-mark="tick" d="M20 6 9 17l-5-5" />
                    </svg>
                  </BaseCheckbox.Root>
                  <RulesText
                    id={textId}
                    markdown={markdown}
                    size="sm"
                    color={enabled ? "default" : "muted"}
                    {...rulesOptions}
                  />
                </li>
              );
            })}
          </ul>
        )}

        {meters.map(([key, control]) => (
          <AssetControlField
            key={key}
            controlKey={key}
            control={control}
            state={state}
            onChange={changeControl}
            onRoll={rollControl}
            rollLabel={strings.rollLabel}
          />
        ))}

        {otherControls.length > 0 && (
          <div className={fieldsStyles}>
            {otherControls.map(([key, control]) => (
              <AssetControlField
                key={key}
                controlKey={key}
                control={control}
                state={state}
                onChange={changeControl}
              />
            ))}
          </div>
        )}
      </div>

      {actions && <div data-asset-foot="">{actions}</div>}
    </article>
  );
}
