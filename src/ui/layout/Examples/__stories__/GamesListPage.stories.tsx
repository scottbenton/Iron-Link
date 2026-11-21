/**
 * The games list, laid out as the live `GameSelectPage`: a page header with
 * the h1 "Your Games" and Create Game, then a grid of game cards (300px and
 * up). Each card shows its characters' portraits the way the live
 * `GameCharacterPortraits` does: one large portrait, two overlapping, or up
 * to four small ones (three and a count past four) in the same square.
 */
import { PlusIcon, SwordIcon } from "@phosphor-icons/react";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { Grid } from "ui/primitives";

import { css } from "styled-system/css";

import { Button } from "../../../components/Button";
import { Card, CardHeader, CardLinkOverlay } from "../../../components/Card";
import { VisuallyHidden } from "../../../components/VisuallyHidden";
import { CharacterPortrait } from "../../../game/CharacterPortrait";
import type { SchemeName } from "../../../theme/schemes";
import { AppShell } from "../../AppShell";
import { EmptyState } from "../../EmptyState";
import { MobileNav } from "../../MobileNav";
import { NavBar } from "../../NavBar";
import { NavRail } from "../../NavRail";
import { PageContent } from "../../PageContent";
import { PageHeader } from "../../PageHeader";
import { PhoneFrame } from "../PhoneFrame";
import { getNavItems } from "../storyData";

const meta: Meta = {
  title: "Examples/Games list page",
  parameters: { layout: "fullscreen" },
};

export default meta;
type Story = StoryObj;

interface GameCharacter {
  id: string;
  name: string;
  /** The character's own colour scheme, which rings its portrait. */
  colorScheme?: SchemeName;
}

interface Game {
  id: string;
  name: string;
  /** The rulesets and expansions, as the live card lists them. */
  rules: string;
  /** Sorted as live: the reader's own characters first, then by name. */
  characters: GameCharacter[];
}

const games: Game[] = [
  {
    id: "iron-expanse",
    name: "The Iron Expanse",
    rules: "Starforged, Sundered Isles",
    characters: [
      { id: "kira", name: "Kira Vale", colorScheme: "cinder" },
      { id: "orrin", name: "Orrin Thale", colorScheme: "mystic" },
    ],
  },
  {
    id: "ashes",
    name: "Ashes of the Forge",
    rules: "Ironsworn, Delve",
    characters: [
      { id: "senna", name: "Senna Ash-Eye", colorScheme: "hinterlands" },
    ],
  },
  {
    id: "wardens",
    name: "Wardens of the Shroud",
    rules: "Starforged",
    characters: [
      { id: "bryn", name: "Bryn Corwen", colorScheme: "orchid" },
      { id: "kira-2", name: "Kira Vale", colorScheme: "cinder" },
      { id: "tobias", name: "Tobias Rook", colorScheme: "eidolon" },
    ],
  },
  {
    id: "convoy",
    name: "The Long Night Convoy and the Drowned Stars Beyond the Reach",
    rules: "Starforged",
    characters: [
      { id: "ilse", name: "Ilse Marrow", colorScheme: "myriad" },
      { id: "dax", name: "Dax Ferro", colorScheme: "default" },
      { id: "orrin-2", name: "Orrin Thale", colorScheme: "mystic" },
      { id: "senna-2", name: "Senna Ash-Eye", colorScheme: "hinterlands" },
      { id: "bryn-2", name: "Bryn Corwen", colorScheme: "orchid" },
      { id: "tobias-2", name: "Tobias Rook", colorScheme: "eidolon" },
    ],
  },
  {
    id: "tidebound",
    name: "Tidebound",
    rules: "Sundered Isles",
    characters: [],
  },
];

/** 88px, the live cluster's square: an xl portrait, or the smaller ones in it. */
const clusterStyles = css({
  position: "relative",
  flex: "none",
  width: "88px",
  height: "88px",
  // The front portrait of a pair sits at the bottom right. Each portrait's
  // ring, in its character's colour, keeps the two apart where they overlap.
  "&[data-count='2'] > :last-child": {
    position: "absolute",
    insetInlineEnd: 0,
    bottom: 0,
  },
  "&[data-count='many']": {
    display: "flex",
    flexWrap: "wrap",
    alignContent: "center",
    justifyContent: "center",
  },
});

const overflowStyles = css({
  display: "grid",
  placeItems: "center",
  width: "44px",
  height: "44px",
  boxSizing: "border-box",
  borderRadius: "md",
  border: "1px solid token(colors.border.default)",
  background: "bg.muted",
  color: "fg.muted",
  fontFamily: "heading",
  fontWeight: "bold",
  fontVariantNumeric: "tabular-nums",
});

/**
 * The live `GameCharacterPortraits`, from library portraits. Pictures only:
 * the card reads the names in text.
 */
function GamePortraits(props: { characters: GameCharacter[] }) {
  const { characters } = props;
  if (characters.length === 0) return null;

  const portrait = (character: GameCharacter, size: "xl" | "lg" | "md") => (
    <CharacterPortrait
      key={character.id}
      name={character.name}
      colorScheme={character.colorScheme}
      size={size}
      shape="rounded"
      decorative
    />
  );

  if (characters.length === 1) {
    return <div className={clusterStyles}>{portrait(characters[0], "xl")}</div>;
  }
  if (characters.length === 2) {
    // The reader's own character in front, at the bottom right.
    return (
      <div className={clusterStyles} data-count="2">
        {portrait(characters[1], "lg")}
        {portrait(characters[0], "lg")}
      </div>
    );
  }
  const shown = characters.length > 4 ? characters.slice(0, 3) : characters;
  return (
    <div className={clusterStyles} data-count="many">
      {shown.map((character) => portrait(character, "md"))}
      {characters.length > 4 && (
        <span className={overflowStyles} aria-hidden="true">
          +{characters.length - 3}
        </span>
      )}
    </div>
  );
}

const cardTitleStyles = css({
  fontFamily: "heading",
  textTransform: "uppercase",
  letterSpacing: "label",
});

function GameCard(props: { game: Game }) {
  const { game } = props;
  return (
    <Card padding={game.characters.length > 0 ? "sm" : "md"}>
      <CardHeader
        titleAs="h2"
        avatar={<GamePortraits characters={game.characters} />}
        title={
          <CardLinkOverlay href={`#${game.id}`}>
            <span className={cardTitleStyles}>{game.name}</span>
          </CardLinkOverlay>
        }
        subtitle={<span className={cardTitleStyles}>{game.rules}</span>}
      />
      {game.characters.length > 0 && (
        <VisuallyHidden>
          Characters:{" "}
          {game.characters
            .map((character) => character.name)
            .sort((a, b) => a.localeCompare(b))
            .join(", ")}
        </VisuallyHidden>
      )}
    </Card>
  );
}

const createGameButton = (
  <Button variant="gradient" startIcon={<PlusIcon />}>
    Create Game
  </Button>
);

function GamesPage(props: { empty?: boolean }) {
  return (
    <>
      {/* The page's one heading; the cards' game names are its h2s. */}
      <PageHeader title="Your Games" actions={createGameButton} />
      <PageContent>
        {props.empty ? (
          <EmptyState
            icon={<SwordIcon />}
            title="No Games Yet"
            message="Start a game to track characters, vows and progress with your group or on your own."
            action={createGameButton}
          />
        ) : (
          <Grid
            gridTemplateColumns="repeat(auto-fill, minmax(min(300px, 100%), 1fr))"
            gap="3"
          >
            {games.map((game) => (
              <GameCard key={game.id} game={game} />
            ))}
          </Grid>
        )}
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

/**
 * Cards with one, two, three and six characters (three shown and a count),
 * a long name, and a game with no characters yet.
 */
export const Desktop: Story = { render: () => <DesktopShell /> };

/** No games: the empty state sits on the page, with no card or border. */
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
