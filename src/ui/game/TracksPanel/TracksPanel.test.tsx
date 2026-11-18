import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { AnnouncerProvider } from "../../components/Announcer";
import { TrackDialog } from "./TrackDialog";
import { TracksPanel, TracksPanelProps } from "./TracksPanel";
import type { ConnectionItem, TrackItem } from "./tracksPanelTypes";

const tracks: TrackItem[] = [
  {
    id: "crown",
    kind: "vow",
    label: "Recover the Hollow Crown",
    rank: "formidable",
    ticks: 12,
  },
  {
    id: "floods",
    kind: "clock",
    label: "The archive floods",
    segments: 6,
    value: 6,
  },
  {
    id: "courier",
    kind: "vow",
    label: "Find the missing courier",
    rank: "dangerous",
    ticks: 40,
    completed: true,
  },
];

const connections: ConnectionItem[] = [
  {
    id: "sera",
    label: "Sera Kade",
    rank: "troublesome",
    ticks: 9,
    bonded: false,
  },
  {
    id: "ash",
    label: "Mother Ash",
    rank: "formidable",
    ticks: 28,
    bonded: true,
  },
];

function renderPanel(props: Partial<TracksPanelProps> = {}) {
  const announce = vi.fn();
  const view = render(
    <AnnouncerProvider announce={announce}>
      <TracksPanel tracks={tracks} {...props} />
    </AnnouncerProvider>,
  );
  return { ...view, announce };
}

describe("TracksPanel", () => {
  it("hides completed tracks until Show Completed", async () => {
    const user = userEvent.setup();
    renderPanel();
    expect(screen.queryByText("Find the missing courier")).toBeNull();
    // The label: jsdom has no PointerEvent for a press on the box itself.
    await user.click(screen.getByText("Show Completed"));
    expect(screen.getByText("Find the missing courier")).toBeInTheDocument();
  });

  it("says how many are hidden when none are active", () => {
    renderPanel({ tracks: [tracks[2]] });
    expect(screen.getByText("No active tracks")).toBeInTheDocument();
    expect(
      screen.getByText(
        "One completed track is hidden. Tick Show Completed to see it.",
      ),
    ).toBeInTheDocument();
  });

  it("adds a kind of track from Add Track", async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn();
    renderPanel({ onAdd });
    await user.click(screen.getByRole("button", { name: "Add Track" }));
    await user.click(await screen.findByRole("menuitem", { name: "Clock" }));
    expect(onAdd).toHaveBeenCalledExactlyOnceWith("clock");
  });

  it("completes a track from its menu and announces it", async () => {
    const user = userEvent.setup();
    const onCompletedChange = vi.fn();
    const { announce } = renderPanel({ onCompletedChange });
    await user.click(
      screen.getByRole("button", {
        name: "Options for Recover the Hollow Crown",
      }),
    );
    await user.click(
      await screen.findByRole("menuitem", { name: "Complete Track" }),
    );
    expect(onCompletedChange).toHaveBeenCalledExactlyOnceWith("crown", true);
    expect(announce).toHaveBeenCalledWith("Completed Recover the Hollow Crown");
  });

  it("asks before deleting", async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    renderPanel({ onDelete });
    await user.click(
      screen.getByRole("button", { name: "Options for The archive floods" }),
    );
    await user.click(
      await screen.findByRole("menuitem", { name: "Delete Clock" }),
    );
    expect(onDelete).not.toHaveBeenCalled();
    const dialog = await screen.findByRole("alertdialog");
    await user.click(
      within(dialog).getByRole("button", { name: "Delete Clock" }),
    );
    expect(onDelete).toHaveBeenCalledExactlyOnceWith("floods");
  });

  it("rolls a track's completion move by name", async () => {
    const user = userEvent.setup();
    const onRollMove = vi.fn();
    renderPanel({
      onRollMove,
      completionMoves: {
        vow: [{ id: "move:fulfill", name: "Fulfill Your Vow" }],
      },
    });
    await user.click(
      screen.getByRole("button", {
        name: "Fulfill Your Vow for Recover the Hollow Crown",
      }),
    );
    expect(onRollMove).toHaveBeenCalledExactlyOnceWith("crown", "move:fulfill");
  });

  it("won't roll a full clock's progress", () => {
    renderPanel({ onRollClock: vi.fn() });
    expect(
      screen.getByRole("button", {
        name: "Roll Progress for The archive floods",
      }),
    ).toBeDisabled();
  });

  it("leaves a viewer only the filters", () => {
    renderPanel({
      readOnly: true,
      onAdd: vi.fn(),
      onTicksChange: vi.fn(),
      onEdit: vi.fn(),
      connections,
    });
    // The Connections band toggles its section; nothing else is a button.
    expect(
      screen.getAllByRole("button").map((button) => button.textContent),
    ).toEqual(["Connections 1"]);
    expect(screen.getAllByRole("checkbox")).toHaveLength(2);
  });

  it("hides bonded connections until Show Bonded", async () => {
    const user = userEvent.setup();
    renderPanel({ connections });
    expect(screen.getByText("Sera Kade")).toBeInTheDocument();
    expect(screen.queryByText("Mother Ash")).toBeNull();
    await user.click(screen.getByText("Show Bonded"));
    expect(screen.getByText("Mother Ash")).toBeInTheDocument();
  });
});

describe("TrackDialog", () => {
  it("needs a title, then saves the form", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(<TrackDialog open onClose={() => {}} kind="vow" onSave={onSave} />);
    await user.click(screen.getByRole("button", { name: "Add Vow" }));
    expect(onSave).not.toHaveBeenCalled();
    expect(screen.getByText("Give it a title.")).toBeInTheDocument();
    await user.type(
      screen.getByRole("textbox", { name: /Title/ }),
      "Recover the Hollow Crown{Enter}",
    );
    expect(onSave).toHaveBeenCalledExactlyOnceWith({
      label: "Recover the Hollow Crown",
      description: "",
      rank: "dangerous",
      resetProgress: undefined,
    });
  });
});
