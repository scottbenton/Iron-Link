import { NavBar } from "@/components/layout/NavBar";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { useLayoutTranslations } from "@/hooks/i18n/useLayoutTranslations";
import { IconButton } from "@chakra-ui/react";
import { ChevronLeft } from "lucide-react";
import { lazy } from "react";
import { Link, Route, Switch } from "wouter";

import { GameLayout } from "./game-layout/GameLayout";
import { GameLoadWrapper } from "./game-layout/GameLoadWrapper";
import { GameNavBar } from "./game-layout/GameNavBar";

const GameCharacterCreatePage = lazy(
  () => import("../createCharacter/CreateCharacterPage"),
);

export default function GamePage() {
  const t = useLayoutTranslations();
  return (
    <GameLoadWrapper>
      <Switch>
        <Route path="/create">
          <NavBar
            backAction={
              <IconButton
                asChild
                variant="ghost"
                colorPalette={"gray"}
                aria-label={t("back-button", "Back")}
              >
                <Link to={"/"}>
                  <ChevronLeft />
                </Link>
              </IconButton>
            }
            pageTitle={t("mobile-page-title", "Create Character")}
          />
          <PageWrapper requiresAuth lazy={GameCharacterCreatePage} />
        </Route>
        <Route path="/">
          <GameNavBar />
          <GameLayout />
        </Route>

        <Route>404</Route>
      </Switch>
    </GameLoadWrapper>
  );
}
