import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { translate } from "components/worlds/categories/__tests__/fixtures";

import { useNotesStore } from "stores/notes.store";

import {
  ErrorNoun,
  ErrorReason,
  ErrorVerb,
  RepositoryError,
} from "repositories/errors/RepositoryErrors";

import { NoteView } from "../NoteView";

vi.mock("lib/supabase.lib", () => ({ supabase: {} }));
// Loaded through the notes store; jsdom cannot load audio.
vi.mock("lib/audio.lib", () => ({}));
vi.mock("react-i18next", async (original) => ({
  ...(await original<typeof import("react-i18next")>()),
  useTranslation: () => ({ t: translate }),
}));
vi.mock("pages/games/gamePageLayout/hooks/useGameId", () => ({
  useGameId: () => "game",
}));

describe("NoteView", () => {
  it("shows a message instead of crashing when the note cannot be read", async () => {
    useNotesStore.setState({
      getNoteContent: () =>
        Promise.reject(
          new RepositoryError(
            ErrorReason.Unknown,
            ErrorVerb.Read,
            ErrorNoun.Note,
            false,
          ),
        ),
    });

    render(<NoteView openNoteId="hidden" />);

    expect(
      await screen.findByText(/you may not have access to it/),
    ).toBeInTheDocument();
  });
});
