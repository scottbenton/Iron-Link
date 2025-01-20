import { LinearProgress } from "@mui/material";
import { Suspense, lazy } from "react";
import { Route, Routes } from "react-router";

import { BaseLayout } from "components/Layout/BaseLayout";
import { DefaultLayout } from "components/Layout/DefaultLayout";

import { Page404 } from "pages/404Page/404Page";
import { ErrorRoute } from "pages/ErrorRoute";

import { useListenToAuth } from "stores/auth.store";

const HomePage = lazy(() => import("./pages/home/HomePage"));
const GameSelectPage = lazy(
  () => import("./pages/games/selectPage/GameSelectPage"),
);
const GameCreatePage = lazy(
  () => import("./pages/games/create/CreateGamePage"),
);
const WorldSelectPage = lazy(() => import("./pages/worlds/WorldSelectPage"));
const HomebrewSelectPage = lazy(
  () => import("./pages/homebrew/HomebrewSelectPage"),
);
const AuthPage = lazy(() => import("./pages/auth/AuthPage"));
const GameJoinPage = lazy(() => import("./pages/games/join/GameJoinPage"));

const GameLayout = lazy(
  () => import("./pages/games/gamePageLayout/GameLayout"),
);
const GameOverviewPage = lazy(
  () => import("./pages/games/overviewSheet/GameOverviewSheet"),
);
const GameCharacterSheetPage = lazy(
  () => import("./pages/games/characterSheet/CharacterSheetPage"),
);
const GameCharacterCreatePage = lazy(
  () => import("./pages/games/addCharacter/AddCharacter"),
);

export function App() {
  useListenToAuth();

  return (
    <>
      <Suspense fallback={<LinearProgress />}>
        <Routes>
          <Route Component={BaseLayout} errorElement={<ErrorRoute />}>
            <Route Component={DefaultLayout}>
              <Route index Component={HomePage} />
              <Route path="/games" Component={GameSelectPage} />
              <Route path="/games/create" Component={GameCreatePage} />
              <Route path="/games/:gameId/join" Component={GameJoinPage} />
              <Route path="/worlds" Component={WorldSelectPage} />
              <Route path="/homebrew" Component={HomebrewSelectPage} />
              <Route path="/auth" Component={AuthPage} />
              <Route path="*" Component={Page404} />
            </Route>
            <Route Component={GameLayout} path="/games/:gameId">
              <Route index Component={GameOverviewPage} />
              <Route path="c/:characterId" Component={GameCharacterSheetPage} />
              <Route path="create" Component={GameCharacterCreatePage} />
            </Route>
          </Route>
        </Routes>
      </Suspense>
    </>
  );
}
