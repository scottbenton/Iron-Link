import { render, screen, waitFor } from "@testing-library/react";
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
    await user.click(screen.getByRole("button", { name: "Compass" }));
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
});
