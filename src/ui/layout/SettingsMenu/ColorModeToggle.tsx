import { MoonIcon, SunIcon } from "@phosphor-icons/react";
import { forwardRef } from "react";

import { IconButton, IconButtonProps } from "../../components/IconButton";
import {
  SettingsMenuColorMode,
  SettingsMenuStrings,
  defaultSettingsMenuStrings,
} from "./settingsMenuStrings";

export interface ColorModeToggleProps
  extends Omit<IconButtonProps, "label" | "children" | "onClick"> {
  /** The colour mode now. */
  colorMode: SettingsMenuColorMode;
  /** Called with the other mode. */
  onColorModeChange: (mode: SettingsMenuColorMode) => void;
  strings?: Partial<Pick<SettingsMenuStrings, "switchColorMode">>;
}

/**
 * Light and dark mode as one button, for the nav rail above the settings
 * gear (whose menu then leaves Dark Mode out with `hideColorMode`). It shows
 * the mode it switches to (a moon in light mode, a sun in dark) and is named
 * for that action, "Switch to dark mode". It is not a toggle button with
 * `aria-pressed`: its name already changes with each press, and a pressed
 * state on top would read as "Switch to light mode, pressed".
 */
export const ColorModeToggle = forwardRef<HTMLElement, ColorModeToggleProps>(
  function ColorModeToggle(props, ref) {
    const { colorMode, onColorModeChange, strings, ...rest } = props;
    const next = colorMode === "dark" ? "light" : "dark";
    const switchColorMode =
      strings?.switchColorMode ?? defaultSettingsMenuStrings.switchColorMode;
    return (
      <IconButton
        ref={ref}
        label={switchColorMode(next)}
        onClick={() => onColorModeChange(next)}
        {...rest}
      >
        {next === "dark" ? <MoonIcon /> : <SunIcon />}
      </IconButton>
    );
  },
);
