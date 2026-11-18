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

import { css, cx } from "styled-system/css";
import { Box, Stack } from "styled-system/jsx";

import { Button } from "../Button";
import { Text } from "../Text";
import { NoteTab, NoteTabPanel, NoteTabs } from "./NoteTabs";
import { PageTab, PageTabs } from "./PageTabs";
import {
  SectionTab,
  SectionTabList,
  SectionTabsVariant,
  TabPanel,
  Tabs,
} from "./SectionTabs";

interface PlaygroundArgs {
  variant: SectionTabsVariant;
  fullWidth: boolean;
  activateOnFocus: boolean;
}

const meta: Meta<PlaygroundArgs> = {
  title: "Components/Tabs",
  args: { variant: "segmented", fullWidth: true, activateOnFocus: true },
  argTypes: {
    variant: {
      control: "inline-radio",
      options: ["segmented", "chips", "underline"],
    },
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
  const { variant, fullWidth, activateOnFocus } = props;
  return (
    <Tabs defaultValue="tracks">
      <Stack gap="3">
        <SectionTabList
          aria-label="Character sections"
          variant={variant}
          fullWidth={fullWidth}
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

/** Section tabs. The designer has not chosen a variant yet; try all three. */
export const Playground: Story = {
  render: (args) => (
    <Box maxWidth="420px">
      <SectionTabsDemo
        variant={args.variant}
        fullWidth={args.fullWidth}
        activateOnFocus={args.activateOnFocus}
      />
    </Box>
  ),
};

/** The three section tab variants side by side. The thumb slides in each. */
export const SectionTabVariants: Story = {
  render: () => (
    <Stack gap="8" maxWidth="420px">
      {(["segmented", "chips", "underline"] as const).map((variant) => (
        <Stack key={variant} gap="2">
          <Text variant="label" color="muted">
            {variant}
          </Text>
          <SectionTabsDemo
            variant={variant}
            fullWidth={variant === "segmented"}
            activateOnFocus
          />
        </Stack>
      ))}
    </Stack>
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
