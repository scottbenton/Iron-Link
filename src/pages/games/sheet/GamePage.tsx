import { PageWrapper } from "@/components/layout/PageWrapper";
import { lazy } from "react";
import { Route, Switch } from "wouter";

import { CharacterOverviewContent } from "./components/character/CharacterOverviewContent";
import { GameOverviewContent } from "./components/overview/GameOverviewContent";
import { GameLayout } from "./game-layout/GameLayout";
import { GameLoadWrapper } from "./game-layout/GameLoadWrapper";

const GameCharacterCreatePage = lazy(
  () => import("../createCharacter/CreateCharacterPage"),
);

export default function GamePage() {
  return (
    <GameLoadWrapper>
      <Switch>
        <Route path="/create">
          <PageWrapper requiresAuth lazy={GameCharacterCreatePage} />
        </Route>
        <Route path="/">
          <GameLayout>
            <GameOverviewContent />
          </GameLayout>
        </Route>
        <Route path="/c/:characterId">
          <GameLayout>
            <CharacterOverviewContent />
          </GameLayout>
        </Route>

        <Route>404</Route>
      </Switch>
    </GameLoadWrapper>
  );
}
