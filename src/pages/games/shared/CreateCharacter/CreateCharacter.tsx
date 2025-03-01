import { useCharacterCreateTranslations } from "@/hooks/i18n/useCharacterCreateTranslations";
import { Heading } from "@chakra-ui/react";

import { CreateCharacterAssets } from "./CreateCharacterAssets";
import { CreateCharacterDetails } from "./CreateCharacterDetails";
import { CreateCharacterStats } from "./CreateCharacterStats";

export function CreateCharacter() {
  const t = useCharacterCreateTranslations();
  return (
    <>
      <Heading>{t("character-details", "Character Details")}</Heading>
      <CreateCharacterDetails />

      <Heading mt={3}>{t("character-stats", "Character Stats")}</Heading>
      <CreateCharacterStats />

      <Heading mt={3}>{t("character-assets", "Assets")}</Heading>
      <CreateCharacterAssets />
    </>
  );
}
