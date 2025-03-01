import { ImageInput } from "@/components/common/ImageInput";
import {
  OracleTextField,
  OracleTextFieldOracleConfig,
} from "@/components/datasworn/OracleTextField";
import { ironswornId, starforgedId } from "@/data/datasworn.packages";
import { useCharacterCreateTranslations } from "@/hooks/i18n/useCharacterCreateTranslations";
import { useCreateCharacterStore } from "@/stores/createCharacter.store";
import { useDataswornTree } from "@/stores/dataswornTree.store";
import { Box } from "@chakra-ui/react";
import { useMemo } from "react";

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

export function CreateCharacterDetails() {
  const t = useCharacterCreateTranslations();

  const name = useCreateCharacterStore((store) => store.characterName);
  const setName = useCreateCharacterStore((store) => store.setCharacterName);

  const portrait = useCreateCharacterStore((store) => store.portrait);
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
    <Box display="flex" alignItems={"center"} flexWrap="wrap" gap={4} mt={2}>
      <ImageInput
        characterName={name}
        value={portrait}
        onChange={setPortrait}
      />
      <OracleTextField
        oracleConfig={activeNameOracles}
        label={t("character-name-input", "Character Name")}
        value={name}
        onChange={setName}
        maxW={350}
      />
    </Box>
  );
}
