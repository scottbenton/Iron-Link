import {
  BookOpenIcon,
  ChartBarIcon,
  IdentificationCardIcon,
  LightningIcon,
  MoonIcon,
  PaletteIcon,
  PencilSimpleIcon,
  PersonArmsSpreadIcon,
  ProjectorScreenIcon,
  ShieldCheckIcon,
  SignOutIcon,
  SpeakerHighIcon,
  TrashIcon,
  UserGearIcon,
} from "@phosphor-icons/react";
import { ReactNode } from "react";

import { MenuCheckboxItem, MenuItem } from "../../components/Menu";
import { SettingsMenuAction, SettingsMenuItemId } from "./settingsMenuSections";
import {
  SettingsMenuColorMode,
  SettingsMenuStrings,
} from "./settingsMenuStrings";

const itemIcons: Record<SettingsMenuItemId, ReactNode> = {
  characterDetails: <IdentificationCardIcon />,
  characterStats: <ChartBarIcon />,
  characterAccess: <UserGearIcon />,
  deleteCharacter: <TrashIcon />,
  gameName: <PencilSimpleIcon />,
  gameRulesets: <BookOpenIcon />,
  logSound: <SpeakerHighIcon />,
  secondScreen: <ProjectorScreenIcon />,
  deleteGame: <TrashIcon />,
  theme: <PaletteIcon />,
  colorMode: <MoonIcon />,
  accessibility: <PersonArmsSpreadIcon />,
  advancedFeatures: <LightningIcon />,
  admin: <ShieldCheckIcon />,
  signOut: <SignOutIcon />,
};

const itemLabels: Record<
  Exclude<SettingsMenuItemId, "colorMode" | "logSound">,
  keyof SettingsMenuStrings
> = {
  characterDetails: "characterDetails",
  characterStats: "characterStats",
  characterAccess: "characterAccess",
  deleteCharacter: "deleteCharacter",
  gameName: "gameName",
  gameRulesets: "gameRulesets",
  secondScreen: "secondScreen",
  deleteGame: "deleteGame",
  theme: "theme",
  accessibility: "accessibility",
  advancedFeatures: "advancedFeatures",
  admin: "admin",
  signOut: "signOut",
};

interface ItemsProps {
  items: SettingsMenuItemId[];
  strings: SettingsMenuStrings;
  onSelect: (action: SettingsMenuAction) => void;
  onRequestDelete: (target: "character" | "game") => void;
  themeDescription?: string;
  colorMode?: SettingsMenuColorMode;
  onColorModeChange?: (mode: SettingsMenuColorMode) => void;
  logSound?: boolean;
  onLogSoundChange?: (on: boolean) => void;
}

export function SettingsItems(props: ItemsProps) {
  const {
    items,
    strings,
    onSelect,
    onRequestDelete,
    themeDescription,
    colorMode,
    onColorModeChange,
    logSound,
    onLogSoundChange,
  } = props;
  return items.map((id) => {
    if (id === "logSound") {
      return (
        <MenuCheckboxItem
          key={id}
          icon={itemIcons[id]}
          description={strings.logSoundDescription}
          checked={logSound ?? false}
          onCheckedChange={(checked) => onLogSoundChange?.(checked)}
        >
          {strings.logSound}
        </MenuCheckboxItem>
      );
    }
    if (id === "colorMode") {
      return (
        <MenuCheckboxItem
          key={id}
          icon={itemIcons[id]}
          checked={colorMode === "dark"}
          onCheckedChange={(checked) =>
            onColorModeChange?.(checked ? "dark" : "light")
          }
        >
          {strings.darkMode}
        </MenuCheckboxItem>
      );
    }
    const label = strings[itemLabels[id]] as string;
    if (id === "deleteCharacter" || id === "deleteGame") {
      return (
        <MenuItem
          key={id}
          icon={itemIcons[id]}
          tone="danger"
          onClick={() =>
            onRequestDelete(id === "deleteCharacter" ? "character" : "game")
          }
        >
          {label}
        </MenuItem>
      );
    }
    return (
      <MenuItem
        key={id}
        icon={itemIcons[id]}
        description={id === "theme" ? themeDescription : undefined}
        onClick={() => onSelect(id)}
      >
        {label}
      </MenuItem>
    );
  });
}
