import { Menu } from "@base-ui/react/menu";
import {
  Campfire,
  CaretDown,
  Check,
  Lightning,
  WarningCircle,
} from "@phosphor-icons/react";
import { ReactNode } from "react";

import { css, cx } from "styled-system/css";

import {
  InitiativeStatus,
  InitiativeWording,
  initiativeLabels,
} from "./initiativeLabels";

const icons: Record<InitiativeStatus, ReactNode> = {
  hasInitiative: <Lightning weight="fill" aria-hidden />,
  noInitiative: <WarningCircle weight="fill" aria-hidden />,
  outOfCombat: <Campfire weight="fill" aria-hidden />,
};

const order: InitiativeStatus[] = [
  "hasInitiative",
  "noInitiative",
  "outOfCombat",
];

const chipStyles = css({
  "--chip-fg": "{colors.fg.muted}",
  "--chip-bg": "{colors.bg.muted}",
  "--chip-border": "{colors.border.default}",
  display: "inline-flex",
  alignItems: "center",
  gap: "1.5",
  minHeight: "28px",
  paddingInlineStart: "2",
  paddingInlineEnd: "2.5",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "var(--chip-border)",
  borderRadius: "full",
  background: "var(--chip-bg)",
  color: "var(--chip-fg)",
  fontFamily: "body",
  fontSize: "sm",
  fontWeight: "semibold",
  lineHeight: "1.2",
  whiteSpace: "nowrap",
  "& svg": { width: "15px", height: "15px", flex: "none" },
  "&[data-status=hasInitiative]": {
    "--chip-fg": "{colors.success.fg}",
    "--chip-bg": "{colors.success.soft}",
    "--chip-border":
      "color-mix(in oklab, {colors.success.fg} 40%, transparent)",
  },
  "&[data-status=noInitiative]": {
    "--chip-fg": "{colors.danger.fg}",
    "--chip-bg": "{colors.danger.soft}",
    "--chip-border": "color-mix(in oklab, {colors.danger.fg} 40%, transparent)",
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

export interface InitiativeChipProps {
  status: InitiativeStatus;
  /** Lets the chip open a menu to change the status. */
  onStatusChange?: (status: InitiativeStatus) => void;
  /** Which game's words to use. Starforged by default. */
  wording?: InitiativeWording;
  /** Overrides the words for each status. */
  labels?: Partial<Record<InitiativeStatus, string>>;
  /** The trigger's name before the status, "Initiative" ("Initiative: In Control"). */
  changeLabel?: string;
  className?: string;
}

/** A character's position in a fight: in control, in a bad spot, or neither. */
export function InitiativeChip(props: InitiativeChipProps) {
  const {
    status,
    onStatusChange,
    wording = "starforged",
    labels: labelsProp,
    changeLabel = "Initiative",
    className,
  } = props;
  const labels = { ...initiativeLabels[wording], ...labelsProp };

  const content = (
    <>
      {icons[status]}
      {labels[status]}
    </>
  );

  if (!onStatusChange) {
    return (
      <span className={cx(chipStyles, className)} data-status={status}>
        {content}
      </span>
    );
  }

  return (
    <Menu.Root>
      <Menu.Trigger
        className={cx(chipStyles, triggerStyles, className)}
        data-status={status}
        aria-label={`${changeLabel}: ${labels[status]}`}
      >
        {content}
        <CaretDown weight="bold" aria-hidden />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner sideOffset={6} align="start">
          <Menu.Popup className={popupStyles}>
            <Menu.RadioGroup
              value={status}
              onValueChange={(value: InitiativeStatus) => onStatusChange(value)}
            >
              {order.map((option) => (
                <Menu.RadioItem
                  key={option}
                  value={option}
                  className={itemStyles}
                  closeOnClick
                >
                  {icons[option]}
                  {labels[option]}
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
