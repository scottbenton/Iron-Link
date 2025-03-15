import { lazy } from "react";
import { Route, Switch } from "wouter";

import { NavBar } from "./components/layout/NavBar";
import { PageWrapper } from "./components/layout/PageWrapper";
import { Toaster } from "./components/ui/toaster";
import { useListenToAuth } from "./stores/auth.store";

const AuthPage = lazy(() => import("./pages/auth/AuthPage"));
const GameSelectPage = lazy(
  () => import("./pages/games/select/GameSelectPage"),
);
const GameCreatePage = lazy(
  () => import("./pages/games/create/GameCreatePage"),
);
const GamePage = lazy(() => import("./pages/games/sheet/GamePage"));

function App() {
  useListenToAuth();
  return (
    <>
      <Switch>
        <Route path={"/games/create"}>
          <NavBar />
          <PageWrapper lazy={GameCreatePage} requiresAuth />
        </Route>
        <Route path={"/games/:gameId"} nest>
          <PageWrapper lazy={GamePage} />
        </Route>
        <Route>
          <NavBar />
          <Switch>
            <Route path={"/"}>Home</Route>
            <Route path={"/auth"}>
              <PageWrapper lazy={AuthPage} />
            </Route>
            <Route path={"/games"}>
              <PageWrapper lazy={GameSelectPage} requiresAuth />
            </Route>
            <Route>404</Route>
          </Switch>
        </Route>
      </Switch>
      <Toaster />
    </>
  );
}

export default App;
