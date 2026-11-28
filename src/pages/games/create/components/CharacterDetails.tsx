import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import {
  OracleTextFieldOracleConfig,
  useOracleTextFieldRoll,
} from "components/datasworn/OracleTextField";

import { TextField } from "ui/components/TextField";
import { OracleTextField } from "ui/game/OracleTextField";
import { Box, Flex } from "ui/primitives";

import { useCreateCharacterStore } from "stores/createCharacter.store";
import { useDataswornTree } from "stores/dataswornTree.store";

import {
  elegyRulesetConfig,
  ironswornRulesetConfig,
  starforgedRulesetConfig,
} from "data/package.config";

import { ImageInput } from "./ImageInput";

const nameOracles: Record<string, OracleTextFieldOracleConfig> = {
  [ironswornRulesetConfig.id]: {
    tableIds: ["oracle_rollable:classic/name/ironlander"],
  },
  [starforgedRulesetConfig.id]: {
    tableIds: [
      "oracle_rollable:starforged/character/name/given_name",
      "oracle_rollable:starforged/character/name/family_name",
    ],
    joinTables: true,
  },
  [elegyRulesetConfig.id]: {
    tableIds: [
      "oracle_rollable:elegy/name/male",
      "oracle_rollable:elegy/name/female",
    ],
    joinTables: false,
  },
};

export function CharacterDetails() {
  const { t } = useTranslation();
  const name = useCreateCharacterStore((store) => store.characterName);
  const portrait = useCreateCharacterStore((store) => store.portrait);

  const setName = useCreateCharacterStore((store) => store.setCharacterName);
  const setPortrait = useCreateCharacterStore(
    (store) => store.setPortraitSettings,
  );

  const rulesets = useDataswornTree();

  const activeNameOracles = useMemo(() => {
    const oracles: OracleTextFieldOracleConfig = { tableIds: [] };
    Object.keys(rulesets).forEach((ruleset) => {
      if (rulesets[ruleset] && nameOracles[ruleset]) {
        oracles.tableIds.push(nameOracles[ruleset]);
      }
    });
    return oracles;
  }, [rulesets]);

  const { canRoll, roll } = useOracleTextFieldRoll(activeNameOracles);

  const label = t("character.create.character-name", "Character Name");

  return (
    <Flex alignItems="center" gap="4" flexWrap="wrap">
      <ImageInput
        characterName={name}
        value={portrait}
        onChange={setPortrait}
      />
      <Box flex="1 1 220px" maxWidth="350px">
        {canRoll ? (
          <OracleTextField
            label={label}
            value={name}
            onValueChange={setName}
            oracleName={label}
            rollLabel={t(
              "datasworn.consult-the-oracle-for",
              "Consult the Oracle for {{label}}",
              { label },
            )}
            // A roll that finds nothing still clears the field (changes.md
            // row 38 proposes leaving it as it is).
            onRoll={() => roll() ?? ""}
          />
        ) : (
          <TextField label={label} value={name} onValueChange={setName} />
        )}
      </Box>
    </Flex>
  );
}
