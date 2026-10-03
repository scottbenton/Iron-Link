import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { IconColors } from "types/Icon.type";

import { WorldCategoryIconPicker } from "../WorldCategoryIconPicker";
import {
  GROUPS_CATEGORY_ICON_KEY,
  getCategoryIconColor,
} from "../categoryIcons";
import { translate } from "./fixtures";

vi.mock("react-i18next", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react-i18next")>()),
  useTranslation: () => ({ t: translate }),
}));

// Exercise an icon outside the previous hard-coded eight choices.
describe("WorldCategoryIconPicker", () => {
  it("searches the full game icon set and saves the choice with its color", async () => {
    const user = userEvent.setup();
    const change = vi.fn();
    render(
      <WorldCategoryIconPicker
        value={{ key: "GiCompass", color: IconColors.Blue }}
        onChange={change}
      />,
    );
    await user.click(
      screen.getByRole("button", { name: "Choose category icon" }),
    );
    fireEvent.change(screen.getByRole("textbox", { name: "Search icons" }), {
      target: { value: "Viking Longhouse" },
    });
    await user.click(
      await screen.findByRole("button", { name: "Viking Longhouse" }),
    );
    // Picking previews the icon; nothing is saved until Save.
    expect(change).not.toHaveBeenCalled();
    expect(
      screen.getByRole("button", { name: "Viking Longhouse" }),
    ).toHaveAttribute("aria-pressed", "true");
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(change).toHaveBeenCalledWith({
      key: "GiVikingLonghouse",
      color: IconColors.Blue,
    });
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
  });

  it("uses a square colored preview and picks colors from swatches", async () => {
    const user = userEvent.setup();
    const change = vi.fn();
    render(
      <WorldCategoryIconPicker
        value={{ key: "GiCompass", color: IconColors.Blue }}
        onChange={change}
      />,
    );
    const preview = screen.getByRole("button", {
      name: "Choose category icon",
    });
    expect(preview).toHaveStyle({ width: "72px", height: "72px" });
    expect(
      screen.queryByRole("group", { name: "Icon color" }),
    ).not.toBeInTheDocument();
    await user.click(preview);
    const red = screen.getByRole("button", { name: "Red" });
    fireEvent.change(screen.getByRole("textbox", { name: "Search icons" }), {
      target: { value: "Compass" },
    });
    const compass = await screen.findByRole("button", { name: "Compass" });
    expect(compass).toHaveStyle({
      color: getCategoryIconColor(IconColors.Blue, "light"),
    });
    await user.click(red);
    expect(red).toHaveAttribute("aria-pressed", "true");
    expect(compass).toHaveStyle({
      color: getCategoryIconColor(IconColors.Red, "light"),
    });
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(change).toHaveBeenCalledWith({
      key: "GiCompass",
      color: IconColors.Red,
    });
  });

  it("offers the curated Material Groups icon with a stable namespaced key", async () => {
    const user = userEvent.setup();
    const change = vi.fn();
    render(<WorldCategoryIconPicker value={null} onChange={change} />);
    await user.click(
      screen.getByRole("button", { name: "Choose category icon" }),
    );
    fireEvent.change(screen.getByRole("textbox", { name: "Search icons" }), {
      target: { value: "Groups" },
    });
    await user.click(await screen.findByRole("button", { name: "Groups" }));
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(change).toHaveBeenCalledWith({
      key: GROUPS_CATEGORY_ICON_KEY,
      color: IconColors.Grey,
    });
  });

  it("removes the icon and discards unsaved changes on cancel", async () => {
    const user = userEvent.setup();
    const change = vi.fn();
    render(
      <WorldCategoryIconPicker
        value={{ key: "GiCompass", color: IconColors.Blue }}
        onChange={change}
      />,
    );
    await user.click(
      screen.getByRole("button", { name: "Choose category icon" }),
    );
    await user.click(screen.getByRole("button", { name: "Remove icon" }));
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(change).not.toHaveBeenCalled();
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    await user.click(
      screen.getByRole("button", { name: "Choose category icon" }),
    );
    await user.click(screen.getByRole("button", { name: "Remove icon" }));
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(change).toHaveBeenLastCalledWith(null);
  });

  it("closes an open picker when it becomes read-only and keeps it closed when re-enabled", async () => {
    const user = userEvent.setup();
    const change = vi.fn();
    const props = {
      value: { key: "GiCompass", color: IconColors.Blue },
      onChange: change,
    };
    const view = render(<WorldCategoryIconPicker {...props} />);
    await user.click(
      screen.getByRole("button", { name: "Choose category icon" }),
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    view.rerender(<WorldCategoryIconPicker {...props} disabled />);
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    expect(change).not.toHaveBeenCalled();
    view.rerender(<WorldCategoryIconPicker {...props} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: "Choose category icon" }),
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("prevents read-only icon configuration", () => {
    const change = vi.fn();
    render(<WorldCategoryIconPicker value={null} onChange={change} disabled />);
    const preview = screen.getByRole("button", {
      name: "Choose category icon",
    });
    expect(preview).toBeDisabled();
    fireEvent.click(preview);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(change).not.toHaveBeenCalled();
  });
});
