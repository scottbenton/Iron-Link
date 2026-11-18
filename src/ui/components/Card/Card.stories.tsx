import {
  Check,
  DotsThreeVertical,
  Info,
  PencilSimple,
  SignOut,
  UserPlus,
} from "@phosphor-icons/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

import { Grid } from "ui/primitives";

import { PortraitGroup } from "../../game/PortraitGroup";
import { RulesText } from "../../game/RulesText/RulesText";
import { sampleCharacters } from "../../stories/fixtures/characters";
import { classicAsset } from "../../stories/fixtures/datasworn";
import { Button } from "../Button";
import { IconButton } from "../IconButton";
import {
  Menu,
  MenuContent,
  MenuItem,
  MenuSeparator,
  MenuTrigger,
} from "../Menu";
import { Text } from "../Text";
import {
  Card,
  CardActionArea,
  CardBody,
  CardButtonOverlay,
  CardFooter,
  CardHeader,
  CardLinkOverlay,
} from "./Card";

const meta: Meta<typeof Card> = {
  title: "Components/Card",
  component: Card,
};

export default meta;
type Story = StoryObj<typeof Card>;

export const Default: Story = {
  render: () => (
    <Grid maxWidth="360px">
      <Card>
        <CardHeader
          overline="Starforged"
          title="The Forge Saga"
          subtitle="3 players"
          action={
            <IconButton label="More options for The Forge Saga">
              <DotsThreeVertical />
            </IconButton>
          }
        />
        <CardBody>
          <Text variant="bodySm">
            Settlers flee a dying world for the Forge, a perilous region of
            dense star clusters.
          </Text>
        </CardBody>
        <CardFooter divider>
          <Text variant="caption" color="muted">
            Last played 2 days ago
          </Text>
          <Button size="sm">Open Game</Button>
        </CardFooter>
      </Card>
    </Grid>
  ),
};

/**
 * The whole card is a link to the character; the footer's buttons stay
 * their own controls above it. The link's name is everything inside the
 * action area. For a card with controls among its content, or a link named
 * by the title alone, use `CardLinkOverlay` (see Link Overlay).
 */
export const ActionArea: Story = {
  render: () => (
    <Grid columns={{ base: 1, sm: 3 }} gap="4" maxWidth="900px">
      {sampleCharacters.map((character) => (
        <Card key={character.id}>
          <CardActionArea render={<a href={`#${character.id}`} />}>
            <CardHeader
              title={character.name}
              subtitle={`Played by ${character.playerName}`}
            />
            <CardBody>
              <Text variant="bodySm" color="muted">
                Health {character.meters.health}, Spirit{" "}
                {character.meters.spirit}, Supply {character.meters.supply}
              </Text>
            </CardBody>
          </CardActionArea>
          <CardFooter>
            <Button size="sm" variant="ghost">
              Edit Character
            </Button>
          </CardFooter>
        </Card>
      ))}
    </Grid>
  ),
};

const games = [
  {
    id: "forge-saga",
    name: "The Forge Saga",
    ruleset: "Starforged",
    lastPlayed: "Last played 2 days ago",
    party: sampleCharacters,
  },
  {
    id: "bleakhold",
    name: "Bleakhold Vigil",
    ruleset: "Ironsworn",
    lastPlayed: "Last played last week",
    party: sampleCharacters.slice(0, 2),
  },
  {
    id: "salt-and-ruin",
    name: "Salt and Ruin",
    ruleset: "Sundered Isles",
    lastPlayed: "Not played yet",
    party: sampleCharacters.slice(2),
  },
];

/**
 * A game list. The game's name is a link stretched over the whole card, so a
 * click anywhere opens the game, while the menu and Invite stay their own
 * controls. The link's accessible name is the game's name alone. Hover the
 * card, press it, and tab through it: focus on the link rings the card.
 */
export const LinkOverlay: Story = {
  render: function Render() {
    const [invited, setInvited] = useState<string>();
    return (
      <Grid columns={{ base: 1, sm: 3 }} gap="4" maxWidth="900px">
        {games.map((game, index) => (
          <Card key={game.id} render={<article />}>
            <CardHeader
              overline={game.ruleset}
              title={
                index === 0 ? (
                  // A router link renders through `render`.
                  <CardLinkOverlay
                    render={<a href={`#/games/${game.id}`} data-router="" />}
                  >
                    {game.name}
                  </CardLinkOverlay>
                ) : (
                  <CardLinkOverlay href={`#/games/${game.id}`}>
                    {game.name}
                  </CardLinkOverlay>
                )
              }
              titleAs="h2"
              action={
                <Menu>
                  <MenuTrigger
                    render={
                      <IconButton label={`More options for ${game.name}`}>
                        <DotsThreeVertical />
                      </IconButton>
                    }
                  />
                  <MenuContent align="end">
                    <MenuItem icon={<PencilSimple />}>Rename Game</MenuItem>
                    <MenuSeparator />
                    <MenuItem icon={<SignOut />}>Leave Game</MenuItem>
                  </MenuContent>
                </Menu>
              }
            />
            <CardBody>
              <PortraitGroup
                members={game.party.map((character) => ({
                  id: character.id,
                  name: character.name,
                  colorSeed: character.colorSeed,
                }))}
                label="Characters"
                showNames={false}
              />
              <Text variant="bodySm" color="muted">
                {game.party.map((character) => character.name).join(", ")}
              </Text>
            </CardBody>
            <CardFooter divider>
              <Text variant="caption" color="muted">
                {game.lastPlayed}
              </Text>
              <Button
                size="sm"
                startIcon={<UserPlus />}
                onClick={() => setInvited(game.id)}
              >
                {invited === game.id ? "Invite Link Copied" : "Invite"}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </Grid>
    );
  },
};

const talents = ["ironclad", "shield_bearer", "swordmaster"].map((key) =>
  classicAsset("combat_talent", key),
);

/**
 * Choosing combat talents. Select is a button stretched over the whole
 * card, so a click anywhere on the card presses it, while the info button
 * in the header stays its own control and only shows the rules. Select is
 * a toggle named for the card ("Select Ironclad", pressed or not); the card
 * draws the focus ring and, while selected, the accent outline, which
 * shows at once even with the pointer still on the card.
 */
export const ButtonOverlay: Story = {
  render: function Render() {
    const [picked, setPicked] = useState<string[]>([talents[0]._id]);
    const [shown, setShown] = useState<string[]>([]);
    return (
      <Grid columns={{ base: 1, sm: 3 }} gap="4" maxWidth="900px">
        {talents.map((talent) => {
          const id: string = talent._id;
          const selected = picked.includes(id);
          const open = shown.includes(id);
          const toggle = (list: string[]) =>
            list.includes(id)
              ? list.filter((item) => item !== id)
              : [...list, id];
          return (
            <Card key={id} render={<article />} selected={selected}>
              <CardHeader
                overline="Combat Talent"
                title={talent.name}
                action={
                  <IconButton
                    label={`Rules for ${talent.name}`}
                    aria-pressed={open}
                    onClick={() => setShown(toggle)}
                  >
                    <Info />
                  </IconButton>
                }
              />
              <CardBody>
                <RulesText
                  markdown={
                    open
                      ? talent.abilities
                          .map(
                            (ability: { text: string }) => `- ${ability.text}`,
                          )
                          .join("\n")
                      : (talent.abilities[0]?.text ?? "")
                  }
                  size="sm"
                  color="muted"
                />
              </CardBody>
              <CardFooter>
                <Text variant="caption" color="muted">
                  {open ? "All three abilities" : "First ability"}
                </Text>
                <CardButtonOverlay
                  aria-label={`Select ${talent.name}`}
                  pressed={selected}
                  variant={selected ? "primary" : "outline"}
                  startIcon={selected ? <Check weight="bold" /> : undefined}
                  onClick={() => setPicked(toggle)}
                >
                  Select
                </CardButtonOverlay>
              </CardFooter>
            </Card>
          );
        })}
      </Grid>
    );
  },
};

export const Raised: Story = {
  render: () => (
    <Grid maxWidth="360px">
      <Card raised>
        <CardHeader title="Vows" titleAs="h2" />
        <CardBody>
          <Text variant="bodySm">Find the lost colony of Bleakhold.</Text>
        </CardBody>
      </Card>
    </Grid>
  ),
};
