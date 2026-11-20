import { PageTab, PageTabs } from "../../components/Tabs";
import {
  sampleCharacters,
  samplePortraitSrc,
} from "../../docs/fixtures/characters";
import { CharacterPortrait } from "../../game/CharacterPortrait";

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
