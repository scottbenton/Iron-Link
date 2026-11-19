import {
  BookOpenIcon,
  GlobeHemisphereWestIcon,
  ListIcon,
  UsersIcon,
} from "@phosphor-icons/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

import { Stack } from "ui/primitives";
import { focusRing } from "ui/styles/focus";

import { css } from "styled-system/css";

import { Button } from "../Button";
import { IconButton } from "../IconButton";
import { Text } from "../Text";
import { Drawer, DrawerBody, DrawerFooter, DrawerHeader } from "./Drawer";

const meta = {
  title: "Components/Drawer",
  component: Drawer,
  parameters: { layout: "centered" },
  args: { open: false, onClose: () => {}, children: null },
} satisfies Meta<typeof Drawer>;

export default meta;
type Story = StoryObj<typeof meta>;

const navLink = css({
  display: "flex",
  alignItems: "center",
  gap: "3",
  minHeight: "40px",
  paddingInline: "3",
  borderRadius: "md",
  color: "fg.default",
  textDecoration: "none",
  fontSize: "sm",
  _hover: { background: "overlay.hover" },
  _focusVisible: focusRing.inset,
  "& svg": { width: "20px", height: "20px", color: "fg.muted" },
});

/** The phone navigation: it stays at its side on phones too. */
export const Navigation: Story = {
  render: function Render() {
    const [open, setOpen] = useState(false);
    return (
      <>
        <IconButton label="Open Menu" onClick={() => setOpen(true)}>
          <ListIcon />
        </IconButton>
        <Drawer
          open={open}
          onClose={() => setOpen(false)}
          side="left"
          mobile="side"
          size="sm"
        >
          <DrawerHeader title="Iron Link" />
          <DrawerBody>
            <nav aria-label="Main">
              <Stack gap="0.5">
                <a className={navLink} href="#characters">
                  <UsersIcon /> Characters
                </a>
                <a className={navLink} href="#worlds">
                  <GlobeHemisphereWestIcon /> Worlds
                </a>
                <a className={navLink} href="#reference">
                  <BookOpenIcon /> Rules Reference
                </a>
              </Stack>
            </nav>
          </DrawerBody>
        </Drawer>
      </>
    );
  },
};

/** A tool drawer: at the right on wide screens, a bottom sheet on phones. */
export const Oracles: Story = {
  render: function Render() {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)}>Open Oracles</Button>
        <Drawer open={open} onClose={() => setOpen(false)}>
          <DrawerHeader title="Oracles" />
          <DrawerBody>
            {[
              "Action",
              "Theme",
              "Region",
              "Location",
              "Coastal Waters Location",
              "Location Descriptor",
              "Settlement Name",
              "Character Role",
              "Character Goal",
              "Character Descriptor",
              "Combat Action",
              "Mystic Backlash",
            ].map((name) => (
              <Button key={name} variant="ghost" fullWidth>
                {name}
              </Button>
            ))}
          </DrawerBody>
          <DrawerFooter>
            <Text variant="caption" color="muted">
              Ironsworn and Ironsworn: Delve
            </Text>
          </DrawerFooter>
        </Drawer>
      </>
    );
  },
};

/** Always a bottom sheet, with actions in the footer. */
export const BottomSheet: Story = {
  render: function Render() {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)}>Roll Options</Button>
        <Drawer open={open} onClose={() => setOpen(false)} side="bottom">
          <DrawerHeader title="Roll Options" />
          <DrawerBody>
            <Text variant="bodySm" color="muted">
              Choose how Face Danger is rolled for Kara Ironhand.
            </Text>
          </DrawerBody>
          <DrawerFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={() => setOpen(false)}>
              Roll +Edge
            </Button>
          </DrawerFooter>
        </Drawer>
      </>
    );
  },
};
