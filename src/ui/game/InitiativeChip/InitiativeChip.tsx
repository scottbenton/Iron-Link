import { Menu } from "@base-ui/react/menu";
import { CaretDown, Check } from "@phosphor-icons/react";

import { CssProp, withCssProp } from "ui/styles/cssProp";
import { focusRing } from "ui/styles/focus";
import { ledgeHeight, ledgeLayers } from "ui/styles/ledge";
import { quietPressable } from "ui/styles/pressable";

import { css, cx } from "styled-system/css";

import {
  InitiativeOption,
  InitiativeStatus,
  InitiativeWording,
  getInitiativeOptions,
} from "./initiativeLabels";

/** The chip's shape and type, shared by the plain chip and the menu trigger. */
const chipStyles = css({
  display: "inline-flex",
  // A chip is as wide as its label, even as a flex or grid child that would
  // otherwise stretch it across a column.
  width: "fit-content",
  alignItems: "center",
  gap: "1.5",
  minHeight: "control.xs",
  paddingInlineStart: "2",
  paddingInlineEnd: "3",
  borderWidth: "1px",
  borderStyle: "solid",
  borderRadius: "full",
  color: "accent.fg",
  fontFamily: "body",
  fontSize: "sm",
  fontWeight: "semibold",
  lineHeight: "1.2",
  whiteSpace: "nowrap",
  "& svg": { width: "icon.sm", height: "icon.sm", flex: "none" },
  // Out of a fight: quiet, so a status in a fight is the one that stands out.
  "&[data-resting]": { color: "fg.muted" },
});

/** A chip that only shows the status is flat: nothing to press. */
const staticStyles = css({
  borderColor: "color-mix(in oklab, token(colors.accent.fg) 35%, transparent)",
  background: "accent.soft",
  "&[data-resting]": {
    borderColor: "border.default",
    background: "bg.muted",
  },
});

/**
 * A chip that opens the menu stands on a ledge like a Button: the face and
 * the ledge are layers (`ledgeLayers`, clipped for a pill), hover tints the
 * face, and a press sinks it onto the ledge. The face's colour is
 * `--initiative-face` under an overlay tint, `--initiative-tint`, so hover and press
 * work the same on the accent and the resting colours. The border and
 * ledge are opaque mixes, since the ledge shows below the face.
 */
const triggerStyles = css({
  "--initiative-face": "{colors.accent.soft}",
  "--initiative-tint": "transparent",
  position: "relative",
  ...ledgeLayers("token(radii.full)"),
  "--ledge-face":
    "linear-gradient(var(--initiative-tint), var(--initiative-tint)), var(--initiative-face)",
  "--ledge-border":
    "color-mix(in oklab, {colors.accent.fg} 35%, {colors.bg.surface})",
  "--ledge-edge":
    "color-mix(in oklab, {colors.accent.fg} 50%, {colors.bg.surface})",
  "&[data-resting]": {
    "--initiative-face": "{colors.bg.muted}",
    "--ledge-border": "{colors.border.default}",
    "--ledge-edge": "{colors.border.control}",
  },
  cursor: "pointer",
  userSelect: "none",
  outline: "none",
  WebkitTapHighlightColor: "transparent",
  transform: "translateY(0)",
  transitionProperty: "transform",
  transitionDuration: "fast",
  transitionTimingFunction: "out",
  _hover: {
    "--initiative-tint": "{colors.overlay.hover}",
    "--ledge-height": ledgeHeight.lifted,
    transform: "translateY(var(--spacing-lift))",
  },
  _pressed: {
    "--initiative-tint": "{colors.overlay.pressed}",
    "--ledge-height": ledgeHeight.sunk,
    transform: "translateY(var(--spacing-sink))",
    transitionDuration: "instant",
  },
  // While its menu is open the chip keeps the pressed tint, without
  // sinking, so it shows what the menu belongs to.
  "&[data-popup-open]": { "--initiative-tint": "{colors.overlay.pressed}" },
  _focusVisible: focusRing.outset,
  _reducedMotion: { transitionDuration: "0s" },
  _touch: { minHeight: "control.md" },
});

const popupStyles = css({
  minWidth: "180px",
  padding: "1",
  border: "1px solid token(colors.border.control)",
  borderRadius: "md",
  background: "bg.surface",
  color: "fg.default",
  boxShadow: "popover",
  outline: "none",
  transformOrigin: "var(--transform-origin)",
  transitionProperty: "opacity, scale",
  transitionDuration: "fast",
  transitionTimingFunction: "out",
  zIndex: "popover",
  _startingStyle: { opacity: 0, scale: "0.96" },
  _endingStyle: { opacity: 0, scale: "0.96", transitionDuration: "instant" },
});

const itemStyles = css({
  ...quietPressable,
  display: "flex",
  alignItems: "center",
  gap: "2",
  minHeight: "control.row",
  paddingInline: "2",
  borderRadius: "sm",
  fontSize: "sm",
  userSelect: "none",
  "& svg": { width: "icon.md", height: "icon.md", flex: "none" },
  _touch: { minHeight: "touch" },
});

const indicatorStyles = css({
  marginInlineStart: "auto",
  display: "inline-flex",
  color: "accent.fg",
});

export interface InitiativeChipProps<T extends string = InitiativeStatus>
  extends CssProp {
  /** The current status, one of the options' values. */
  status: T;
  /** Lets the chip open a menu to change the status. */
  onStatusChange?: (status: T) => void;
  /**
   * The statuses to show and offer, in menu order. Defaults to Iron Link's
   * three in the chosen game's words; pass rules data here instead.
   */
  options?: InitiativeOption<T>[];
  /** Which game's words the default options use. Starforged by default. */
  wording?: InitiativeWording;
  /** Overrides the default options' words. */
  labels?: Partial<Record<InitiativeStatus, string>>;
  /** The trigger's name before the status, "Initiative" ("Initiative: In Control"). */
  changeLabel?: string;
  className?: string;
}

/**
 * A character's position in a fight, such as In Control or In a Bad Spot.
 * Statuses in a fight share one look and differ by their words; the resting
 * one (Out of Combat) is muted. With `onStatusChange` the chip is a menu
 * button and stands on a ledge like a Button; without it, it is flat.
 */
export function InitiativeChip<T extends string = InitiativeStatus>(
  props: InitiativeChipProps<T>,
) {
  const {
    status,
    onStatusChange,
    options: optionsProp,
    wording = "starforged",
    labels,
    changeLabel = "Initiative",
    className,
  } = withCssProp(props);
  const options =
    optionsProp ??
    (getInitiativeOptions(wording, labels) as unknown as InitiativeOption<T>[]);
  const current = options.find((option) => option.value === status);
  const label = current?.label ?? status;
  const resting = current?.resting ? "" : undefined;

  const content = label;

  if (!onStatusChange) {
    return (
      <span
        className={cx(chipStyles, staticStyles, className)}
        data-status={status}
        data-resting={resting}
      >
        {content}
      </span>
    );
  }

  return (
    <Menu.Root>
      <Menu.Trigger
        className={cx(chipStyles, triggerStyles, className)}
        data-status={status}
        data-resting={resting}
        aria-label={`${changeLabel}: ${label}`}
      >
        {content}
        <CaretDown weight="bold" aria-hidden />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner sideOffset={6} align="start">
          <Menu.Popup className={popupStyles}>
            <Menu.RadioGroup
              value={status}
              onValueChange={(value: T) => onStatusChange(value)}
            >
              {options.map((option) => (
                <Menu.RadioItem
                  key={option.value}
                  value={option.value}
                  className={itemStyles}
                  closeOnClick
                >
                  {option.label}
                  <Menu.RadioItemIndicator className={indicatorStyles}>
                    <Check weight="bold" />
                  </Menu.RadioItemIndicator>
                </Menu.RadioItem>
              ))}
            </Menu.RadioGroup>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}
