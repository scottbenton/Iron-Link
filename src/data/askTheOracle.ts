import { Datasworn } from "@datasworn/core";

import { AskTheOracle } from "repositories/tracks.repository";

export const source = {
  title: "Ironsworn: Starforged Rulebook",
  authors: [
    {
      name: "Shawn Tomkin",
    },
  ],
  date: "2022-05-06",
  license: "https://creativecommons.org/licenses/by/4.0",
  page: 229,
  url: "https://ironswornrpg.com",
};

export const askTheOracleCollection: Datasworn.OracleCollection = {
  _id: "oracle_collection:ironlink/ask_the_oracle",
  name: "Ask the Oracle",
  _source: source,
  oracle_type: "tables",
  type: "oracle_collection",

  collections: {},
  contents: {
    almost_certain: {
      _id: "oracle_rollable:ironlink/ask_the_oracle/almost_certain",
      _source: source,
      column_labels: {
        roll: "Roll",
        text: "Result",
      },
      type: "oracle_rollable",
      name: "Almost Certain",
      oracle_type: "table_text",
      dice: "1d100",
      match: {
        text: "On a match, envision an extreme result or twist.",
      },
      rows: [
        {
          _id: "oracle_rollable.row:ironlink/ask_the_oracle/almost_certain.0",
          roll: {
            min: 1,
            max: 90,
          },
          text: "Yes",
        },
        {
          _id: "oracle_rollable.row:ironlink/ask_the_oracle/almost_certain.1",
          roll: {
            min: 91,
            max: 100,
          },
          text: "No",
        },
      ],
    },
    likely: {
      _id: "oracle_rollable:ironlink/ask_the_oracle/likely",
      _source: source,
      column_labels: {
        roll: "Roll",
        text: "Result",
      },
      type: "oracle_rollable",
      name: "Likely",
      oracle_type: "table_text",
      dice: "1d100",
      match: {
        text: "On a match, envision an extreme result or twist.",
      },
      rows: [
        {
          _id: "oracle_rollable.row:ironlink/ask_the_oracle/likely.0",
          roll: {
            min: 1,
            max: 75,
          },
          text: "Yes",
        },
        {
          _id: "oracle_rollable.row:ironlink/ask_the_oracle/likely.1",
          roll: {
            min: 76,
            max: 100,
          },
          text: "No",
        },
      ],
    },
    fifty_fifty: {
      _id: "oracle_rollable:ironlink/ask_the_oracle/fifty_fifty",
      _source: source,
      column_labels: {
        roll: "Roll",
        text: "Result",
      },
      type: "oracle_rollable",
      name: "50/50",
      oracle_type: "table_text",
      dice: "1d100",
      match: {
        text: "On a match, envision an extreme result or twist.",
      },
      rows: [
        {
          _id: "oracle_rollable.row:ironlink/ask_the_oracle/fifty_fifty.0",
          roll: {
            min: 1,
            max: 50,
          },
          text: "Yes",
        },
        {
          _id: "oracle_rollable.row:ironlink/ask_the_oracle/fifty_fifty.1",
          roll: {
            min: 51,
            max: 100,
          },
          text: "No",
        },
      ],
    },
    unlikely: {
      _id: "oracle_rollable:ironlink/ask_the_oracle/unlikely",
      _source: source,
      column_labels: {
        roll: "Roll",
        text: "Result",
      },
      type: "oracle_rollable",
      name: "Unlikely",
      oracle_type: "table_text",
      dice: "1d100",
      match: {
        text: "On a match, envision an extreme result or twist.",
      },
      rows: [
        {
          _id: "oracle_rollable.row:ironlink/ask_the_oracle/unlikely.0",
          roll: {
            min: 1,
            max: 25,
          },
          text: "Yes",
        },
        {
          _id: "oracle_rollable.row:ironlink/ask_the_oracle/unlikely.1",
          roll: {
            min: 26,
            max: 100,
          },
          text: "No",
        },
      ],
    },
    small_chance: {
      _id: "oracle_rollable:ironlink/ask_the_oracle/small_chance",
      _source: source,
      column_labels: {
        roll: "Roll",
        text: "Result",
      },
      type: "oracle_rollable",
      name: "Small Chance",
      oracle_type: "table_text",
      dice: "1d100",
      match: {
        text: "On a match, envision an extreme result or twist.",
      },
      rows: [
        {
          _id: "oracle_rollable.row:ironlink/ask_the_oracle/small_chance.0",
          roll: {
            min: 1,
            max: 10,
          },
          text: "Yes",
        },
        {
          _id: "oracle_rollable.row:ironlink/ask_the_oracle/small_chance.1",
          roll: {
            min: 11,
            max: 100,
          },
          text: "No",
        },
      ],
    },
  },
};

export const askTheOracleIds = [
  askTheOracleCollection.contents.small_chance._id,
  askTheOracleCollection.contents.unlikely._id,
  askTheOracleCollection.contents.fifty_fifty._id,
  askTheOracleCollection.contents.likely._id,
  askTheOracleCollection.contents.almost_certain._id,
];

export const askTheOracleLabels: Record<string, string> = {};
Object.values(askTheOracleCollection.contents).forEach((oracle) => {
  askTheOracleLabels[oracle._id] = oracle.name;
});

export const askTheOracleEnumMap: Record<
  AskTheOracle,
  Datasworn.OracleRollable
> = {
  [AskTheOracle.AlmostCertain]: askTheOracleCollection.contents.almost_certain,
  [AskTheOracle.Likely]: askTheOracleCollection.contents.likely,
  [AskTheOracle.FiftyFifty]: askTheOracleCollection.contents.fifty_fifty,
  [AskTheOracle.Unlikely]: askTheOracleCollection.contents.unlikely,
  [AskTheOracle.SmallChance]: askTheOracleCollection.contents.small_chance,
};

export const ironLinkAskTheOracleRulesPackage: Datasworn.Ruleset = {
  _id: "ironlink",
  datasworn_version: "0.1.0",
  title: "Iron Link Ask the Oracle Oracles",
  type: "ruleset",
  authors: [],
  date: "2020-01-01",
  license: null,
  url: "https://ironswornrpg.com",
  oracles: {
    ask_the_oracle: askTheOracleCollection,
  },
  moves: {},
  assets: {},
  rules: {
    stats: {},
    condition_meters: {},
    impacts: {},
    special_tracks: {},
    tags: {},
  },
};
