import { fireEvent, render, screen, within } from "@testing-library/react";
import { ReactElement } from "react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import { DataswornLinkHandlerProvider } from "components/datasworn/DataswornLinkHandler";
import { loadLegacyIdMap } from "components/datasworn/DataswornRulesTextProvider";

import { RulesText } from "ui/game/RulesText";

import { getOracleRollable } from "hooks/datasworn/useOracleRollable";

import { RULESETS, RulesetName, loadRules } from "tests/datasworn/rulesets";

// One table of Datasworn rules text, run against RulesText as the app wires
// it (links through DataswornRulesTextProvider, no oracle lookup) and as a
// page that draws tables would (with `resolveOracle`). `expected` is what the
// app shows; `withOracles` is what changes with the lookup. Before slice 3
// these cases ran against MarkdownRenderer; the one difference since is
// changes.md row 21.

interface Expected {
  /** The text on screen, whitespace collapsed; unchecked when undefined. */
  text: string | undefined;
  /** Datasworn links, which are buttons. */
  buttons?: string[];
  /** Web links: name and href. */
  links?: Array<[string, string]>;
  tables?: number;
  listItems?: string[];
  strong?: string[];
  /** Pressing this button opens this Datasworn id. */
  opens?: [string, string];
}

interface Case {
  name: string;
  markdown: string;
  rules?: RulesetName;
  disableLinks?: boolean;
  expected: Expected;
  withOracles?: Partial<Expected>;
}

const CASES: Case[] = [
  {
    name: "a plain paragraph",
    markdown: "Make a move.",
    expected: { text: "Make a move." },
  },
  {
    name: "two paragraphs",
    markdown: "One.\n\nTwo.",
    expected: { text: "One. Two." },
  },
  {
    name: "an empty string",
    markdown: "",
    expected: { text: "" },
  },
  {
    name: "a bold trigger",
    markdown: "__When you act__, roll +edge.",
    expected: { text: "When you act, roll +edge.", strong: ["When you act"] },
  },
  {
    name: "a list",
    markdown: "Choose one.\n\n* Take +1 momentum\n* Take +1 health",
    expected: {
      text: "Choose one. Take +1 momentum Take +1 health",
      listItems: ["Take +1 momentum", "Take +1 health"],
    },
  },
  {
    name: "a markdown table",
    markdown: "Odds | Roll\n--|--\nLikely | 25 or less",
    expected: { text: "OddsRollLikely25 or less", tables: 1 },
  },
  {
    name: "a link to a loaded move",
    rules: "classic",
    markdown: "[Face Danger](datasworn:move:classic/adventure/face_danger).",
    expected: {
      text: "Face Danger.",
      buttons: ["Face Danger"],
      opens: ["Face Danger", "move:classic/adventure/face_danger"],
    },
  },
  {
    name: "a link with a pre-0.1 id",
    rules: "classic",
    markdown: "[Out of Supply](datasworn:classic/moves/suffer/out_of_supply)",
    expected: {
      text: "Out of Supply",
      buttons: ["Out of Supply"],
      opens: ["Out of Supply", "move:classic/suffer/out_of_supply"],
    },
  },
  {
    name: "a link to an item these rules don't have",
    rules: "classic",
    markdown: "See [Nowhere](datasworn:move:classic/adventure/nowhere).",
    expected: { text: "See Nowhere." },
  },
  {
    name: "a link to an atlas entry",
    rules: "classic",
    markdown:
      "Near the [Tempest Hills](datasworn:atlas_entry:classic/ironlands/tempest_hills).",
    expected: { text: "Near the Tempest Hills." },
  },
  {
    name: "a web link",
    markdown: "See [the site](https://www.ironswornrpg.com).",
    expected: {
      text: "See the site.",
      links: [["the site", "https://www.ironswornrpg.com"]],
    },
  },
  {
    name: "an email link",
    markdown: "[Write in](mailto:someone@example.com)",
    expected: {
      text: "Write in",
      links: [["Write in", "mailto:someone@example.com"]],
    },
  },
  {
    name: "a relative link",
    markdown: "[Your games](/games)",
    expected: { text: "Your games" },
  },
  {
    name: "a link in another scheme",
    markdown: "[A file](ftp://example.com/file)",
    // changes.md row 21: RulesText links only http(s) and mailto;
    // MarkdownRenderer linked any URL.
    expected: { text: "A file" },
  },
  {
    name: "a Datasworn link with links turned off",
    rules: "classic",
    disableLinks: true,
    markdown: "[Face Danger](datasworn:move:classic/adventure/face_danger)",
    expected: { text: "Face Danger" },
  },
  {
    name: "a web link with links turned off",
    disableLinks: true,
    markdown: "[the site](https://www.ironswornrpg.com)",
    expected: { text: "the site" },
  },
  {
    name: "a table macro naming a loaded table",
    rules: "classic",
    markdown:
      "Roll on the table.\n\n{{table>move.oracle_rollable:classic/fate/pay_the_price.pay_the_price}}",
    // The app draws nothing here: a move's tables come from MoveOracles,
    // and outcome text (roll results, the log) repeats the macros.
    expected: { text: "Roll on the table." },
    // With resolveOracle, RulesText draws the table (and its rows, one of
    // which links Ask the Oracle) here.
    withOracles: { text: undefined, tables: 1, buttons: ["Ask the Oracle"] },
  },
  {
    name: "a table macro in its colon form",
    rules: "classic",
    markdown:
      "Roll on the table.\n\n{{table:move.oracle_rollable:classic/fate/pay_the_price.pay_the_price}}",
    expected: { text: "Roll on the table." },
    withOracles: { text: undefined, tables: 1, buttons: ["Ask the Oracle"] },
  },
  {
    name: "a column table macro",
    rules: "classic",
    markdown:
      "Roll on the tables.\n\n{{table_columns>move:delve/delve/delve_the_depths}}",
    expected: { text: "Roll on the tables." },
  },
  {
    name: "a table macro whose table is not loaded",
    rules: "elegy",
    markdown:
      "Roll on the table.\n\n{{table>move.oracle_rollable:starforged/suffer/withstand_damage.withstand_damage}}",
    expected: { text: "Roll on the table." },
  },
  {
    name: "an indented table macro with a list under it",
    rules: "elegy",
    markdown:
      "Roll on the list below:\n\n  {{table>move.oracle_rollable:elegy/adventure/perform_ritual.perform_ritual}}\n  - 1-20: The ritual fails\n  - 21-100: It works",
    expected: {
      text: "Roll on the list below: 1-20: The ritual fails 21-100: It works",
      listItems: ["1-20: The ritual fails", "21-100: It works"],
    },
    withOracles: { text: undefined, tables: 1 },
  },
  {
    name: "a table macro closed with four braces",
    rules: "starforged",
    markdown:
      "Roll on the table.\n\n{{table>move.oracle_rollable:fe_runners/exploration/reveal_danger.reveal_danger}}}}",
    // A typo in FE Runners' data, shown as it is.
    expected: {
      text: "Roll on the table. {{table>move.oracle_rollable:fe_runners/exploration/reveal_danger.reveal_danger}}}}",
    },
  },
  {
    name: "a macro inside a sentence",
    markdown: "Roll {{text>oracle_rollable:starforged/core/action}} now.",
    expected: {
      text: "Roll {{text>oracle_rollable:starforged/core/action}} now.",
    },
  },
];

interface RenderOptions {
  disableLinks?: boolean;
  onOpen: (id: string) => void;
}

type Renderer = (markdown: string, options: RenderOptions) => ReactElement;

// Rules text as the app renders it.
const renderAppRulesText: Renderer = (markdown, options) => (
  <DataswornLinkHandlerProvider onOpen={options.onOpen}>
    <RulesText markdown={markdown} disableLinks={options.disableLinks} />
  </DataswornLinkHandlerProvider>
);

// Rules text on a page that draws the tables its macros name.
const renderWithOracles: Renderer = (markdown, options) => (
  <DataswornLinkHandlerProvider onOpen={options.onOpen}>
    <RulesText
      markdown={markdown}
      disableLinks={options.disableLinks}
      resolveOracle={getOracleRollable}
    />
  </DataswornLinkHandlerProvider>
);

const RENDERERS: Array<[string, Renderer, boolean]> = [
  ["RulesText in the app", renderAppRulesText, false],
  ["RulesText with an oracle lookup", renderWithOracles, true],
];

function normalize(text: string | null) {
  return (text ?? "").replace(/\s+/g, " ").trim();
}

// Loaded on demand in the app; loaded up front here so every render has it.
beforeAll(async () => {
  await loadLegacyIdMap();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe.each(RENDERERS)("%s", (_name, renderer, withOracles) => {
  it.each(CASES.map((testCase) => [testCase.name, testCase] as const))(
    "renders %s",
    (_caseName, testCase) => {
      loadRules(RULESETS[testCase.rules ?? "classic"]);
      const expected: Expected = {
        ...testCase.expected,
        ...(withOracles ? testCase.withOracles : undefined),
      };
      const onOpen = vi.fn();
      vi.spyOn(console, "warn").mockImplementation(() => {});

      const { container } = render(
        renderer(testCase.markdown, {
          disableLinks: testCase.disableLinks,
          onOpen,
        }),
      );

      if (expected.text !== undefined) {
        expect(normalize(container.textContent)).toBe(expected.text);
      }
      expect(
        screen.queryAllByRole("button").map((button) => button.textContent),
      ).toEqual(expected.buttons ?? []);
      expect(
        screen
          .queryAllByRole("link")
          .map((link) => [link.textContent, link.getAttribute("href")]),
      ).toEqual(expected.links ?? []);
      expect(screen.queryAllByRole("table")).toHaveLength(expected.tables ?? 0);
      if (expected.listItems) {
        const list = screen.getByRole("list");
        expect(
          within(list)
            .getAllByRole("listitem")
            .map((item) => normalize(item.textContent)),
        ).toEqual(expected.listItems);
      }
      if (expected.strong) {
        expect(
          [...container.querySelectorAll("strong, b")].map(
            (element) => element.textContent,
          ),
        ).toEqual(expected.strong);
      }
      if (expected.opens) {
        const [buttonName, id] = expected.opens;
        fireEvent.click(screen.getByRole("button", { name: buttonName }));
        expect(onOpen).toHaveBeenCalledWith(id);
      }
    },
  );
});
