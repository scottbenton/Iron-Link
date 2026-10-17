import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as Y from "yjs";

import type { RichTextContentStore } from "services/richTextContent.service";

import { readUnsavedState, stashUnsavedState } from "../saveMergedRichText";
import { useAutoSaveRtcEditor } from "../useAutosaveRtcEditor";

const providers = vi.hoisted(
  () => [] as { password: string; destroy: () => void; destroyed: boolean }[],
);

vi.mock("y-webrtc", async () => {
  const { Awareness } = await import("y-protocols/awareness");
  return {
    WebrtcProvider: class {
      awareness: InstanceType<typeof Awareness>;
      password: string;
      destroyed = false;
      constructor(_room: string, doc: Y.Doc, opts: { password: string }) {
        this.awareness = new Awareness(doc);
        this.password = opts.password;
        providers.push(this);
      }
      on() {}
      off() {}
      destroy() {
        this.destroyed = true;
      }
    },
  };
});

vi.mock("stores/auth.store", () => ({ useUID: () => "user-1" }));
vi.mock("stores/users.store", () => ({
  useUsersStore: (select: (store: { users: object }) => unknown) =>
    select({ users: {} }),
}));

function createStore(): RichTextContentStore {
  return {
    read: vi.fn(async () => ({ updatedAt: "v1" })),
    write: vi.fn(async () => "v2"),
    writeBeacon: vi.fn(),
  };
}

beforeEach(() => {
  providers.length = 0;
  localStorage.clear();
});
afterEach(() => {
  vi.restoreAllMocks();
});

describe("useAutoSaveRtcEditor", () => {
  it("edits on its own until the room key loads, then joins", async () => {
    const { result, rerender } = renderHook(
      ({ roomKey }: { roomKey: string | null | undefined }) =>
        useAutoSaveRtcEditor({
          documentId: "note-1",
          roomName: "notes-note-1",
          roomKey,
          initialValue: new Uint8Array(),
          contentStore: createStore(),
        }),
      { initialProps: { roomKey: undefined as string | null | undefined } },
    );
    await waitFor(() => expect(result.current.editor).not.toBeNull());
    expect(providers).toHaveLength(0);

    rerender({ roomKey: "key-1" });
    expect(providers.map((p) => p.password)).toEqual(["key-1"]);
  });

  it("rejoins with a rotated key without losing unsaved edits", async () => {
    const store = createStore();
    const { result, rerender } = renderHook(
      ({ roomKey }: { roomKey: string }) =>
        useAutoSaveRtcEditor({
          documentId: "note-1",
          roomName: "notes-note-1",
          roomKey,
          initialValue: new Uint8Array(),
          contentStore: store,
        }),
      { initialProps: { roomKey: "key-1" } },
    );
    await waitFor(() => expect(result.current.editor).not.toBeNull());
    act(() => {
      result.current.editor?.commands.insertContent("Unsaved edit");
    });

    rerender({ roomKey: "key-2" });
    await waitFor(() =>
      expect(result.current.editor?.getText()).toBe("Unsaved edit"),
    );
    expect(providers.map((p) => [p.password, p.destroyed])).toEqual([
      ["key-1", true],
      ["key-2", false],
    ]);
    expect(store.write).not.toHaveBeenCalled();
  });

  it("merges the stored state into the editor when it saves", async () => {
    const theirs = new Y.Doc();
    theirs.getXmlFragment("default").insert(0, [new Y.XmlElement("paragraph")]);
    (theirs.getXmlFragment("default").get(0) as Y.XmlElement).insert(0, [
      new Y.XmlText("Their edit"),
    ]);
    const store = createStore();
    vi.mocked(store.read).mockResolvedValue({
      updatedAt: "v1",
      content: Y.encodeStateAsUpdate(theirs),
    });
    const { result, unmount } = renderHook(() =>
      useAutoSaveRtcEditor({
        documentId: "note-1",
        roomName: "notes-note-1",
        roomKey: null,
        initialValue: new Uint8Array(),
        contentStore: store,
      }),
    );
    await waitFor(() => expect(result.current.editor).not.toBeNull());
    act(() => {
      result.current.editor?.commands.insertContent("My edit");
    });
    unmount();

    await waitFor(() => expect(store.write).toHaveBeenCalled());
    const saved = new Y.Doc();
    Y.applyUpdate(saved, vi.mocked(store.write).mock.calls[0][0]);
    expect(saved.getXmlFragment("default").toString()).toContain("Their edit");
    expect(saved.getXmlFragment("default").toString()).toContain("My edit");
  });

  it("keeps unsaved edits on the device on unload and saves them next time", async () => {
    const store = createStore();
    const { result, unmount } = renderHook(() =>
      useAutoSaveRtcEditor({
        documentId: "note-1",
        roomName: "notes-note-1",
        roomKey: null,
        initialValue: new Uint8Array(),
        contentStore: store,
      }),
    );
    await waitFor(() => expect(result.current.editor).not.toBeNull());
    act(() => {
      result.current.editor?.commands.insertContent("Before closing");
    });
    vi.spyOn(document, "visibilityState", "get").mockReturnValue("hidden");
    act(() => {
      window.dispatchEvent(new Event("beforeunload"));
    });
    expect(readUnsavedState("user-1", "note-1")).not.toBeNull();
    // Nothing has been saved this visit, so there is no version to guard a
    // write with; the kept state is merged in next time.
    expect(store.writeBeacon).not.toHaveBeenCalled();
    unmount();
  });

  it("recovers edits kept from an earlier visit", async () => {
    const earlier = new Y.Doc();
    earlier
      .getXmlFragment("default")
      .insert(0, [new Y.XmlElement("paragraph")]);
    (earlier.getXmlFragment("default").get(0) as Y.XmlElement).insert(0, [
      new Y.XmlText("Recovered"),
    ]);
    stashUnsavedState("user-1", "note-1", earlier);
    const store = createStore();
    const { result } = renderHook(() =>
      useAutoSaveRtcEditor({
        documentId: "note-1",
        roomName: "notes-note-1",
        roomKey: null,
        initialValue: new Uint8Array(),
        contentStore: store,
      }),
    );
    await waitFor(() =>
      expect(result.current.editor?.getText()).toBe("Recovered"),
    );
    await waitFor(() => expect(store.write).toHaveBeenCalled());
    await waitFor(() =>
      expect(readUnsavedState("user-1", "note-1")).toBeNull(),
    );
  });
});
