import "@fontsource-variable/inter";
import "@fontsource/barlow-condensed/600.css";
import { App } from "App";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { Providers } from "providers/Providers.tsx";

import "i18n/config";

import "./App.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Providers>
      <App />
    </Providers>
  </StrictMode>,
);
