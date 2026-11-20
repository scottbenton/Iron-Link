import {
  CaretRight,
  DiceFive,
  DotsThreeVertical,
  GameController,
  Planet,
  Sword,
  Table,
  User,
  Users,
} from "@phosphor-icons/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

import { Grid } from "ui/primitives";

import { css } from "styled-system/css";

import { sampleCharacters } from "../../../docs/fixtures/characters";
import { IconButton } from "../../IconButton";
import {
  List,
  ListItem,
  ListItemButton,
  ListItemEnd,
  ListItemIcon,
  ListItemText,
  ListSubheader,
} from "../List";
import { ListRow } from "../ListRow";
import { ListRowButton } from "../ListRowButton";

const frame = css({
  width: "100%",
  maxWidth: "380px",
  border: "1px solid token(colors.border.default)",
  borderRadius: "lg",
  background: "bg.surface",
  overflow: "hidden",
});

const games = [
  { id: "g1", name: "The Forge Saga", rules: "Starforged", players: 3 },
  { id: "g2", name: "Ashes of Bleakhold", rules: "Ironsworn", players: 1 },
  { id: "g3", name: "Sundered Tides", rules: "Sundered Isles", players: 4 },
];

const meta: Meta<typeof List> = {
  title: "Components/List",
  component: List,
};

export default meta;
type Story = StoryObj<typeof List>;

/** The games list: each row opens a game, with a menu beside it. */
export const GamesList: Story = {
  render: function Render() {
    const [selected, setSelected] = useState("g1");
    return (
      <div className={frame}>
        <List divided>
          {games.map((game) => (
            <ListItem
              key={game.id}
              endAction={
                <IconButton label={`More options for ${game.name}`}>
                  <DotsThreeVertical />
                </IconButton>
              }
            >
              <ListItemButton
                selected={game.id === selected}
                aria-pressed={game.id === selected}
                onClick={() => setSelected(game.id)}
              >
                <ListItemIcon>
                  <GameController />
                </ListItemIcon>
                <ListItemText primary={game.name} secondary={game.rules} />
                <ListItemEnd>
                  {game.players} {game.players === 1 ? "player" : "players"}
                </ListItemEnd>
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </div>
    );
  },
};

/** A sidebar list: dense, inset rows of links, with groups. */
export const CharacterSidebar: Story = {
  render: () => (
    <div className={frame}>
      <List dense inset>
        <ListSubheader>Characters</ListSubheader>
        {sampleCharacters.map((character, index) => (
          <ListItem key={character.id}>
            <ListItemButton
              render={<a href={`#${character.id}`} />}
              selected={index === 0}
              aria-current={index === 0 ? "page" : undefined}
            >
              <ListItemIcon>
                <User />
              </ListItemIcon>
              <ListItemText
                truncate
                primary={character.name}
                secondary={`Played by ${character.playerName}`}
              />
            </ListItemButton>
          </ListItem>
        ))}
        <ListSubheader>World</ListSubheader>
        <ListItem>
          <ListItemButton render={<a href="#sectors" />}>
            <ListItemIcon>
              <Planet />
            </ListItemIcon>
            <ListItemText primary="Sectors" />
          </ListItemButton>
        </ListItem>
        <ListItem>
          <ListItemButton disabled>
            <ListItemIcon>
              <Users />
            </ListItemIcon>
            <ListItemText primary="Factions" secondary="Guide only" />
          </ListItemButton>
        </ListItem>
      </List>
    </div>
  ),
};

/** Plain rows with no action: a character's stats. */
export const PlainRows: Story = {
  render: () => {
    const character = sampleCharacters[0];
    return (
      <Grid className={frame}>
        <List divided>
          {Object.entries(character.stats).map(([stat, value]) => (
            <ListItem key={stat}>
              <ListItemIcon>
                <Sword />
              </ListItemIcon>
              <ListItemText
                primary={stat.charAt(0).toUpperCase() + stat.slice(1)}
              />
              <ListItemEnd>{value}</ListItemEnd>
            </ListItem>
          ))}
        </List>
      </Grid>
    );
  },
};

/**
 * `ListRow`: the dense row under move and oracle lists. The whole row does
 * one thing; an optional control lies over its end. Disabled rows take no
 * pointer at all.
 */
export const Rows: Story = {
  render: () => (
    <List className={frame}>
      <ListRow as="li">
        <ListRowButton>
          <span data-row-name="">Face Danger</span>
          <CaretRight data-row-glyph="" aria-hidden />
        </ListRowButton>
      </ListRow>
      <ListRow
        as="li"
        action={
          <IconButton label="View table for Action" size="sm">
            <Table />
          </IconButton>
        }
      >
        <ListRowButton>
          <span data-row-name="">Action</span>
          <span data-row-glyph="" aria-hidden>
            <DiceFive weight="bold" />
          </span>
        </ListRowButton>
      </ListRow>
      <ListRow as="li">
        <ListRowButton current>
          <span data-row-name="">Theme</span>
        </ListRowButton>
      </ListRow>
      <ListRow as="li">
        <ListRowButton disabled>
          <span data-row-name="">Make a Connection</span>
        </ListRowButton>
      </ListRow>
    </List>
  ),
};
