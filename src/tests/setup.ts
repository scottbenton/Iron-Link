import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, beforeEach, vi } from "vitest";

import "i18n/config";

// jsdom has no scrollBy, which tab strips use to keep the current tab in view.
if (typeof Element !== "undefined") Element.prototype.scrollBy ??= () => {};

beforeEach(() => {
  vi.mock(
    "../components/pages/games/characterSheet/hooks/useCharacterId",
    () => ({
      useCharacterId: vi.fn(),
      useCharacterIdOptional: vi.fn(),
    }),
  );
  vi.mock("../components/pages/games/gamePageLayout/hooks/useGameId", () => ({
    useGameId: vi.fn(),
    useGameIdOptional: vi.fn(),
  }));
});

afterEach(() => {
  cleanup();
});
