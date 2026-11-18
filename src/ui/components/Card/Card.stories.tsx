import { DotsThreeVertical, GameController } from "@phosphor-icons/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

import { Grid } from "styled-system/jsx";

import { sampleCharacters } from "../../stories/fixtures/characters";
import { Button } from "../Button";
import { IconButton } from "../IconButton";
import { Text } from "../Text";
import { Card, CardActionArea, CardBody, CardFooter, CardHeader } from "./Card";

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
 * their own controls above it.
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

/** A set of choices, such as the ruleset when creating a game. */
export const Selectable: Story = {
  render: function Render() {
    const [ruleset, setRuleset] = useState("starforged");
    const rulesets = [
      { id: "ironsworn", name: "Ironsworn", note: "The Ironlands" },
      { id: "starforged", name: "Starforged", note: "The Forge" },
      { id: "sundered", name: "Sundered Isles", note: "Starforged expansion" },
    ];
    return (
      <Grid columns={{ base: 1, sm: 3 }} gap="4" maxWidth="900px">
        {rulesets.map((option) => (
          <Card key={option.id} selected={option.id === ruleset}>
            <CardActionArea
              aria-pressed={option.id === ruleset}
              onClick={() => setRuleset(option.id)}
            >
              <CardHeader
                avatar={<GameController size={28} />}
                titleAs="span"
                title={option.name}
                subtitle={option.note}
              />
            </CardActionArea>
          </Card>
        ))}
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
