import { Menu } from "@base-ui/react/menu";
import { CaretDown, Check } from "@phosphor-icons/react";

import { css, cx } from "styled-system/css";

import {
  InitiativeOption,
  InitiativeStatus,
  InitiativeWording,
  getInitiativeOptions,
} from "./initiativeLabels";

const chipStyles = css({
  display: "inline-flex",
  alignItems: "center",
  gap: "1.5",
  minHeight: "28px",
  paddingInlineStart: "2",
  paddingInlineEnd: "3",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "color-mix(in oklab, token(colors.accent.fg) 35%, transparent)",
  borderRadius: "full",
  background: "accent.soft",
  color: "accent.fg",
  fontFamily: "body",
  fontSize: "sm",
  fontWeight: "semibold",
  lineHeight: "1.2",
  whiteSpace: "nowrap",
  "& svg": { width: "14px", height: "14px", flex: "none" },
  // Out of a fight: quiet, so a status in a fight is the one that stands out.
  "&[data-resting]": {
    borderColor: "border.default",
    background: "bg.muted",
    color: "fg.muted",
  },
});

/**
 * A dot before the label, filled in a fight and hollow at rest. It marks the
 * chip as a status without saying whether the status is good or bad.
 */
const dotStyles = css({
  flex: "none",
  width: "8px",
  height: "8px",
  borderRadius: "full",
  background: "currentColor",
  "[data-resting] > &": {
    background: "transparent",
    boxShadow: "inset 0 0 0 1.5px currentColor",
  },
});

const triggerStyles = css({
  cursor: "pointer",
  outline: "none",
  WebkitTapHighlightColor: "transparent",
  transitionProperty: "background-color, transform",
  transitionDuration: "fast",
  transitionTimingFunction: "out",
  _hover: {
    backgroundImage:
      "linear-gradient(token(colors.overlay.hover), token(colors.overlay.hover))",
  },
  _pressed: { transform: "translateY(min(var(--spacing-sink), 1px))" },
  _focusVisible: {
    outline: "2px solid token(colors.focusRing)",
    outlineOffset: "2px",
  },
  _touch: { minHeight: "40px" },
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
  display: "flex",
  alignItems: "center",
  gap: "2",
  minHeight: "36px",
  paddingInline: "2",
  borderRadius: "sm",
  fontSize: "sm",
  cursor: "pointer",
  userSelect: "none",
  outline: "none",
  "& svg": { width: "16px", height: "16px", flex: "none" },
  "&[data-highlighted]": { background: "overlay.hover" },
  _pressed: { background: "overlay.pressed" },
  _touch: { minHeight: "touch" },
});

const indicatorStyles = css({
  marginInlineStart: "auto",
  display: "inline-flex",
  color: "accent.fg",
});

export interface InitiativeChipProps<T extends string = InitiativeStatus> {
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
 * one (Out of Combat) is muted.
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
  } = props;
  const options =
    optionsProp ??
    (getInitiativeOptions(wording, labels) as unknown as InitiativeOption<T>[]);
  const current = options.find((option) => option.value === status);
  const label = current?.label ?? status;
  const resting = current?.resting ? "" : undefined;

  const content = (
    <>
      <span className={dotStyles} aria-hidden />
      {label}
    </>
  );

  if (!onStatusChange) {
    return (
      <span
        className={cx(chipStyles, className)}
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
