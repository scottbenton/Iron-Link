import "@fontsource-variable/figtree/wght-italic.css";
import "@fontsource-variable/figtree/wght.css";
import "@fontsource/barlow-condensed/600.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import App from "./App.tsx";
import "./lib/i18n.ts";
import { Providers } from "./providers/Providers.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Providers>
      <App />
    </Providers>
  </StrictMode>,
);
