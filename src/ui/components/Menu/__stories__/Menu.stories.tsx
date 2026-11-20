import {
  ArrowCounterClockwiseIcon,
  BookOpenIcon,
  CaretDownIcon,
  ChartBarIcon,
  CopyIcon,
  DotsThreeVerticalIcon,
  GearIcon,
  ImageIcon,
  LightningIcon,
  MoonIcon,
  PaletteIcon,
  PencilSimpleIcon,
  PersonArmsSpreadIcon,
  ShieldCheckIcon,
  SignOutIcon,
  TrashIcon,
  UserGearIcon,
  UsersIcon,
} from "@phosphor-icons/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

import { HStack, Stack } from "ui/primitives";

import { Button } from "../../Button";
import { IconButton } from "../../IconButton";
import { Text } from "../../Text";
import {
  Menu,
  MenuCheckboxItem,
  MenuContent,
  MenuGroup,
  MenuItem,
  MenuLinkItem,
  MenuRadioGroup,
  MenuRadioItem,
  MenuSeparator,
  MenuSubmenu,
  MenuTrigger,
} from "../Menu";

const meta = {
  title: "Components/Menu",
  component: Menu,
  parameters: { layout: "centered" },
} satisfies Meta<typeof Menu>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The App Settings menu from the nav bar. */
export const AppSettings: Story = {
  render: function Render() {
    const [dark, setDark] = useState(false);
    return (
      <Menu>
        <MenuTrigger
          render={
            <IconButton label="App Settings">
              <GearIcon />
            </IconButton>
          }
        />
        <MenuContent align="end">
          <MenuGroup label="App Settings">
            <MenuItem icon={<ShieldCheckIcon />}>Admin Settings</MenuItem>
            <MenuItem
              icon={<MoonIcon />}
              onClick={() => setDark((value) => !value)}
            >
              {dark ? "Light Mode" : "Dark Mode"}
            </MenuItem>
            <MenuItem icon={<PersonArmsSpreadIcon />}>
              Accessibility Settings
            </MenuItem>
            <MenuItem icon={<LightningIcon />}>Advanced Features</MenuItem>
          </MenuGroup>
          <MenuSeparator />
          <MenuItem icon={<SignOutIcon />}>Sign Out</MenuItem>
        </MenuContent>
      </Menu>
    );
  },
};

/** The character sheet's settings menu, with its destructive action last. */
export const CharacterSettings: Story = {
  render: () => (
    <Menu>
      <MenuTrigger
        render={
          <IconButton label="Character Settings">
            <DotsThreeVerticalIcon />
          </IconButton>
        }
      />
      <MenuContent align="end">
        <MenuItem icon={<PencilSimpleIcon />}>Edit Details</MenuItem>
        <MenuItem icon={<ChartBarIcon />}>Edit Stats</MenuItem>
        <MenuItem icon={<ImageIcon />}>Change Portrait</MenuItem>
        <MenuItem icon={<PaletteIcon />}>Colour Scheme</MenuItem>
        <MenuItem icon={<UserGearIcon />}>Edit Access</MenuItem>
        <MenuSeparator />
        <MenuItem icon={<TrashIcon />} tone="danger">
          Delete Character
        </MenuItem>
      </MenuContent>
    </Menu>
  ),
};

/** A text trigger, descriptions under labels and shortcuts on the right. */
export const DescriptionsAndShortcuts: Story = {
  render: () => (
    <Menu>
      <MenuTrigger>
        Vow Actions
        <CaretDownIcon />
      </MenuTrigger>
      <MenuContent>
        <MenuItem icon={<PencilSimpleIcon />} shortcut="E">
          Edit Vow
        </MenuItem>
        <MenuItem
          icon={<ArrowCounterClockwiseIcon />}
          description="Erases every tick on Recover the Hollow Crown"
        >
          Clear Progress
        </MenuItem>
        <MenuItem icon={<CopyIcon />} shortcut="Ctrl D">
          Duplicate
        </MenuItem>
        <MenuItem icon={<BookOpenIcon />} disabled description="Ironsworn only">
          Fulfill Your Vow
        </MenuItem>
        <MenuSeparator />
        <MenuItem icon={<TrashIcon />} tone="danger" shortcut="Del">
          Delete Vow
        </MenuItem>
      </MenuContent>
    </Menu>
  ),
};

/** Checkbox items keep the menu open; radio items pick one of several. */
export const CheckboxAndRadio: Story = {
  render: function Render() {
    const [showOracles, setShowOracles] = useState(true);
    const [showMoves, setShowMoves] = useState(true);
    const [showHidden, setShowHidden] = useState(false);
    const [scheme, setScheme] = useState("ember");
    return (
      <Stack gap="3" alignItems="center">
        <Menu>
          <MenuTrigger>View</MenuTrigger>
          <MenuContent>
            <MenuGroup label="Sidebar">
              <MenuCheckboxItem
                checked={showMoves}
                onCheckedChange={setShowMoves}
              >
                Show Moves
              </MenuCheckboxItem>
              <MenuCheckboxItem
                checked={showOracles}
                onCheckedChange={setShowOracles}
              >
                Show Oracles
              </MenuCheckboxItem>
              <MenuCheckboxItem
                checked={showHidden}
                onCheckedChange={setShowHidden}
                description="Moves and oracles from rules you have turned off"
              >
                Show Hidden Rules
              </MenuCheckboxItem>
            </MenuGroup>
            <MenuSeparator />
            <MenuRadioGroup
              label="Colour Scheme"
              value={scheme}
              onValueChange={(value) => setScheme(value as string)}
            >
              <MenuRadioItem value="default" closeOnClick>
                Default
              </MenuRadioItem>
              <MenuRadioItem value="ember" closeOnClick>
                Ember
              </MenuRadioItem>
              <MenuRadioItem value="frost" closeOnClick>
                Frost
              </MenuRadioItem>
            </MenuRadioGroup>
          </MenuContent>
        </Menu>
        <Text variant="caption" color="muted">
          Scheme: {scheme}
        </Text>
      </Stack>
    );
  },
};

/** A nested menu opens to the side on hover, press or the right arrow key. */
export const Submenu: Story = {
  render: function Render() {
    const [scheme, setScheme] = useState("default");
    return (
      <Menu>
        <MenuTrigger
          render={
            <IconButton label="Game Settings">
              <GearIcon />
            </IconButton>
          }
        />
        <MenuContent>
          <MenuItem icon={<UsersIcon />}>Invite Players</MenuItem>
          <MenuSubmenu label="Colour Scheme" icon={<PaletteIcon />}>
            <MenuRadioGroup
              value={scheme}
              onValueChange={(value) => setScheme(value as string)}
            >
              <MenuRadioItem value="default">Default</MenuRadioItem>
              <MenuRadioItem value="ember">Ember</MenuRadioItem>
              <MenuRadioItem value="frost">Frost</MenuRadioItem>
              <MenuRadioItem value="moss">Moss</MenuRadioItem>
            </MenuRadioGroup>
          </MenuSubmenu>
          <MenuSubmenu label="Rules" icon={<BookOpenIcon />}>
            <MenuItem>Ironsworn</MenuItem>
            <MenuItem>Ironsworn: Delve</MenuItem>
            <MenuItem>Starforged</MenuItem>
            <MenuItem>Sundered Isles</MenuItem>
          </MenuSubmenu>
          <MenuSeparator />
          <MenuItem icon={<SignOutIcon />} tone="danger">
            Leave Game
          </MenuItem>
        </MenuContent>
      </Menu>
    );
  },
};

/** Links navigate; in the app pass the router link through `render`. */
export const Links: Story = {
  render: () => (
    <Menu>
      <MenuTrigger>Go To</MenuTrigger>
      <MenuContent>
        <MenuLinkItem href="#characters" icon={<UsersIcon />}>
          Characters
        </MenuLinkItem>
        <MenuLinkItem href="#worlds" icon={<BookOpenIcon />}>
          Worlds
        </MenuLinkItem>
        <MenuLinkItem href="#rules" inset>
          Rules Reference
        </MenuLinkItem>
      </MenuContent>
    </Menu>
  ),
};

/** Controlled: open from elsewhere and close after a dialog takes over. */
export const Controlled: Story = {
  render: function Render() {
    const [open, setOpen] = useState(false);
    return (
      <HStack gap="3">
        <Button onClick={() => setOpen(true)}>Open from elsewhere</Button>
        <Menu open={open} onOpenChange={setOpen}>
          <MenuTrigger>Asset Options</MenuTrigger>
          <MenuContent>
            <MenuItem icon={<PencilSimpleIcon />}>Edit Asset</MenuItem>
            <MenuItem icon={<TrashIcon />} tone="danger">
              Remove Asset
            </MenuItem>
          </MenuContent>
        </Menu>
      </HStack>
    );
  },
};
