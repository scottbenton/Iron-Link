import type { Datasworn } from "@datasworn-community/core";

import { Stack } from "ui/primitives";

import { classicRules, starforgedRules } from "../../docs/fixtures/datasworn";
import { OracleListItem } from "../../game/OracleListItem";
import type { RollData } from "../../game/RollCard";
import { SectionHeading } from "../SectionHeading";
import { PhoneRuleset, referenceStyles } from "./phoneGameScreens";

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

export function OraclesScreen(props: {
  ruleset: PhoneRuleset;
  onRoll: (roll: RollData) => void;
}) {
  return (
    <Stack gap="5" className={referenceStyles}>
      {getOracleCollections(props.ruleset).map((collection) => (
        <Stack key={collection.name} gap="1" as="section">
          <SectionHeading title={collection.name} as="h3" />
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
