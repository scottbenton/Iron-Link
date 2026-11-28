/**
 * The game page on a phone, with the decisions of the mobile redesign
 * (scottbenton/Iron-Link PRs 338 to 346), built from the library.
 * Story-only: PhoneGamePage.stories.tsx renders it.
 *
 * - Top bar: back to your games (an arrow), the character switcher (portrait
 *   and name, the page's h1) and a gear menu: the combined SettingsMenu
 *   (character, game with Second Screen, theme and app settings).
 * - Bottom nav: Sheet, Notes, Moves, Oracles and Log, which switch the page's
 *   section in place. Log counts entries that arrived while it was off
 *   screen. The nav hides while the keyboard is up.
 * - Sheet: Overview, Assets and Tracks as standard 48px tabs; initiative as a
 *   segmented control in the ruleset's words; stats as roll buttons that
 *   wrap; meters two to a row with plain 44px steppers; impacts as a summary
 *   card that opens a dialog.
 * - Notes: the open note's name and a square count that lists the open
 *   notes in a sheet; the formatting toolbar shows only while the text has
 *   focus, ending with Done editing.
 * - Game overview: chosen from the character switcher (or `page`), the
 *   first nav item becomes Overview, with Characters, Assets and Tracks
 *   tabs: the game's characters and players, its shared assets and tracks.
 * - Rolls and notifications share one stack, as the Toaster stacks them on
 *   wider screens: the newest card over the edges of two older ones, and an
 *   "N notifications" handle opening them all in a sheet.
 */
import {
  BookOpenIcon,
  ClockCounterClockwiseIcon,
  DiceFiveIcon,
  FileTextIcon,
  UserIcon,
  UsersThreeIcon,
} from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";

import { css } from "styled-system/css";

import { VisuallyHidden } from "../../components/VisuallyHidden";
import { sampleCharacters } from "../../docs/fixtures/characters";
import { ActivityDock, DockedItem } from "../../game/ActivityDock";
import { CharacterPortrait } from "../../game/CharacterPortrait";
import { CharacterSwitcher } from "../../game/CharacterSwitcher";
import type { RollData } from "../../game/RollCard";
import { AppShell } from "../AppShell";
import { MobileNav } from "../MobileNav";
import type { MobileNavItem } from "../MobileNav";
import { NavBar } from "../NavBar";
import { GameSettingsMenu } from "./GameSettingsMenu";
import { LogScreen } from "./LogScreen";
import { MovesScreen } from "./MovesScreen";
import { NotesScreen } from "./NotesScreen";
import { OraclesScreen } from "./OraclesScreen";
import { OverviewScreen } from "./OverviewScreen";
import { SheetScreen } from "./SheetScreen";
import { PhoneRuleset } from "./phoneGameScreens";

export type PhoneSection = "sheet" | "notes" | "moves" | "oracles" | "log";

/* ------------------------------------------------------------------------ */
/* Top bar                                                                  */
/* ------------------------------------------------------------------------ */

const characters = sampleCharacters.map((character) => ({
  id: character.id,
  name: character.name,
  href: `#${character.id}`,
  portrait: <CharacterPortrait name={character.name} size="xs" decorative />,
}));

/* ------------------------------------------------------------------------ */
/* The page                                                                 */
/* ------------------------------------------------------------------------ */

const sectionTitles: Record<PhoneSection, string> = {
  sheet: "Sheet",
  notes: "Notes",
  moves: "Moves",
  oracles: "Oracles",
  log: "Game Log",
};

const pageStyles = css({
  // The on-screen keyboard's height in the editing story.
  "--keyboard-height": "260px",
});

const sectionStyles = css({
  display: "flex",
  flexDirection: "column",
  flex: "1 1 auto",
  minHeight: 0,
  // Room under the content for the activity dock, so the last row can scroll
  // clear of it.
  "&[data-has-rolls]": { "--phone-page-foot": "240px" },
  // A phone layout on a wider screen (a tablet, or a window up to 900px)
  // keeps its screens to a phone-and-a-bit width, centred, rather than
  // stretching stats and meters across it. The bars stay full width.
  "& > *": {
    boxSizing: "border-box",
    width: "100%",
    maxWidth: "40rem",
    marginInline: "auto",
  },
});

/** The bottom bar's slot: the activity dock floats above the nav. */
const footStyles = css({ position: "relative" });

const dockStyles = css({
  position: "absolute",
  insetInline: "4",
  bottom: "calc(100% + token(spacing.3))",
  width: "auto",
  // Over the screens' own centred width.
  maxWidth: "calc(40rem - 2 * token(spacing.4))",
  marginInline: "auto",
});

/** A character's page, or the game's overview. */
export type PhonePage = "character" | "overview";

export interface PhoneGamePageProps {
  /**
   * The page showing first. The character switcher's links change it in
   * the story too.
   */
  page?: PhonePage;
  /** The section showing first. */
  section?: PhoneSection;
  ruleset?: PhoneRuleset;
  /** Rolls already in the dock, oldest first. */
  rolls?: RollData[];
  /** Adds a notification (Progress marked) to the stack, after the rolls. */
  notice?: boolean;
  /** Log entries that arrived while the log was off screen. */
  unreadLog?: number;
}

/**
 * The game page on a phone, opening on Kira Vale. Rolling a stat, meter or
 * oracle adds a card to the activity dock.
 */
export function PhoneGamePage(props: PhoneGamePageProps) {
  const {
    page: initialPage = "character",
    section: initialSection = "sheet",
    ruleset = "starforged",
    rolls: initialRolls = [],
    notice: initialNotice = false,
    unreadLog = 2,
  } = props;
  const [page, setPage] = useState<PhonePage>(initialPage);
  const [section, setSection] = useState<PhoneSection>(initialSection);

  // The switcher's links: Game overview, or a character (always Kira's
  // sheet here). Either opens on its first section.
  useEffect(() => {
    const follow = () => {
      const hash = window.location.hash.slice(1);
      const next: PhonePage | null =
        hash === "overview"
          ? "overview"
          : characters.some((character) => character.id === hash)
            ? "character"
            : null;
      if (next) {
        setPage(next);
        setSection("sheet");
      }
    };
    window.addEventListener("hashchange", follow);
    return () => window.removeEventListener("hashchange", follow);
  }, []);
  const overview = page === "overview";
  const [rolls, setRolls] = useState<DockedItem[]>(() => [
    ...initialRolls.map((roll, index) => ({ id: `roll-${index}`, roll })),
    ...(initialNotice
      ? [
          {
            id: "notice",
            toast: {
              tone: "success" as const,
              message: "Progress marked",
              description: "Recover the Hollow Crown, 4 of 10 boxes",
            },
          },
        ]
      : []),
  ]);
  const [unread, setUnread] = useState(
    initialSection === "log" ? 0 : unreadLog,
  );
  const [editing, setEditing] = useState(false);
  const rollCount = useRef(initialRolls.length);

  // The log counts as read once it shows.
  useEffect(() => {
    if (section === "log") setUnread(0);
  }, [section]);

  const addRoll = (roll: RollData) =>
    setRolls((current) => [
      ...current,
      { id: `roll-${rollCount.current++}`, roll },
    ]);

  const navSections: {
    id: PhoneSection;
    label: string;
    Icon: typeof UserIcon;
    badge?: number;
  }[] = [
    overview
      ? { id: "sheet", label: "Overview", Icon: UsersThreeIcon }
      : { id: "sheet", label: "Sheet", Icon: UserIcon },
    { id: "notes", label: "Notes", Icon: FileTextIcon },
    { id: "moves", label: "Moves", Icon: BookOpenIcon },
    { id: "oracles", label: "Oracles", Icon: DiceFiveIcon },
    { id: "log", label: "Log", Icon: ClockCounterClockwiseIcon, badge: unread },
  ];
  const items: MobileNavItem[] = navSections.map(({ Icon, ...item }) => ({
    ...item,
    icon: <Icon />,
    currentIcon: <Icon weight="fill" />,
    current: item.id === section,
    onSelect: () => {
      setEditing(false);
      setSection(item.id);
    },
  }));

  // The keyboard is up while a note is being edited: the nav steps aside.
  const keyboardUp = section === "notes" && editing;

  return (
    <div className={pageStyles}>
      <AppShell
        fill
        topBar={
          <NavBar
            title={
              <CharacterSwitcher
                characters={characters}
                current={overview ? "overview" : "kira"}
                gameName="The Drowned Archive"
                overviewHref="#overview"
                addCharacterHref="#create-character"
              />
            }
            backHref="#games"
            backLabel="Back to your games"
            actions={<GameSettingsMenu overview={overview} />}
          />
        }
        bottomNav={
          <div className={footStyles}>
            <ActivityDock
              className={dockStyles}
              items={rolls}
              onDismiss={(id) =>
                setRolls((current) => current.filter((item) => item.id !== id))
              }
              onClearAll={() => setRolls([])}
            />
            {!keyboardUp && <MobileNav label="Game Sections" items={items} />}
          </div>
        }
      >
        <section
          aria-labelledby="phone-section-title"
          className={sectionStyles}
          data-has-rolls={rolls.length > 0 ? "" : undefined}
        >
          <VisuallyHidden>
            <h2 id="phone-section-title">
              {overview && section === "sheet"
                ? "Game Overview"
                : sectionTitles[section]}
            </h2>
          </VisuallyHidden>
          {section === "sheet" &&
            (overview ? (
              <OverviewScreen />
            ) : (
              <SheetScreen ruleset={ruleset} onRoll={addRoll} />
            ))}
          {section === "notes" && (
            <NotesScreen editing={editing} onEditingChange={setEditing} />
          )}
          {section === "moves" && <MovesScreen ruleset={ruleset} />}
          {section === "oracles" && (
            <OraclesScreen ruleset={ruleset} onRoll={addRoll} />
          )}
          {section === "log" && <LogScreen />}
        </section>
      </AppShell>
    </div>
  );
}
