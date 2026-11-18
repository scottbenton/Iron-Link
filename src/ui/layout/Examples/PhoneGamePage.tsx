/**
 * The game page on a phone, with the decisions of the mobile redesign
 * (scottbenton/Iron-Link PRs 338 to 346), built from the library.
 * Story-only: PhoneGamePage.stories.tsx renders it.
 *
 * - Top bar: back to your games (an arrow), the character switcher (portrait
 *   and name, the page's h1) and a gear menu with the game and character
 *   settings, Second Screen among them.
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
 * - Rolls: the newest card over the edges of two older ones, an "N rolls"
 *   handle opening Recent rolls, and snackbars stacked above the rolls.
 */
import type { Datasworn } from "@datasworn-community/core";
import {
  ArrowCounterClockwiseIcon,
  BellIcon,
  BookOpenIcon,
  CheckIcon,
  ClockCounterClockwiseIcon,
  CopyIcon,
  DiceFiveIcon,
  DotsThreeIcon,
  FileTextIcon,
  GearSixIcon,
  ImageSquareIcon,
  LinkSimpleIcon,
  ListBulletsIcon,
  PaletteIcon,
  PencilSimpleIcon,
  PlusIcon,
  ProjectorScreenIcon,
  ShareNetworkIcon,
  ShieldIcon,
  TextBIcon,
  TextItalicIcon,
  TrashIcon,
  UserIcon,
} from "@phosphor-icons/react";
import { FocusEvent, useEffect, useRef, useState } from "react";

import { css } from "styled-system/css";
import { Flex, Stack } from "styled-system/jsx";

import { BreadcrumbItem, Breadcrumbs } from "../../components/Breadcrumbs";
import { Button } from "../../components/Button";
import { Checkbox } from "../../components/Checkbox";
import {
  Dialog,
  DialogActions,
  DialogBody,
  DialogClose,
  DialogHeader,
} from "../../components/Dialog";
import { IconButton } from "../../components/IconButton";
import {
  Menu,
  MenuContent,
  MenuGroup,
  MenuItem,
  MenuSeparator,
  MenuTrigger,
} from "../../components/Menu";
import {
  SectionTab,
  SectionTabList,
  TabPanel,
  Tabs,
} from "../../components/Tabs";
import { Text } from "../../components/Text";
import { ToastCard } from "../../components/Toast";
import { SegmentedControl } from "../../components/ToggleGroup";
import {
  Toolbar,
  ToolbarButton,
  ToolbarGroup,
  ToolbarSeparator,
} from "../../components/Toolbar";
import { VisuallyHidden } from "../../components/VisuallyHidden";
import { characterAuthor, gameLogEntries } from "../../examples/sampleLog";
import { AssetCard } from "../../game/AssetCard";
import { CharacterPortrait } from "../../game/CharacterPortrait";
import { Clock } from "../../game/Clock";
import {
  AddsMeter,
  ConditionMeter,
  MomentumMeter,
} from "../../game/ConditionMeter";
import { GameLog } from "../../game/GameLog";
import type { GameLogEntry } from "../../game/GameLog";
import type { ImpactGroup } from "../../game/ImpactsChecklist";
import { ImpactsSummary } from "../../game/ImpactsSummary";
import { getInitiativeOptions } from "../../game/InitiativeChip";
import type { InitiativeStatus } from "../../game/InitiativeChip";
import { MoveListItem } from "../../game/MoveListItem";
import { OracleListItem } from "../../game/OracleListItem";
import { ProgressTrack } from "../../game/ProgressTrack";
import type { RollData } from "../../game/RollCard";
import { StatGrid } from "../../game/StatCard";
import { XPMeter } from "../../game/XPTrack";
import { sampleCharacters } from "../../stories/fixtures/characters";
import {
  classicRules,
  sampleAssets,
  starforgedRules,
} from "../../stories/fixtures/datasworn";
import { ActionToolbar, ActionToolbarIconButton } from "../ActionToolbar";
import { AppShell } from "../AppShell";
import { CharacterSwitcher } from "../CharacterSwitcher";
import { MobileNav } from "../MobileNav";
import type { MobileNavItem } from "../MobileNav";
import { NavBar } from "../NavBar";
import { OpenNotesBar, OpenNotesSheet } from "../OpenNotes";
import type { OpenNote } from "../OpenNotes";
import { DockedRoll, RollDock } from "../RollDock";
import { SectionHeading } from "../SectionHeading";

export type PhoneSection = "sheet" | "notes" | "moves" | "oracles" | "log";
export type PhoneRuleset = "starforged" | "ironsworn";

const capitalize = (text: string) =>
  text.charAt(0).toUpperCase() + text.slice(1);

/* ------------------------------------------------------------------------ */
/* Rules data                                                               */
/* ------------------------------------------------------------------------ */

type LooseImpacts = Record<
  string,
  { label: string; contents: Record<string, { label: string }> }
>;

function getImpactGroups(ruleset: PhoneRuleset): ImpactGroup[] {
  const rules = ruleset === "ironsworn" ? classicRules : starforgedRules;
  return Object.entries(rules.rules.impacts as LooseImpacts).map(
    ([key, group]) => ({
      key,
      label: group.label,
      impacts: Object.entries(group.contents).map(([impactKey, impact]) => ({
        key: impactKey,
        label: impact.label,
      })),
    }),
  );
}

type LooseCategory = {
  name: string;
  contents: Record<string, Datasworn.AnyMove>;
};

function getMoveCategories(ruleset: PhoneRuleset): LooseCategory[] {
  const rules = ruleset === "ironsworn" ? classicRules : starforgedRules;
  return Object.values(rules.moves as Record<string, LooseCategory>);
}

type LooseOracle = Datasworn.OracleRollable;
type LooseCollection = {
  name: string;
  contents?: Record<string, LooseOracle>;
};

function getOracleCollections(ruleset: PhoneRuleset) {
  const rules = ruleset === "ironsworn" ? classicRules : starforgedRules;
  return Object.values(rules.oracles as Record<string, LooseCollection>)
    .filter((collection) => collection.contents)
    .slice(0, 4)
    .map((collection) => ({
      name: collection.name,
      oracles: Object.values(collection.contents ?? {}).slice(0, 8),
    }));
}

/* ------------------------------------------------------------------------ */
/* Top bar                                                                  */
/* ------------------------------------------------------------------------ */

const characters = sampleCharacters.map((character) => ({
  id: character.id,
  name: character.name,
  href: `#${character.id}`,
  portrait: (
    <CharacterPortrait
      name={character.name}
      colorSeed={character.colorSeed}
      size="xs"
      decorative
    />
  ),
}));

function SecondScreenDialog(props: { open: boolean; onClose: () => void }) {
  const [showSidebar, setShowSidebar] = useState(true);
  return (
    <Dialog
      open={props.open}
      onClose={props.onClose}
      size="md"
      fullScreenOnMobile
    >
      <DialogHeader title="Second Screen" />
      <DialogBody>
        <Text color="muted">
          Open this link on a shared screen, such as a TV, to show your table
          the current view.
        </Text>
        <div>
          <Button startIcon={<CopyIcon />}>Copy Second Screen Link</Button>
        </div>
        <Checkbox
          label="Show character sidebar"
          checked={showSidebar}
          onCheckedChange={setShowSidebar}
        />
        <Text variant="caption" color="muted">
          Current view: Kira Vale&apos;s sheet
        </Text>
      </DialogBody>
      <DialogActions>
        <DialogClose render={<Button variant="primary">Done</Button>} />
      </DialogActions>
    </Dialog>
  );
}

/**
 * The gear menu: the game's settings (Second Screen first on phones, which
 * have no Reference tab for it) and the character's.
 */
function GameSettingsMenu() {
  const [secondScreenOpen, setSecondScreenOpen] = useState(false);
  return (
    <>
      <Menu>
        <MenuTrigger
          render={
            <IconButton label="Game and Character Settings">
              <GearSixIcon />
            </IconButton>
          }
        />
        <MenuContent align="end">
          <MenuGroup label="Game Settings">
            <MenuItem
              icon={<ProjectorScreenIcon />}
              onClick={() => setSecondScreenOpen(true)}
            >
              Second Screen
            </MenuItem>
            <MenuItem icon={<PencilSimpleIcon />}>Edit Game Name</MenuItem>
            <MenuItem icon={<BookOpenIcon />}>Edit Rulesets</MenuItem>
            <MenuItem icon={<PaletteIcon />}>Change Game Theme</MenuItem>
            <MenuItem icon={<BellIcon />}>Notification Settings</MenuItem>
            <MenuItem icon={<TrashIcon />} tone="danger">
              Delete Game
            </MenuItem>
          </MenuGroup>
          <MenuSeparator />
          <MenuGroup label="Kira Vale Settings">
            <MenuItem icon={<ShieldIcon />}>Edit Access</MenuItem>
            <MenuItem icon={<UserIcon />}>Change Portrait</MenuItem>
            <MenuItem icon={<TrashIcon />} tone="danger">
              Delete Character
            </MenuItem>
          </MenuGroup>
        </MenuContent>
      </Menu>
      <SecondScreenDialog
        open={secondScreenOpen}
        onClose={() => setSecondScreenOpen(false)}
      />
    </>
  );
}

/* ------------------------------------------------------------------------ */
/* Sheet                                                                    */
/* ------------------------------------------------------------------------ */

const statKeys = ["edge", "heart", "iron", "shadow", "wits"] as const;
const meterKeys = ["health", "spirit", "supply"] as const;

/** The 48px tabs, sharing the width as the live phone tabs do. */
const screenTabsStyles = css({
  paddingInline: "4",
  paddingBlockStart: "1",
  "& [role=tablist]": { width: "100%" },
  // Equal shares of the row; doubled to outrank the tab's own `flex`.
  "& [role=tab][role=tab]": { flex: "1 1 0" },
});

const screenPanelStyles = css({
  paddingInline: "4",
  paddingBlockStart: "4",
  // Clear of the roll dock when rolls are showing.
  paddingBlockEnd: "var(--phone-page-foot, token(spacing.8))",
});

/** Meters two to a row, as on the live phone sheet. */
const meterGridStyles = css({
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "2",
});

function SheetScreen(props: {
  ruleset: PhoneRuleset;
  onRoll: (roll: RollData) => void;
}) {
  const { ruleset, onRoll } = props;
  const character = sampleCharacters[0];
  const [meters, setMeters] = useState(character.meters);
  const [adds, setAdds] = useState(0);
  const [initiative, setInitiative] = useState<InitiativeStatus>("outOfCombat");
  const [impacts, setImpacts] = useState<Record<string, boolean>>({
    wounded: true,
  });
  const [xp, setXp] = useState(4);
  const [vowTicks, setVowTicks] = useState(12);
  const [clock, setClock] = useState(2);
  const impactGroups = getImpactGroups(ruleset);

  const roll = (statName: string, statValue: number) => {
    const actionDie = 4;
    const actionScore = Math.min(10, actionDie + statValue + adds);
    onRoll({
      kind: "action",
      moveName: "Face Danger",
      statName,
      statValue,
      adds: adds || undefined,
      actionDie,
      actionScore,
      challengeDice: [3, 8],
      outcome: actionScore > 8 ? "strongHit" : "weakHit",
    });
    setAdds(0);
  };

  return (
    <Tabs defaultValue="overview">
      <div className={screenTabsStyles}>
        <SectionTabList
          aria-label="Character Sections"
          variant="underline"
          size="lg"
        >
          <SectionTab value="overview">Overview</SectionTab>
          <SectionTab value="assets">Assets</SectionTab>
          <SectionTab value="tracks">Tracks</SectionTab>
        </SectionTabList>
      </div>

      <TabPanel value="overview" className={screenPanelStyles}>
        <Stack gap="6">
          {/* The portrait and name are in the top bar, so the sheet opens
              on initiative. */}
          <SegmentedControl<InitiativeStatus>
            aria-label="Initiative"
            fullWidth
            options={getInitiativeOptions(
              ruleset === "ironsworn" ? "ironsworn" : "starforged",
            )}
            value={initiative}
            onValueChange={setInitiative}
          />

          <Stack gap="2" as="section">
            <SectionHeading title="Stats" as="h3" variant="band" />
            <StatGrid
              stats={statKeys.map((key) => ({
                key,
                name: capitalize(key),
                value: character.stats[key],
              }))}
              adds={adds}
              onRoll={(stat) => roll(stat.name, stat.value)}
            />
          </Stack>

          <Stack gap="2" as="section">
            <SectionHeading title="Meters" as="h3" variant="band" />
            <div className={meterGridStyles}>
              {meterKeys.map((meter) => (
                <ConditionMeter
                  key={meter}
                  label={capitalize(meter)}
                  value={meters[meter]}
                  max={5}
                  warnAtMin
                  adds={adds}
                  stepperSize="touch"
                  onChange={(value) =>
                    setMeters((current) => ({ ...current, [meter]: value }))
                  }
                  onRoll={() => roll(capitalize(meter), meters[meter])}
                />
              ))}
              <MomentumMeter
                value={meters.momentum}
                stepperSize="touch"
                onChange={(value) =>
                  setMeters((current) => ({ ...current, momentum: value }))
                }
                onBurn={() =>
                  setMeters((current) => ({ ...current, momentum: 2 }))
                }
              />
            </div>
            <AddsMeter value={adds} onChange={setAdds} stepperSize="touch" />
          </Stack>

          <Stack gap="2" as="section">
            <SectionHeading
              title={ruleset === "ironsworn" ? "Debilities" : "Impacts"}
              as="h3"
              variant="band"
            />
            <ImpactsSummary
              groups={impactGroups}
              value={impacts}
              onImpactChange={(key, marked) =>
                setImpacts((current) => ({ ...current, [key]: marked }))
              }
              wording={ruleset === "ironsworn" ? "ironsworn" : "starforged"}
            />
          </Stack>

          {ruleset === "starforged" && (
            <Stack gap="2" as="section">
              <SectionHeading title="Legacy Tracks" as="h3" variant="band" />
              <ProgressTrack label="Quests" ticks={14} legacy />
              <ProgressTrack label="Bonds" ticks={6} legacy />
              <ProgressTrack label="Discoveries" ticks={9} legacy />
            </Stack>
          )}

          <Stack gap="2" as="section">
            <SectionHeading title="Experience" as="h3" variant="band" />
            <XPMeter label="Unspent Experience" value={xp} onChange={setXp} />
          </Stack>
        </Stack>
      </TabPanel>

      <TabPanel value="assets" className={screenPanelStyles}>
        <Stack gap="3">
          <Flex justifyContent="space-between" alignItems="center" gap="2">
            <Checkbox label="Show all abilities" size="sm" />
            <Button size="sm" startIcon={<PlusIcon />}>
              Add Assets
            </Button>
          </Flex>
          <AssetCard
            asset={sampleAssets.starship}
            state={{ controlValues: { integrity: 4 } }}
            headingAs="h3"
          />
          <AssetCard asset={sampleAssets.ace} headingAs="h3" />
        </Stack>
      </TabPanel>

      <TabPanel value="tracks" className={screenPanelStyles}>
        <Stack gap="3">
          <Flex justifyContent="space-between" alignItems="center" gap="2">
            <Checkbox label="Show Completed" size="sm" />
            <Button size="sm" startIcon={<PlusIcon />}>
              Add Track
            </Button>
          </Flex>
          <ProgressTrack
            label="Recover the Hollow Crown"
            typeLabel="Vow"
            rank="formidable"
            ticks={vowTicks}
            onChange={setVowTicks}
          />
          <ProgressTrack
            label="Cross the Shattered Reach to Bleakhold"
            typeLabel="Journey"
            rank="dangerous"
            ticks={16}
          />
          <Clock
            presentation="card"
            label="The archive floods"
            typeLabel="Tension Clock"
            segments={6}
            value={clock}
            onChange={setClock}
          />
        </Stack>
      </TabPanel>
    </Tabs>
  );
}

/* ------------------------------------------------------------------------ */
/* Notes                                                                    */
/* ------------------------------------------------------------------------ */

const sampleOpenNotes: OpenNote[] = [
  { id: "session-4", label: "Session 4: The Drowned Archive", type: "note" },
  { id: "vows", label: "Kira's Vows", type: "note" },
  { id: "salvagers", label: "The Salvagers", type: "note" },
  { id: "bleakhold", label: "Bleakhold Station", type: "world" },
];

const playerNotes = [
  { id: "session-3", label: "Session 3: Salt and Static" },
  { id: "session-4", label: "Session 4: The Drowned Archive" },
  { id: "vows", label: "Kira's Vows" },
  { id: "salvagers", label: "The Salvagers" },
];

const allNotesTab: OpenNote = {
  id: "all-notes",
  label: "Kira Vale's Notes",
  type: "folder",
};

const noteStripStyles = css({ paddingInline: "4", paddingBlockStart: "3" });

const noteBodyStyles = css({
  display: "grid",
  gap: "3",
  paddingInline: "4",
  paddingBlockStart: "4",
  paddingBlockEnd: "var(--phone-page-foot, token(spacing.8))",
  "&[data-editing]": {
    // Clear of the toolbar and the keyboard while typing.
    paddingBlockEnd: "calc(var(--keyboard-height) + 72px)",
  },
});

const editorStyles = css({
  display: "grid",
  gap: "3",
  minHeight: "160px",
  borderRadius: "sm",
  outline: "none",
  fontFamily: "body",
  fontSize: "md",
  lineHeight: "relaxed",
  "& p": { margin: 0 },
  _focusVisible: {
    outline: "2px solid token(colors.focusRing)",
    outlineOffset: "4px",
  },
});

/**
 * The formatting bar rides on the keyboard: placed over the shell's foot,
 * raised by the keyboard's height. It sits in the page right after the
 * note's breadcrumbs, so it is read before the text.
 */
const formatBarStyles = css({
  position: "absolute",
  zIndex: "sticky",
  insetInline: 0,
  bottom: "var(--keyboard-height)",
  display: "flex",
  alignItems: "center",
  gap: "1",
  paddingInline: "2",
  paddingBlock: "1",
  borderTop: "1px solid token(colors.border.default)",
  background: "bg.surface",
  "& [data-part=tools]": {
    flex: "1 1 auto",
    minWidth: 0,
    overflowX: "auto",
    scrollbarWidth: "none",
    flexWrap: "nowrap",
  },
  // 44px targets: the bar is only ever on a phone.
  "& [data-part=tools] button": { minWidth: "touch", minHeight: "touch" },
});

/**
 * A stand-in for the on-screen keyboard, so the editing story shows where
 * the toolbar sits. Not part of the design.
 */
const keyboardStyles = css({
  position: "absolute",
  zIndex: "sticky",
  insetInline: 0,
  bottom: 0,
  height: "var(--keyboard-height)",
  display: "grid",
  placeItems: "center",
  background:
    "repeating-linear-gradient(45deg, token(colors.bg.emphasized) 0 8px, token(colors.bg.muted) 8px 16px)",
  borderTop: "1px solid token(colors.border.default)",
  color: "fg.muted",
  fontSize: "sm",
});

function NotesScreen(props: {
  editing: boolean;
  onEditingChange: (editing: boolean) => void;
}) {
  const { editing, onEditingChange } = props;
  const [notes, setNotes] = useState(sampleOpenNotes);
  const [currentId, setCurrentId] = useState<string | null>("session-4");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [marks, setMarks] = useState<string[]>([]);
  const editorRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);

  const current = notes.find((note) => note.id === currentId) ?? null;

  // Editing lasts while focus is in the text or the bar.
  const handleBlur = (event: FocusEvent) => {
    const next = event.relatedTarget;
    if (
      next instanceof Node &&
      (editorRef.current?.contains(next) || barRef.current?.contains(next))
    ) {
      return;
    }
    onEditingChange(false);
  };
  const stopEditing = () => {
    onEditingChange(false);
    editorRef.current?.blur();
  };

  const toggleMark = (mark: string) =>
    setMarks((current) =>
      current.includes(mark)
        ? current.filter((item) => item !== mark)
        : [...current, mark],
    );

  const openNote = (id: string) => {
    const known = playerNotes.find((note) => note.id === id);
    if (known && !notes.some((note) => note.id === id)) {
      setNotes((current) => [...current, { ...known, type: "note" }]);
    }
    setCurrentId(id);
  };

  return (
    <>
      <OpenNotesBar
        title={current?.label ?? "Notes"}
        count={notes.length}
        listOpen={sheetOpen}
        onOpenList={() => setSheetOpen(true)}
      />
      <OpenNotesSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        notes={notes}
        currentId={currentId}
        onSelect={setCurrentId}
        onCloseNote={(id) => {
          const index = notes.findIndex((note) => note.id === id);
          const next = notes.filter((note) => note.id !== id);
          setNotes(next);
          if (id === currentId) {
            setCurrentId(next[Math.min(index, next.length - 1)]?.id ?? null);
          }
        }}
        onNewNote={() => setSheetOpen(false)}
        onAllNotes={() => {
          if (!notes.some((note) => note.id === allNotesTab.id)) {
            setNotes((existing) => [...existing, allNotesTab]);
          }
          setCurrentId(allNotesTab.id);
        }}
      />

      {current?.type === "folder" ? (
        <Stack gap="2" padding="4">
          <Text variant="h3" as="h3">
            {current.label}
          </Text>
          {playerNotes.map((note) => (
            <Button
              key={note.id}
              variant="ghost"
              startIcon={<FileTextIcon />}
              onClick={() => openNote(note.id)}
              className={css({ justifyContent: "flex-start" })}
            >
              {note.label}
            </Button>
          ))}
        </Stack>
      ) : current ? (
        <>
          <div className={noteStripStyles}>
            <ActionToolbar
              label="Note Actions"
              breadcrumbs={
                <Breadcrumbs>
                  <BreadcrumbItem href="#notes">Notes</BreadcrumbItem>
                  <BreadcrumbItem current>{current.label}</BreadcrumbItem>
                </Breadcrumbs>
              }
            >
              <ActionToolbarIconButton label="Share Note">
                <ShareNetworkIcon />
              </ActionToolbarIconButton>
              <ActionToolbarIconButton label="More Note Actions">
                <DotsThreeIcon weight="bold" />
              </ActionToolbarIconButton>
            </ActionToolbar>
          </div>

          {editing && (
            <div
              ref={barRef}
              className={formatBarStyles}
              onBlur={handleBlur}
              // Pressing a button keeps the text, and the keyboard, focused.
              onMouseDown={(event) => {
                if ((event.target as HTMLElement).closest("button")) {
                  event.preventDefault();
                }
              }}
            >
              <Toolbar
                aria-label="Formatting"
                variant="plain"
                data-part="tools"
              >
                <ToolbarGroup aria-label="Text style">
                  <ToolbarButton
                    label="Bold"
                    icon={<TextBIcon />}
                    pressed={marks.includes("bold")}
                    onClick={() => toggleMark("bold")}
                  />
                  <ToolbarButton
                    label="Italic"
                    icon={<TextItalicIcon />}
                    pressed={marks.includes("italic")}
                    onClick={() => toggleMark("italic")}
                  />
                </ToolbarGroup>
                <ToolbarSeparator />
                <ToolbarGroup aria-label="Insert">
                  <ToolbarButton
                    label="Bulleted List"
                    icon={<ListBulletsIcon />}
                  />
                  <ToolbarButton label="Link" icon={<LinkSimpleIcon />} />
                  <ToolbarButton label="Image" icon={<ImageSquareIcon />} />
                  <ToolbarButton
                    label="Undo"
                    icon={<ArrowCounterClockwiseIcon />}
                  />
                </ToolbarGroup>
              </Toolbar>
              <Button
                variant="primary"
                size="sm"
                startIcon={<CheckIcon />}
                onClick={stopEditing}
                className={css({ flex: "none" })}
              >
                Done editing
              </Button>
            </div>
          )}

          <div
            className={noteBodyStyles}
            data-editing={editing ? "" : undefined}
          >
            <Text variant="h3" as="h3">
              {current.label}
            </Text>
            <div
              ref={editorRef}
              className={editorStyles}
              role="textbox"
              aria-multiline="true"
              aria-label={`${current.label} text`}
              contentEditable
              suppressContentEditableWarning
              onFocus={() => onEditingChange(true)}
              onBlur={handleBlur}
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  event.preventDefault();
                  stopEditing();
                }
              }}
            >
              <p>
                Kira and Orrin reached the archive at low tide. The lower stacks
                were already under water, and something had dragged the shelves
                into a barricade across the reading room.
              </p>
              <p>
                Orrin swore an iron vow to recover the starchart before the next
                flood. Kira is less sure it is still there: the salvager they
                met at the dock was carrying a tube of the same stamped leather.
              </p>
              <p>
                Open threads: who hired the salvager, why the archive keepers
                left, and what is moving under the water in the east wing.
              </p>
            </div>
          </div>

          {editing && (
            <div className={keyboardStyles} aria-hidden>
              On-screen keyboard
            </div>
          )}
        </>
      ) : (
        <Stack alignItems="center" gap="3" padding="8">
          <Text color="muted">No notes open.</Text>
          <Button startIcon={<PlusIcon />} onClick={() => setSheetOpen(true)}>
            Open a note
          </Button>
        </Stack>
      )}
    </>
  );
}

/* ------------------------------------------------------------------------ */
/* Reference: Moves, Oracles, Log                                           */
/* ------------------------------------------------------------------------ */

const referenceStyles = css({
  paddingInline: "4",
  paddingBlockStart: "4",
  paddingBlockEnd: "var(--phone-page-foot, token(spacing.8))",
});

function MovesScreen(props: { ruleset: PhoneRuleset }) {
  return (
    <Stack gap="5" className={referenceStyles}>
      {getMoveCategories(props.ruleset).map((category) => (
        <Stack key={category.name} gap="1" as="section">
          <SectionHeading title={category.name} as="h3" variant="band" />
          {Object.values(category.contents).map((move) => (
            <MoveListItem key={move._id} move={move} />
          ))}
        </Stack>
      ))}
    </Stack>
  );
}

function OraclesScreen(props: {
  ruleset: PhoneRuleset;
  onRoll: (roll: RollData) => void;
}) {
  return (
    <Stack gap="5" className={referenceStyles}>
      {getOracleCollections(props.ruleset).map((collection) => (
        <Stack key={collection.name} gap="1" as="section">
          <SectionHeading title={collection.name} as="h3" variant="band" />
          {collection.oracles.map((oracle) => (
            <OracleListItem
              key={oracle._id}
              name={oracle.name}
              onRoll={() =>
                props.onRoll({
                  kind: "oracle",
                  oracleName: oracle.name,
                  category: collection.name,
                  roll: 67,
                  result: "Power fails",
                })
              }
            />
          ))}
        </Stack>
      ))}
    </Stack>
  );
}

const logScreenStyles = css({
  flex: "1 1 auto",
  minHeight: 0,
  display: "flex",
  flexDirection: "column",
});

function LogScreen() {
  const [entries, setEntries] = useState<GameLogEntry[]>(gameLogEntries);
  return (
    <div className={logScreenStyles}>
      <GameLog
        entries={entries}
        onSend={(message) =>
          setEntries((current) => [
            ...current,
            {
              kind: "message",
              id: `message-${current.length}`,
              author: characterAuthor(sampleCharacters[0], true),
              timestamp: new Date(),
              message,
            },
          ])
        }
      />
    </div>
  );
}

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
  // Room under the content for the roll dock, so the last row can scroll
  // clear of it.
  "&[data-has-rolls]": { "--phone-page-foot": "240px" },
});

/** The bottom bar's slot: the roll dock floats above the nav. */
const footStyles = css({ position: "relative" });

const dockStyles = css({
  position: "absolute",
  insetInline: "4",
  bottom: "calc(100% + token(spacing.3))",
  width: "auto",
});

export interface PhoneGamePageProps {
  /** The section showing first. */
  section?: PhoneSection;
  ruleset?: PhoneRuleset;
  /** Rolls already in the dock, oldest first. */
  rolls?: RollData[];
  /** Shows a snackbar stacked above the rolls. */
  notice?: boolean;
  /** Log entries that arrived while the log was off screen. */
  unreadLog?: number;
}

/**
 * The game page on a phone, opening on Kira Vale. Rolling a stat, meter or
 * oracle adds a card to the roll dock.
 */
export function PhoneGamePage(props: PhoneGamePageProps) {
  const {
    section: initialSection = "sheet",
    ruleset = "starforged",
    rolls: initialRolls = [],
    notice: initialNotice = false,
    unreadLog = 2,
  } = props;
  const [section, setSection] = useState<PhoneSection>(initialSection);
  const [rolls, setRolls] = useState<DockedRoll[]>(() =>
    initialRolls.map((roll, index) => ({ id: `roll-${index}`, roll })),
  );
  const [notice, setNotice] = useState(initialNotice);
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
    { id: "sheet", label: "Sheet", Icon: UserIcon },
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
                current="kira"
                gameName="The Drowned Archive"
                overviewHref="#overview"
                addCharacterHref="#create-character"
              />
            }
            backHref="#games"
            backLabel="Back to your games"
            actions={<GameSettingsMenu />}
          />
        }
        bottomNav={
          <div className={footStyles}>
            <RollDock
              className={dockStyles}
              rolls={rolls}
              onDismiss={(id) =>
                setRolls((current) => current.filter((item) => item.id !== id))
              }
              onClearAll={() => setRolls([])}
              notice={
                notice && (
                  <ToastCard
                    tone="success"
                    message="Progress marked"
                    description="Recover the Hollow Crown, 4 of 10 boxes"
                    onDismiss={() => setNotice(false)}
                  />
                )
              }
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
            <h2 id="phone-section-title">{sectionTitles[section]}</h2>
          </VisuallyHidden>
          {section === "sheet" && (
            <SheetScreen ruleset={ruleset} onRoll={addRoll} />
          )}
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
