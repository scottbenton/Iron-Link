import { Box } from "@mui/material";
import { useMemo } from "react";

import {
  OracleTextField,
  OracleTextFieldOracleConfig,
} from "components/datasworn/OracleTextField";

import { useCreateCharacterStore } from "stores/createCharacter.store";
import { useDataswornTree } from "stores/dataswornTree.store";

import { ironswornId, starforgedId } from "data/datasworn.packages";

import { ImageInput } from "./ImageInput";

const nameOracles: Record<string, OracleTextFieldOracleConfig> = {
  [ironswornId]: {
    tableIds: [
      "oracle_rollable:classic/name/ironlander/a",
      "oracle_rollable:classic/name/ironlander/b",
    ],
  },
  [starforgedId]: {
    tableIds: [
      "oracle_rollable:starforged/character/name/given_name",
      "oracle_rollable:starforged/character/name/family_name",
    ],
    joinTables: true,
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
    if (rulesets[ironswornId]) {
      oracles.tableIds.push(nameOracles[ironswornId]);
    }
    if (rulesets[starforgedId]) {
      oracles.tableIds.push(nameOracles[starforgedId]);
    }
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
