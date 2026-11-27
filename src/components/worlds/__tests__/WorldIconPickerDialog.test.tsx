import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { IconColors } from "types/Icon.type";

import { WorldIconPickerDialog } from "../WorldIconPickerDialog";
import { translate } from "../categories/__tests__/fixtures";

vi.mock("react-i18next", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react-i18next")>()),
  useTranslation: () => ({ t: translate }),
}));

function renderDialog(
  props: Partial<Parameters<typeof WorldIconPickerDialog>[0]>,
) {
  const save = vi.fn();
  render(
    <WorldIconPickerDialog
      value={null}
      title="Choose entry icon"
      onSave={save}
      onClose={() => {}}
      {...props}
    />,
  );
  return save;
}

describe("WorldIconPickerDialog", () => {
  it("opens on the current icon and color so the color changes alone", async () => {
    const user = userEvent.setup();
    const save = renderDialog({
      value: { key: "GiVikingLonghouse", color: IconColors.Blue },
    });
    // Far down the full set, but it leads the grid so it is in view.
    expect(
      await screen.findByRole("button", { name: "Viking Longhouse" }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Blue" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await user.click(screen.getByRole("button", { name: "Red" }));
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(save).toHaveBeenCalledWith({
      key: "GiVikingLonghouse",
      color: IconColors.Red,
    });
  });

  it("opens on an inherited icon and keeps inheriting unless it changes", async () => {
    const user = userEvent.setup();
    const inherited = { key: "GiCompass", color: IconColors.Green };
    const unchanged = renderDialog({ inherited });
    expect(
      await screen.findByRole("button", { name: "Compass" }),
    ).toHaveAttribute("aria-pressed", "true");
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(unchanged).toHaveBeenCalledWith(null);
  });

  it("saves an inherited icon as the entry's own once its color changes", async () => {
    const user = userEvent.setup();
    const save = renderDialog({
      inherited: { key: "GiCompass", color: IconColors.Green },
    });
    await screen.findByRole("button", { name: "Compass" });
    await user.click(screen.getByRole("button", { name: "Purple" }));
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(save).toHaveBeenCalledWith({
      key: "GiCompass",
      color: IconColors.Purple,
    });
  });

  it("leads with the shortlist group that fits the category, in named sections", async () => {
    renderDialog({
      category: { name: "NPCs", supportsMap: false, supportsBonds: true },
    });
    const people = await screen.findByRole("group", { name: "People" });
    expect(
      within(people).getByRole("button", { name: "Groups" }),
    ).toBeInTheDocument();
    const sections = screen
      .getAllByRole("group")
      .map((group) => group.getAttribute("aria-labelledby"))
      .filter(Boolean)
      .map((id) => document.getElementById(id!)?.textContent);
    expect(sections.slice(0, 2)).toEqual(["People", "Places"]);
    // Nothing is left out: the full set follows the shortlist.
    expect(
      screen.getByRole("group", { name: "All icons" }),
    ).toBeInTheDocument();
  });

  it("offers an Image tab only when asked, leaving it open", async () => {
    const user = userEvent.setup();
    const { unmount } = render(
      <WorldIconPickerDialog
        value={null}
        title="Choose category icon"
        onSave={() => {}}
        onClose={() => {}}
      />,
    );
    expect(screen.queryByRole("tab")).not.toBeInTheDocument();
    unmount();

    const calls: string[] = [];
    renderDialog({
      onClose: () => calls.push("close"),
      onUploadImage: () => calls.push("upload"),
    });
    await user.click(screen.getByRole("tab", { name: "Image" }));
    expect(
      screen.queryByRole("button", { name: "Save" }),
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Upload image" }));
    // The caller closes the picker once a file reaches cropping.
    expect(calls).toEqual(["upload"]);
  });

  it("uploads an image dropped on the Image tab", async () => {
    const user = userEvent.setup();
    const upload = vi.fn();
    const close = vi.fn();
    renderDialog({ onClose: close, onUploadImage: upload });
    await user.click(screen.getByRole("tab", { name: "Image" }));
    const file = new File(["png"], "map.png", { type: "image/png" });
    fireEvent.drop(screen.getByText(/Drop a picture here/), {
      dataTransfer: { files: [file] },
    });
    expect(close).not.toHaveBeenCalled();
    expect(upload).toHaveBeenCalledWith(file);
  });
});
