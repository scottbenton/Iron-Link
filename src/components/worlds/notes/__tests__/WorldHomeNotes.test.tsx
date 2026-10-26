import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { RichTextContentRepository } from "repositories/richTextContent.repository";

import type { RichTextContentStore } from "services/richTextContent.service";
import type { RoomKeySource } from "services/roomKeys.service";
import { WorldsService } from "services/worlds.service";

import { translate } from "../../categories/__tests__/fixtures";
import { WorldHomeNotes } from "../WorldHomeNotes";

vi.mock("lib/supabase.lib", () => ({ supabase: {} }));
vi.mock("stores/auth.store", () => ({
  useUID: () => "author",
  useAuthStore: { getState: () => ({ token: "token" }) },
}));
vi.mock("react-i18next", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react-i18next")>()),
  useTranslation: () => ({ t: translate }),
}));

// The collaborative editor needs WebRTC; the stand-in shows what it was given.
vi.mock("components/RichTextEditor", () => ({
  RtcRichTextEditor: ({
    id,
    roomPrefix,
    roomKeySource,
    initialValue,
    contentStore,
  }: {
    id: string;
    roomPrefix: string;
    roomKeySource: RoomKeySource;
    initialValue: Uint8Array;
    contentStore?: RichTextContentStore;
  }) => (
    <div data-testid="rich-text">
      {`${roomPrefix}-${id}: ${initialValue.length} bytes, key ${JSON.stringify(roomKeySource)}`}
      {contentStore && (
        <>
          <button
            onClick={() =>
              contentStore.write(new Uint8Array([7, 8]), "text", "v1")
            }
          >
            Save document
          </button>
          <button
            onClick={() =>
              contentStore.writeBeacon(new Uint8Array([9]), "text", "v1")
            }
          >
            Save while closing
          </button>
        </>
      )}
    </div>
  ),
}));

beforeEach(() => {
  vi.restoreAllMocks();
  vi.spyOn(WorldsService, "getWorldNotesContent").mockResolvedValue(
    new Uint8Array(),
  );
});

describe("WorldHomeNotes", () => {
  it("lets owners, editors and Guides edit the world's Notes", async () => {
    const user = userEvent.setup();
    const save = vi
      .spyOn(RichTextContentRepository, "writeIfUnchanged")
      .mockResolvedValue("v2");
    const beacon = vi
      .spyOn(RichTextContentRepository, "writeIfUnchangedBeacon")
      .mockReturnValue();
    render(<WorldHomeNotes worldId="world-a" canEdit onError={vi.fn()} />);
    const notes = await screen.findByRole("region", { name: "Overview" });
    expect(within(notes).getByTestId("rich-text")).toHaveTextContent(
      'world-notes-world-a: 0 bytes, key {"worldId":"world-a"}',
    );
    await user.click(
      within(notes).getByRole("button", { name: "Save document" }),
    );
    const target = { table: "worlds", column: "notes_content" };
    expect(save).toHaveBeenCalledWith(
      target,
      "world-a",
      { notes_content: "\\x0708" },
      "v1",
    );
    await user.click(
      within(notes).getByRole("button", { name: "Save while closing" }),
    );
    expect(beacon).toHaveBeenCalledWith(
      "token",
      target,
      "world-a",
      { notes_content: "\\x09" },
      "v1",
    );
  });

  it("shows players the Notes without saving", async () => {
    vi.mocked(WorldsService.getWorldNotesContent).mockResolvedValue(
      new Uint8Array([1, 2, 3]),
    );
    render(
      <WorldHomeNotes worldId="world-a" canEdit={false} onError={vi.fn()} />,
    );
    const notes = await screen.findByRole("region", { name: "Overview" });
    expect(within(notes).getByTestId("rich-text")).toHaveTextContent("3 bytes");
    expect(
      within(notes).queryByRole("button", { name: "Save document" }),
    ).not.toBeInTheDocument();
  });

  it("hides empty Notes from players", async () => {
    render(
      <WorldHomeNotes worldId="world-a" canEdit={false} onError={vi.fn()} />,
    );
    await waitFor(() =>
      expect(WorldsService.getWorldNotesContent).toHaveBeenCalledWith(
        "world-a",
      ),
    );
    await waitFor(() =>
      expect(
        screen.queryByRole("region", { name: "Overview" }),
      ).not.toBeInTheDocument(),
    );
  });

  it("says so when the Notes cannot load", async () => {
    vi.mocked(WorldsService.getWorldNotesContent).mockRejectedValue(
      new Error("offline"),
    );
    render(<WorldHomeNotes worldId="world-a" canEdit onError={vi.fn()} />);
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Could not load the world's overview. Please reopen the world to try again.",
    );
  });
});
