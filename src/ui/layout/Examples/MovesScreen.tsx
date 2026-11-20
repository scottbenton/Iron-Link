import type { Datasworn } from "@datasworn-community/core";

import { Stack } from "ui/primitives";

import { classicRules, starforgedRules } from "../../docs/fixtures/datasworn";
import { MoveListItem } from "../../game/MoveListItem";
import { SectionHeading } from "../SectionHeading";
import { PhoneRuleset, referenceStyles } from "./phoneGameScreens";

type LooseCategory = {
  name: string;
  contents: Record<string, Datasworn.AnyMove>;
};

function getMoveCategories(ruleset: PhoneRuleset): LooseCategory[] {
  const rules = ruleset === "ironsworn" ? classicRules : starforgedRules;
  return Object.values(rules.moves as Record<string, LooseCategory>);
}

export function MovesScreen(props: { ruleset: PhoneRuleset }) {
  return (
    <Stack gap="5" className={referenceStyles}>
      {getMoveCategories(props.ruleset).map((category) => (
        <Stack key={category.name} gap="1" as="section">
          <SectionHeading title={category.name} as="h3" />
          {Object.values(category.contents).map((move) => (
            <MoveListItem key={move._id} move={move} />
          ))}
        </Stack>
      ))}
    </Stack>
  );
}
