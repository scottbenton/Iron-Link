import {
  BookOpenIcon,
  ChartBarIcon,
  GearSixIcon,
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
import { Fragment, ReactElement, ReactNode, useState } from "react";

import { ConfirmDialog } from "../../components/ConfirmDialog";
import { IconButton } from "../../components/IconButton";
import {
  Menu,
  MenuCheckboxItem,
  MenuContent,
  MenuContentProps,
  MenuGroup,
  MenuItem,
  MenuSeparator,
  MenuTrigger,
} from "../../components/Menu";
import {
  SettingsMenuAction,
  SettingsMenuCharacter,
  SettingsMenuContext,
  SettingsMenuGame,
  SettingsMenuItemId,
  SettingsMenuSection,
  getCharacterMenuItems,
  getSettingsMenuSections,
} from "./settingsMenuSections";
import {
  SettingsMenuColorMode,
  SettingsMenuStrings,
  SettingsMenuThemeScope,
  defaultSettingsMenuStrings,
} from "./settingsMenuStrings";

type PendingDelete = "character" | "game" | null;

interface MenuOpenProps {
  /** Controls whether the menu is open. */
  open?: boolean;
  /** Opens the menu on first render, for stories and tests. */
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

interface SharedMenuProps extends MenuOpenProps {
  /** Called with the item chosen. Theme opens the Theme dialog. */
  onSelect: (action: SettingsMenuAction) => void;
  /** Called after the person confirms Delete Character. */
  onDeleteCharacter?: () => void;
  /** Replaces the trigger button. It must forward refs and props. */
  trigger?: ReactElement;
  /** Where the menu opens against its trigger. */
  side?: MenuContentProps["side"];
  align?: MenuContentProps["align"];
  /** The default trigger's tooltip side. */
  tooltipSide?: "top" | "bottom" | "left" | "right";
  strings?: Partial<SettingsMenuStrings>;
}

export interface SettingsMenuProps
  extends SettingsMenuContext,
    SharedMenuProps {
  /**
   * The colour mode now; the Dark Mode item shows it checked. Unused with
   * `hideColorMode`, where `ColorModeToggle` takes these instead.
   */
  colorMode?: SettingsMenuColorMode;
  onColorModeChange?: (mode: SettingsMenuColorMode) => void;
  /** The device's log sound setting, checked when on (shared games only). */
  logSound?: boolean;
  onLogSoundChange?: (on: boolean) => void;
  /** Called after the person confirms Delete Game. */
  onDeleteGame?: () => void;
}

export interface CharacterSettingsMenuProps extends SharedMenuProps {
  character: SettingsMenuCharacter;
  /** The game, for what applies (a solo game has no Edit Access). */
  game?: SettingsMenuGame;
}

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

function SettingsItems(props: ItemsProps) {
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

interface DeleteConfirmProps {
  pending: PendingDelete;
  onDone: () => void;
  strings: SettingsMenuStrings;
  characterName?: string;
  game?: SettingsMenuGame;
  onDeleteCharacter?: () => void;
  onDeleteGame?: () => void;
}

/** The confirm behind each Delete, in the danger tone (Cancel focused). */
function DeleteConfirm(props: DeleteConfirmProps) {
  const {
    pending,
    onDone,
    strings,
    characterName = "",
    game,
    onDeleteCharacter,
    onDeleteGame,
  } = props;
  // Keep the last question while the dialog closes, so its text holds.
  const [shown, setShown] = useState<PendingDelete>(pending);
  if (pending && pending !== shown) setShown(pending);

  const isGame = shown === "game";
  return (
    <ConfirmDialog
      open={pending !== null}
      tone="danger"
      title={
        isGame
          ? strings.deleteGameTitle(game?.name ?? "")
          : strings.deleteCharacterTitle(characterName)
      }
      description={
        isGame
          ? strings.deleteGameDescription(game?.solo ?? false)
          : strings.deleteCharacterDescription
      }
      confirmationText={isGame ? strings.deleteGame : strings.deleteCharacter}
      cancellationText={isGame ? strings.keepGame : strings.keepCharacter}
      closeLabel={strings.closeLabel}
      onCancel={onDone}
      onConfirm={() => {
        onDone();
        if (isGame) onDeleteGame?.();
        else onDeleteCharacter?.();
      }}
    />
  );
}

function themeScope(game?: SettingsMenuGame): SettingsMenuThemeScope {
  if (!game) return "app";
  // A solo game with one character keeps its theme on the game.
  return game.solo && (game.characterCount ?? 1) < 2 ? "solo" : "game";
}

function headingFor(
  section: SettingsMenuSection,
  strings: SettingsMenuStrings,
  characterName?: string,
) {
  switch (section.id) {
    case "character":
      return strings.characterHeading(characterName ?? "");
    case "game":
      return strings.gameHeading;
    case "app":
      return strings.appHeading;
    default:
      // Change Theme names itself and covers every level.
      return undefined;
  }
}

/**
 * The one settings menu, from the gear on the nav rail or on a phone's top
 * bar. Its sections appear only where they apply, each under a small label:
 * the open character's settings (when the person can edit it), the game's
 * (inside a game; changes only for its Guides, plus the device's log sound
 * for everyone in a shared game), Change Theme (one item for every level,
 * opening the Theme dialog), then the app's. Each Delete is the last item of
 * its section and asks first. On the rail, pass `hideColorMode` and put a
 * `ColorModeToggle` above the gear; phones keep Dark Mode in the menu.
 */
export function SettingsMenu(props: SettingsMenuProps) {
  const {
    character,
    game,
    isAdmin,
    signedIn,
    hideColorMode,
    colorMode,
    onColorModeChange,
    logSound,
    onLogSoundChange,
    onSelect,
    onDeleteCharacter,
    onDeleteGame,
    trigger,
    side = "bottom",
    align = "end",
    tooltipSide,
    open,
    defaultOpen,
    onOpenChange,
  } = props;
  const strings = { ...defaultSettingsMenuStrings, ...props.strings };
  const [pendingDelete, setPendingDelete] = useState<PendingDelete>(null);

  const sections = getSettingsMenuSections({
    character,
    game,
    isAdmin,
    signedIn,
    hideColorMode,
  });

  return (
    <>
      <Menu open={open} defaultOpen={defaultOpen} onOpenChange={onOpenChange}>
        <MenuTrigger
          render={
            trigger ?? (
              <IconButton
                label={strings.triggerLabel}
                tooltipSide={tooltipSide}
              >
                <GearSixIcon />
              </IconButton>
            )
          }
        />
        <MenuContent side={side} align={align}>
          {sections.map((section, index) => (
            <Fragment key={section.id}>
              {index > 0 && <MenuSeparator />}
              <MenuGroup label={headingFor(section, strings, character?.name)}>
                <SettingsItems
                  items={section.items}
                  strings={strings}
                  onSelect={onSelect}
                  onRequestDelete={setPendingDelete}
                  themeDescription={strings.themeDescription(themeScope(game))}
                  colorMode={colorMode}
                  onColorModeChange={onColorModeChange}
                  logSound={logSound}
                  onLogSoundChange={onLogSoundChange}
                />
              </MenuGroup>
            </Fragment>
          ))}
        </MenuContent>
      </Menu>
      <DeleteConfirm
        pending={pendingDelete}
        onDone={() => setPendingDelete(null)}
        strings={strings}
        characterName={character?.name}
        game={game}
        onDeleteCharacter={onDeleteCharacter}
        onDeleteGame={onDeleteGame}
      />
    </>
  );
}

/**
 * The character column's menu: a shortcut to that character's own actions
 * (Change Name or Portrait, Update Stats, Edit Access, Change Theme, Delete
 * Character), with no game or app settings. The rail's SettingsMenu has
 * these too.
 */
export function CharacterSettingsMenu(props: CharacterSettingsMenuProps) {
  const {
    character,
    game,
    onSelect,
    onDeleteCharacter,
    trigger,
    side = "bottom",
    align = "end",
    tooltipSide = "bottom",
    open,
    defaultOpen,
    onOpenChange,
  } = props;
  const strings = { ...defaultSettingsMenuStrings, ...props.strings };
  const [pendingDelete, setPendingDelete] = useState<PendingDelete>(null);

  return (
    <>
      <Menu open={open} defaultOpen={defaultOpen} onOpenChange={onOpenChange}>
        <MenuTrigger
          render={
            trigger ?? (
              <IconButton
                label={strings.characterTriggerLabel}
                size="sm"
                tooltipSide={tooltipSide}
              >
                <GearSixIcon />
              </IconButton>
            )
          }
        />
        <MenuContent side={side} align={align}>
          <MenuGroup label={strings.characterHeading(character.name)}>
            <SettingsItems
              items={getCharacterMenuItems(character, game)}
              strings={strings}
              onSelect={onSelect}
              onRequestDelete={setPendingDelete}
            />
          </MenuGroup>
        </MenuContent>
      </Menu>
      <DeleteConfirm
        pending={pendingDelete}
        onDone={() => setPendingDelete(null)}
        strings={strings}
        characterName={character.name}
        onDeleteCharacter={onDeleteCharacter}
      />
    </>
  );
}
