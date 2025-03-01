import { lazy } from "react";
import { Route, Switch } from "wouter";

import { NavBar } from "./components/layout/NavBar";
import { PageWrapper } from "./components/layout/PageWrapper";
import { Toaster } from "./components/ui/toaster";
import { pageConfig } from "./pages/pageConfig";
import { useListenToAuth } from "./stores/auth.store";

const AuthPage = lazy(() => import("./pages/auth/AuthPage"));
const GameSelectPage = lazy(
  () => import("./pages/games/select/GameSelectPage"),
);
const GameCreatePage = lazy(
  () => import("./pages/games/create/GameCreatePage"),
);

function App() {
  useListenToAuth();
  return (
    <>
      <NavBar />
      <Switch>
        <Route path={pageConfig.home}>Home</Route>
        <Route path={pageConfig.auth}>
          <PageWrapper lazy={AuthPage} />
        </Route>
        <Route path={pageConfig.gameSelect}>
          <PageWrapper lazy={GameSelectPage} requiresAuth />
        </Route>
        <Route path={pageConfig.gameCreate}>
          <PageWrapper lazy={GameCreatePage} requiresAuth />
        </Route>
        <Route>404</Route>
      </Switch>
      <Toaster />
    </>
  );
}

export default App;
