import "@fontsource-variable/inter";
import "@fontsource/barlow-condensed/600.css";
import { App } from "App";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { Providers } from "providers/Providers.tsx";

import { ErrorBoundary } from "components/ErrorBoundary";

import "i18n/config";

import "./App.css";

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <StrictMode>
      <Providers>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </Providers>
    </StrictMode>
  </ErrorBoundary>,
);
