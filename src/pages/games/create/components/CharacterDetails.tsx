import { Box } from "@mui/material";
import { useMemo } from "react";

import {
  OracleTextField,
  OracleTextFieldOracleConfig,
} from "components/datasworn/OracleTextField";

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
    tableIds: [
      "oracle_rollable:classic/name/ironlander/a",
      "oracle_rollable:classic/name/ironlander/b",
    ],
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
  const name = useCreateCharacterStore((store) => store.characterName);
  const portrait = useCreateCharacterStore((store) => store.portrait);

  const setName = useCreateCharacterStore((store) => store.setCharacterName);
  const setPortrait = useCreateCharacterStore(
    (store) => store.setPortraitSettings,
  );

  const rulesets = useDataswornTree();

  const activeNameOracles = useMemo(() => {
    const oracles: OracleTextFieldOracleConfig = {
      tableIds: [],
    };
    Object.keys(rulesets).forEach((ruleset) => {
      if (rulesets[ruleset] && nameOracles[ruleset]) {
        oracles.tableIds.push(nameOracles[ruleset]);
      }
    });
    return oracles;
  }, [rulesets]);

  return (
    <Box display={"flex"} alignItems={"center"} mt={1}>
      <ImageInput
        characterName={name}
        value={portrait}
        onChange={setPortrait}
      />
      <OracleTextField
        oracleConfig={activeNameOracles}
        label={"Character Name"}
        fullWidth
        color={"primary"}
        value={name}
        onChange={setName}
        sx={{ maxWidth: 350, ml: 2 }}
      />
    </Box>
  );
}
