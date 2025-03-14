import { PageWrapper } from "@/components/layout/PageWrapper";
import { lazy } from "react";
import { Route, Switch } from "wouter";

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
          <GameLayout />
        </Route>

        <Route>404</Route>
      </Switch>
    </GameLoadWrapper>
  );
}
