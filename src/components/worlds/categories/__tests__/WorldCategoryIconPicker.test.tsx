import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { IconColors } from "types/Icon.type";

import { WorldCategoryIconPicker } from "../WorldCategoryIconPicker";
import { translate } from "./fixtures";

vi.mock("react-i18next", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react-i18next")>()),
  useTranslation: () => ({ t: translate }),
}));

// Exercise an icon outside the previous hard-coded eight choices.
describe("WorldCategoryIconPicker", () => {
  it("searches the full game icon set and preserves the chosen color", async () => {
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
    await user.type(
      screen.getByRole("textbox", { name: "Search icons" }),
      "Viking Longhouse",
    );
    await user.click(
      await screen.findByRole("button", { name: "Viking Longhouse" }),
    );
    expect(change).toHaveBeenCalledWith({
      key: "GiVikingLonghouse",
      color: IconColors.Blue,
    });
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
  });
  it("uses a square colored preview and keeps color configuration inside the picker", async () => {
    const user = userEvent.setup();
    const change = vi.fn();
    const view = render(
      <WorldCategoryIconPicker
        value={{ key: "GiCompass", color: IconColors.Blue }}
        onChange={change}
      />,
    );
    const preview = screen.getByRole("button", {
      name: "Choose category icon",
    });
    expect(preview).toHaveStyle({ width: "64px", height: "64px" });
    expect(
      screen.queryByRole("combobox", { name: "Icon color" }),
    ).not.toBeInTheDocument();
    await user.click(preview);
    await user.click(screen.getByRole("combobox", { name: "Icon color" }));
    await user.click(screen.getByRole("option", { name: "Red" }));
    expect(change).toHaveBeenCalledWith({
      key: "GiCompass",
      color: IconColors.Red,
    });
    view.rerender(
      <WorldCategoryIconPicker
        value={{ key: "GiCompass", color: IconColors.Red }}
        onChange={change}
      />,
    );
    await waitFor(() =>
      expect(preview.querySelector(".MuiBox-root")).toHaveStyle({
        color: "rgb(198, 40, 40)",
      }),
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "No icon" }));
    expect(change).toHaveBeenLastCalledWith(null);
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
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
