import { render, screen } from "@testing-library/react";
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
});
