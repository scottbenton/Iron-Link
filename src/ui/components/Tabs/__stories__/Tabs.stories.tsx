import {
  BookOpen,
  Folder,
  GlobeHemisphereWest,
  House,
  Notebook,
  UserCircle,
} from "@phosphor-icons/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

import { Box, Stack } from "ui/primitives";

import { css, cx } from "styled-system/css";

import {
  NoteTab,
  NoteTabPanel,
  NoteTabs,
  PageTab,
  PageTabs,
  SectionTab,
  SectionTabList,
  SectionTabsAlign,
  SectionTabsSize,
  SectionTabsVariant,
  TabPanel,
  Tabs,
} from "..";
import { samplePortraitSrc } from "../../../docs/fixtures/characters";
import { Avatar } from "../../Avatar";
import { Button } from "../../Button";
import { Text } from "../../Text";

const sectionTabsVariants: SectionTabsVariant[] = ["well", "underline"];

interface PlaygroundArgs {
  variant: SectionTabsVariant;
  size: SectionTabsSize;
  align?: SectionTabsAlign;
  activateOnFocus: boolean;
}

const meta: Meta<PlaygroundArgs> = {
  title: "Components/Tabs",
  args: {
    variant: "well",
    size: "md",
    align: "center",
    activateOnFocus: true,
  },
  argTypes: {
    variant: { control: "inline-radio", options: sectionTabsVariants },
    size: { control: "inline-radio", options: ["md", "lg"] },
    align: { control: "inline-radio", options: ["center", "start"] },
  },
};

export default meta;
type Story = StoryObj<PlaygroundArgs>;

const frame = css({
  border: "1px solid token(colors.border.default)",
  borderRadius: "lg",
  background: "bg.surface",
  overflow: "hidden",
});

const panelText = css({ color: "fg.muted", fontSize: "sm", margin: 0 });

function SectionTabsDemo(props: PlaygroundArgs) {
  const { variant, size, align = "center", activateOnFocus } = props;
  return (
    <Tabs defaultValue="tracks">
      <Stack gap="3">
        <SectionTabList
          aria-label="Character sections"
          variant={variant}
          size={size}
          align={align}
          activateOnFocus={activateOnFocus}
        >
          <SectionTab value="overview">Overview</SectionTab>
          <SectionTab value="assets">Assets</SectionTab>
          <SectionTab value="tracks">Tracks</SectionTab>
        </SectionTabList>
        <TabPanel value="overview">
          <p className={panelText}>Stats, condition meters and momentum.</p>
        </TabPanel>
        <TabPanel value="assets">
          <p className={panelText}>
            Companions, paths, combat talents and rituals.
          </p>
        </TabPanel>
        <TabPanel value="tracks">
          <p className={panelText}>
            Vows, journeys and fights, with their progress.
          </p>
        </TabPanel>
      </Stack>
    </Tabs>
  );
}

/**
 * Section tabs: a well (the default, as the game page's columns use) or an
 * underline (the phone screens, at size large).
 */
export const Playground: Story = {
  render: (args) => (
    <Box maxWidth="420px">
      <SectionTabsDemo
        variant={args.variant}
        size={args.size}
        align={args.align}
        activateOnFocus={args.activateOnFocus}
      />
    </Box>
  ),
};

/**
 * Large underline tabs: 48px tall at any pointer, for tabs that head a
 * whole phone screen.
 */
export const SectionTabsLarge: Story = {
  name: "Section Tabs, large",
  render: () => (
    <Box maxWidth="420px">
      <SectionTabsDemo variant="underline" size="lg" activateOnFocus />
    </Box>
  ),
};

/** Section tabs with icons and a disabled tab. */
export const SectionTabsWithIcons: Story = {
  render: () => (
    <Tabs defaultValue="character" className={css({ maxWidth: "420px" })}>
      <SectionTabList aria-label="Panels">
        <SectionTab value="character" icon={<UserCircle />}>
          Character
        </SectionTab>
        <SectionTab value="notes" icon={<Notebook />}>
          Notes
        </SectionTab>
        <SectionTab value="reference" icon={<BookOpen />} disabled>
          Reference
        </SectionTab>
      </SectionTabList>
    </Tabs>
  ),
};

const pages = [
  { id: "character", label: "Character", icon: <UserCircle /> },
  { id: "overview", label: "Overview", icon: <House /> },
  { id: "notes", label: "Notes", icon: <Notebook /> },
  { id: "world", label: "World", icon: <GlobeHemisphereWest /> },
];

/**
 * Page tabs are links in a `nav`: a 3px gradient bar grows from the centre
 * under the current page. Tab moves between them, like any links.
 */
export const PageTabsStory: Story = {
  name: "Page Tabs",
  render: function PageTabsStory() {
    const [current, setCurrent] = useState("character");
    const page = pages.find((p) => p.id === current);
    return (
      <div className={frame}>
        <PageTabs aria-label="Game pages">
          {pages.map((p) => (
            <PageTab
              key={p.id}
              href={`#${p.id}`}
              icon={p.icon}
              current={p.id === current}
              onClick={(event) => {
                event.preventDefault();
                setCurrent(p.id);
              }}
            >
              {p.label}
            </PageTab>
          ))}
        </PageTabs>
        <Box padding="4">
          <Text variant="h2">{page?.label}</Text>
        </Box>
      </div>
    );
  },
};

const rulesets = [
  { id: "classic", label: "Ironsworn" },
  { id: "delve", label: "Delve" },
  { id: "starforged", label: "Starforged" },
];
const referenceSections = [
  { id: "moves", label: "Moves" },
  { id: "oracles", label: "Oracles" },
  { id: "assets", label: "Assets" },
  { id: "rules", label: "Rules" },
];

/**
 * Two rows of page tabs, as the reference page has them: the rulesets
 * underlined, and each ruleset's sections in a well under them, so the
 * rows read as different levels.
 */
export const PageTabsTwoRows: Story = {
  name: "Page Tabs, Two Rows",
  render: function PageTabsTwoRowsStory() {
    const [ruleset, setRuleset] = useState("classic");
    const [section, setSection] = useState("moves");
    return (
      <div className={frame}>
        <PageTabs aria-label="Rules">
          {rulesets.map((r) => (
            <PageTab
              key={r.id}
              href={`#${r.id}`}
              current={r.id === ruleset}
              onClick={(event) => {
                event.preventDefault();
                setRuleset(r.id);
              }}
            >
              {r.label}
            </PageTab>
          ))}
        </PageTabs>
        <PageTabs variant="well" aria-label="Sections">
          {referenceSections.map((s) => (
            <PageTab
              key={s.id}
              href={`#${s.id}`}
              current={s.id === section}
              onClick={(event) => {
                event.preventDefault();
                setSection(s.id);
              }}
            >
              {s.label}
            </PageTab>
          ))}
        </PageTabs>
      </div>
    );
  },
};

const party = [
  { id: "overview", name: "Overview" },
  { id: "kira", name: "Kira Vale", colorSeed: 12, portrait: samplePortraitSrc },
  { id: "orrin", name: "Orrin Thale", colorSeed: 210 },
  {
    id: "saska",
    name: "Saska of Thornhold, Last Warden of the Ember Gate",
    colorSeed: 140,
  },
  { id: "add", name: "Add Character" },
];

/**
 * Character pages with their portraits: Kira's uploaded image, Orrin's and
 * Saska's initials. A portrait is hidden from screen readers, so each tab
 * is named by the character's name alone. Saska's long name is cut short
 * at about 16em; hover or focus the tab for the whole name.
 */
export const PageTabsWithPortraits: Story = {
  name: "Page Tabs, with portraits",
  render: function PageTabsWithPortraitsStory() {
    const [current, setCurrent] = useState("kira");
    return (
      <div className={cx(css({ maxWidth: "720px" }), frame)}>
        <PageTabs aria-label="Game pages">
          {party.map((page) => (
            <PageTab
              key={page.id}
              href={`#${page.id}`}
              current={page.id === current}
              avatar={
                page.colorSeed !== undefined ? (
                  <Avatar
                    name={page.name}
                    src={page.portrait}
                    colorSeed={String(page.colorSeed)}
                    size="xs"
                    decorative
                  />
                ) : undefined
              }
              onClick={(event) => {
                event.preventDefault();
                setCurrent(page.id);
              }}
            >
              {page.name}
            </PageTab>
          ))}
        </PageTabs>
      </div>
    );
  },
};

/** A party with more characters than fit: the strip scrolls and fades. */
export const PageTabsOverflow: Story = {
  render: function PageTabsOverflowStory() {
    const tabs = [
      "Overview",
      "Kira Vale",
      "Orrin Thale",
      "Senna Ash-Eye",
      "Toren Vale",
      "Saska of Thornhold",
      "Add Character",
    ];
    const [current, setCurrent] = useState("Senna Ash-Eye");
    return (
      <div className={cx(css({ maxWidth: "360px" }), frame)}>
        <PageTabs aria-label="Game pages">
          {tabs.map((tab) => (
            <PageTab
              key={tab}
              href="#"
              current={tab === current}
              onClick={(event) => {
                event.preventDefault();
                setCurrent(tab);
              }}
            >
              {tab}
            </PageTab>
          ))}
        </PageTabs>
      </div>
    );
  },
};

const initialNotes: NoteTab[] = [
  { id: "session-12", label: "Session 12" },
  { id: "derelict", label: "The Derelict Ship" },
  { id: "npcs", label: "NPCs", icon: <Folder /> },
  { id: "vows", label: "Vows" },
];

const noteBodies: Record<string, string> = {
  "session-12":
    "We reached the derelict at dusk. Toren kept watch while Kira read the hull markings.",
  derelict:
    "A colony transport, adrift for decades. The airlock was sealed from the inside.",
  npcs: "Saska, the broker at Bleakhold. Orrin's old crewmate, Vex.",
  vows: "Recover the Hollow Crown. Avenge my brother.",
};

/**
 * Note tabs as chips. Try Delete on a tab, middle click, the close buttons
 * and the add button. Focus follows to the next note after a keyboard close.
 */
export const NoteTabsStory: Story = {
  name: "Note Tabs",
  render: function NoteTabsStory() {
    const [notes, setNotes] = useState(initialNotes);
    const [value, setValue] = useState<string | null>("session-12");
    const [count, setCount] = useState(0);
    const close = (id: string) => {
      const index = notes.findIndex((note) => note.id === id);
      const next = notes.filter((note) => note.id !== id);
      setNotes(next);
      if (id === value) {
        setValue(next[Math.min(index, next.length - 1)]?.id ?? null);
      }
    };
    const add = () => {
      const id = `untitled-${count + 1}`;
      setCount(count + 1);
      setNotes([
        ...notes,
        {
          id,
          label: count === 0 ? "Untitled Note" : `Untitled Note ${count + 1}`,
        },
      ]);
      setValue(id);
    };
    return (
      <div className={cx(css({ height: "320px" }), frame)}>
        <NoteTabs
          tabs={notes}
          value={value}
          onValueChange={setValue}
          onClose={close}
          onAdd={add}
          className={css({ height: "100%" })}
        >
          {notes.map((note) => (
            <NoteTabPanel key={note.id} value={note.id}>
              <Box padding="5">
                <Text variant="h3" as="h2">
                  {note.label}
                </Text>
                <Text color="muted">
                  {noteBodies[note.id] ?? "Empty note."}
                </Text>
              </Box>
            </NoteTabPanel>
          ))}
          {notes.length === 0 && (
            <Stack alignItems="center" gap="3" padding="8">
              <Text color="muted">No notes open.</Text>
              <Button variant="primary" onClick={add}>
                New Note
              </Button>
            </Stack>
          )}
        </NoteTabs>
      </div>
    );
  },
};

/** Many open notes in a narrow column: the strip scrolls with faded edges. */
export const NoteTabsOverflow: Story = {
  render: function NoteTabsOverflowStory() {
    const many: NoteTab[] = [
      ...initialNotes,
      { id: "bleakhold", label: "Bleakhold Station" },
      { id: "factions", label: "Factions" },
      { id: "session-11", label: "Session 11" },
      { id: "precursor", label: "The Precursor Vault" },
    ];
    const [notes, setNotes] = useState(many);
    const [value, setValue] = useState<string | null>("factions");
    return (
      <div className={cx(css({ maxWidth: "420px" }), frame)}>
        <NoteTabs
          tabs={notes}
          value={value}
          onValueChange={setValue}
          onClose={(id) => {
            const next = notes.filter((note) => note.id !== id);
            setNotes(next);
            if (id === value) setValue(next[0]?.id ?? null);
          }}
          onAdd={() => undefined}
        >
          {notes.map((note) => (
            <NoteTabPanel key={note.id} value={note.id}>
              <Box padding="5">
                <Text color="muted">{note.label}</Text>
              </Box>
            </NoteTabPanel>
          ))}
        </NoteTabs>
      </div>
    );
  },
};
