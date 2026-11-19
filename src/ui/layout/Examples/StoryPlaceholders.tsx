/**
 * Placeholder screens for the layout stories: enough of a character sheet,
 * the reference and the notes to show how the columns hold real content.
 * Story-only.
 */
import { ReactNode } from "react";

import { Box, Grid, HStack, Stack } from "ui/primitives";

import { css } from "styled-system/css";

import { PageTab, PageTabs } from "../../components/Tabs";
import { Text } from "../../components/Text";
import { CharacterPortrait } from "../../game/CharacterPortrait";
import {
  SampleCharacter,
  sampleCharacters,
  samplePortraitSrc,
} from "../../stories/fixtures/characters";
import { sampleMoves } from "../../stories/fixtures/datasworn";

const cardStyles = css({
  boxSizing: "border-box",
  padding: "3",
  borderRadius: "md",
  border: "1px solid token(colors.border.default)",
  background: "bg.surface",
});

const statNames = ["edge", "heart", "iron", "shadow", "wits"] as const;
const meterNames = ["health", "spirit", "supply", "momentum"] as const;

const capitalize = (value: string) =>
  value.charAt(0).toUpperCase() + value.slice(1);

/** Stats and meters, standing in for the character sheet. */
export function CharacterSheetPlaceholder(props: {
  character?: SampleCharacter;
}) {
  const { character = sampleCharacters[0] } = props;
  return (
    <Stack gap="4" padding="4">
      <Stack gap="0.5">
        <Text variant="h3" as="p">
          {character.name}
        </Text>
        <Text variant="bodySm" color="muted">
          Played by {character.playerName}
        </Text>
      </Stack>
      <Grid gridTemplateColumns="repeat(5, minmax(0, 1fr))" gap="2">
        {statNames.map((stat) => (
          <Stack key={stat} gap="0" alignItems="center" className={cardStyles}>
            <Text variant="numeric" as="span">
              {character.stats[stat]}
            </Text>
            <Text variant="caption" color="muted">
              {capitalize(stat)}
            </Text>
          </Stack>
        ))}
      </Grid>
      <Stack gap="2">
        {meterNames.map((meter) => (
          <HStack
            key={meter}
            justifyContent="space-between"
            className={cardStyles}
          >
            <Text variant="label">{capitalize(meter)}</Text>
            <Text variant="numeric">
              {character.meters[meter] > 0 ? "+" : ""}
              {character.meters[meter]}
            </Text>
          </HStack>
        ))}
      </Stack>
    </Stack>
  );
}

const moves = [
  sampleMoves.faceDanger,
  sampleMoves.gatherInformation,
  sampleMoves.strike,
  sampleMoves.payThePrice,
];

/** A short list of moves, standing in for the reference. */
export function ReferencePlaceholder() {
  return (
    <Stack gap="2" padding="4">
      {moves.map((move) => (
        <Box key={move._id ?? move.name} className={cardStyles}>
          <Text variant="label" as="p">
            {move.name}
          </Text>
          <Text variant="bodySm" color="muted">
            {move.trigger?.text}
          </Text>
        </Box>
      ))}
    </Stack>
  );
}

/** A journal entry, standing in for the notes. */
export function NotesPlaceholder() {
  return (
    <Stack gap="3" padding="6" maxWidth="70ch">
      <Text variant="h3" as="p">
        Session 4: The Drowned Archive
      </Text>
      <Text>
        Kira and Orrin reached the archive at low tide. The lower stacks were
        already under water, and something had dragged the shelves into a
        barricade across the reading room.
      </Text>
      <Text>
        Orrin swore an iron vow to recover the starchart before the next flood.
        Kira is less sure it is still there: the salvager they met at the dock
        was carrying a tube of the same stamped leather.
      </Text>
      <Text>
        Open threads: who hired the salvager, why the archive keepers left, and
        what is moving under the water in the east wing.
      </Text>
    </Stack>
  );
}

/** A character in the page tabs: a portrait image, or initials without one. */
export interface PageTabCharacter {
  id: string;
  name: string;
  portraitUrl?: string;
}

/** Kira with an uploaded portrait, Orrin with none (initials). */
const defaultTabCharacters: PageTabCharacter[] = [
  { ...sampleCharacters[0], portraitUrl: samplePortraitSrc },
  sampleCharacters[1],
];

/**
 * The game's page tabs, as the live app's `GameTabs`: Overview, one per
 * character, then Add Character. Each character's tab shows their portrait
 * (initials where they have none); the tab's accessible name is the name
 * alone.
 */
export function GamePageTabs(props: {
  current?: string;
  characters?: PageTabCharacter[];
  /** Show portraits in the character tabs. On by default. */
  portraits?: boolean;
}) {
  const {
    current = "kira",
    characters = defaultTabCharacters,
    portraits = true,
  } = props;
  const pages = [
    { id: "overview", label: "Overview" },
    ...characters.map((character) => ({
      id: character.id,
      label: character.name,
      character,
    })),
    { id: "create-character", label: "Add Character" },
  ];
  return (
    <PageTabs aria-label="Game Pages">
      {pages.map((page) => (
        <PageTab
          key={page.id}
          href={`#${page.id}`}
          current={page.id === current}
          avatar={
            portraits && "character" in page ? (
              <CharacterPortrait
                name={page.character.name}
                portraitUrl={page.character.portraitUrl}
                size="xs"
                decorative
              />
            ) : undefined
          }
        >
          {page.label}
        </PageTab>
      ))}
    </PageTabs>
  );
}

const phoneFrameStyles = css({
  boxSizing: "border-box",
  width: "390px",
  maxWidth: "100%",
  height: "760px",
  marginInline: "auto",
  border: "1px solid token(colors.border.default)",
  borderRadius: "xl",
  overflow: "auto",
  background: "bg.canvas",
  boxShadow: "float",
  "--app-shell-height": "100%",
});

/**
 * A phone-sized box. Layout components switch on the shell's own width, so
 * the shell inside takes the phone layout at any window size.
 */
export function PhoneFrame(props: { children: ReactNode }) {
  return <div className={phoneFrameStyles}>{props.children}</div>;
}
