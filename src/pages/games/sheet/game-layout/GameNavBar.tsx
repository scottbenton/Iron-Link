import { NavBar } from "@/components/layout/NavBar";
import { useLayoutTranslations } from "@/hooks/i18n/useLayoutTranslations";
import {
  useCharacterIdOptional,
  useSetCharacterId,
} from "@/hooks/useCharacterId";
import { pageConfig } from "@/pages/pageConfig";
import { useConfirm } from "@/providers/ConfirmProvider";
import { useGameStore } from "@/stores/game.store";
import { useGameCharacter } from "@/stores/gameCharacters.store";
import { IconButton } from "@chakra-ui/react";
import { ChevronLeft } from "lucide-react";
import { Link } from "wouter";

import { CharacterSettingsMenuDialogs } from "./components/settings/CharacterSettingsMenuDialogs";
import { CharacterSettingsMenuItems } from "./components/settings/CharacterSettingsMenuItems";
import { GameSettingsMenuDialogs } from "./components/settings/GameSettingsMenuDialogs";
import { GameSettingsMenuItems } from "./components/settings/GameSettingsMenuItems";

export function GameNavBar() {
  const t = useLayoutTranslations();

  const gameName = useGameStore((store) => store.game?.name ?? "");
  const characterName = useGameCharacter((character) => character?.name ?? "");
  const characterId = useCharacterIdOptional();
  const setCharacterId = useSetCharacterId();

  const confirm = useConfirm();

  return (
    <NavBar
      pageTitle={characterId ? characterName : gameName}
      backAction={
        characterId ? (
          <IconButton
            onClick={() => setCharacterId(null)}
            variant="ghost"
            colorPalette={"gray"}
            aria-label={t("back-button", "Back")}
          >
            <ChevronLeft />
          </IconButton>
        ) : (
          <IconButton
            asChild
            variant="ghost"
            colorPalette={"gray"}
            aria-label={t("back-button", "Back")}
          >
            <Link to={pageConfig.gameSelect}>
              <ChevronLeft />
            </Link>
          </IconButton>
        )
      }
      settings={{
        menuItems: (
          <>
            <CharacterSettingsMenuItems confirm={confirm} />
            <GameSettingsMenuItems confirm={confirm} />
          </>
        ),
        dialogs: (
          <>
            <CharacterSettingsMenuDialogs />
            <GameSettingsMenuDialogs />
          </>
        ),
      }}
    />
  );
}
