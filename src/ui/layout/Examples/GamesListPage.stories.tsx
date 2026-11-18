import { PlusIcon, SwordIcon } from "@phosphor-icons/react";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { css } from "styled-system/css";
import { Grid, HStack, Stack } from "styled-system/jsx";

import { Button } from "../../components/Button";
import { Text } from "../../components/Text";
import { AppShell } from "../AppShell";
import { EmptyState } from "../EmptyState";
import { MobileNav } from "../MobileNav";
import { NavBar } from "../NavBar";
import { NavRail } from "../NavRail";
import { PageContent } from "../PageContent";
import { PageHeader } from "../PageHeader";
import { SectionHeading } from "../SectionHeading";
import { PhoneFrame } from "./StoryPlaceholders";
import { getNavItems } from "./storyData";

const meta: Meta = {
  title: "Layout/Examples/Games list page",
  parameters: { layout: "fullscreen" },
};

export default meta;
type Story = StoryObj;

const games = [
  {
    id: "iron-expanse",
    name: "The Iron Expanse",
    detail: "Starforged · Kira Vale, Orrin Thale",
  },
  {
    id: "ashes",
    name: "Ashes of the Forge",
    detail: "Ironsworn · Orrin Thale",
  },
];

const cardStyles = css({
  boxSizing: "border-box",
  padding: "4",
  borderRadius: "lg",
  border: "1px solid token(colors.border.default)",
  background: "bg.surface",
  boxShadow: "ledge",
  color: "inherit",
  textDecoration: "none",
  outline: "none",
  _hover: { borderColor: "border.control" },
  _focusVisible: {
    outline: "2px solid token(colors.focusRing)",
    outlineOffset: "2px",
  },
});

const newGameButton = (
  <Button variant="primary">
    <PlusIcon />
    New Game
  </Button>
);

function GamesList() {
  return (
    <Stack gap="4">
      <SectionHeading title="Your Games" />
      <Grid gridTemplateColumns="repeat(auto-fill, minmax(260px, 1fr))" gap="3">
        {games.map((game) => (
          <a key={game.id} href={`#${game.id}`} className={cardStyles}>
            <HStack gap="3">
              <SwordIcon size={24} aria-hidden="true" />
              <Stack gap="0.5">
                <Text variant="h4" as="span">
                  {game.name}
                </Text>
                <Text variant="bodySm" color="muted">
                  {game.detail}
                </Text>
              </Stack>
            </HStack>
          </a>
        ))}
      </Grid>
    </Stack>
  );
}

function NoGames() {
  return (
    <EmptyState
      bordered
      icon={<SwordIcon />}
      title="No Games Yet"
      message="Start a game to track characters, vows and progress with your group or on your own."
      action={newGameButton}
      secondaryAction={<Button variant="ghost">Join with an Invite</Button>}
    />
  );
}

function GamesPage(props: { empty?: boolean }) {
  return (
    <>
      <PageHeader
        title="Games"
        subtitle="Pick up where you left off, or start something new."
        actions={newGameButton}
      />
      <PageContent paddingBlock="md">
        {props.empty ? <NoGames /> : <GamesList />}
      </PageContent>
    </>
  );
}

function DesktopShell(props: { empty?: boolean }) {
  return (
    <AppShell
      rail={<NavRail items={getNavItems("games")} homeHref="#games" />}
      // The page's h1 is its PageHeader here, so the bar has no title.
      topBar={<NavBar homeHref="#games" />}
    >
      <GamesPage empty={props.empty} />
    </AppShell>
  );
}

export const Desktop: Story = { render: () => <DesktopShell /> };

export const DesktopEmpty: Story = {
  name: "Desktop, no games",
  render: () => <DesktopShell empty />,
};

function PhoneShell(props: { empty?: boolean }) {
  return (
    <PhoneFrame>
      <AppShell
        topBar={<NavBar homeHref="#games" />}
        bottomNav={<MobileNav items={getNavItems("games")} />}
      >
        <GamesPage empty={props.empty} />
      </AppShell>
    </PhoneFrame>
  );
}

export const Phone: Story = {
  parameters: { layout: "padded" },
  render: () => <PhoneShell />,
};

export const PhoneEmpty: Story = {
  name: "Phone, no games",
  parameters: { layout: "padded" },
  render: () => <PhoneShell empty />,
};
