import { ThemeProvider } from "@mui/material";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getTheme } from "providers/ThemeProvider/themes/themeConfig";

import { ColorScheme } from "repositories/shared.types";

import { AdminDialog } from "../AdminDialog";

// Characterization tests for the admin dialog (slice 5).

const admin = vi.hoisted(() => ({ getMagicLink: vi.fn() }));
vi.mock("stores/admin.store", () => ({
  useAdminStore: (selector: (store: typeof admin) => unknown) =>
    selector(admin),
}));

function renderDialog(onClose: () => void = () => {}) {
  return render(
    <ThemeProvider theme={getTheme(ColorScheme.Default)}>
      <AdminDialog open onClose={onClose} />
    </ThemeProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("AdminDialog", () => {
  it("gets a magic link for an email with Enter", async () => {
    const user = userEvent.setup();
    admin.getMagicLink.mockResolvedValue("https://example.com/magic");
    renderDialog();
    const dialog = screen.getByRole("dialog", { name: "Get Magic Link" });

    await user.type(
      within(dialog).getByRole("textbox", { name: "Email" }),
      "kai@example.com{Enter}",
    );
    expect(admin.getMagicLink).toHaveBeenCalledWith(
      undefined,
      "kai@example.com",
    );
    const link = await within(dialog).findByRole("link", {
      name: /https:\/\/example\.com\/magic/,
    });
    expect(link).toHaveAttribute("href", "https://example.com/magic");
    expect(link).toHaveAttribute("target", "_blank");
    expect(
      within(dialog).getByRole("button", { name: "Copy Link" }),
    ).toBeInTheDocument();
  });

  it("gets a magic link for a user id", async () => {
    const user = userEvent.setup();
    admin.getMagicLink.mockResolvedValue("https://example.com/magic");
    renderDialog();
    const dialog = screen.getByRole("dialog", { name: "Get Magic Link" });

    await user.type(within(dialog).getByRole("textbox", { name: "UID" }), "u1");
    await user.click(
      within(dialog).getByRole("button", { name: "Get Magic Link" }),
    );
    expect(admin.getMagicLink).toHaveBeenCalledWith("u1", undefined);
  });

  it("shows why a link could not be made", async () => {
    const user = userEvent.setup();
    admin.getMagicLink.mockRejectedValue(new Error("No such user"));
    renderDialog();
    const dialog = screen.getByRole("dialog", { name: "Get Magic Link" });

    await user.click(
      within(dialog).getByRole("button", { name: "Get Magic Link" }),
    );
    expect(await within(dialog).findByText("No such user")).toBeInTheDocument();
  });

  it("closes from Done without getting a link", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderDialog(onClose);
    const dialog = screen.getByRole("dialog", { name: "Get Magic Link" });

    await user.type(within(dialog).getByRole("textbox", { name: "UID" }), "u1");
    await user.click(within(dialog).getByRole("button", { name: "Done" }));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(admin.getMagicLink).not.toHaveBeenCalled();
  });
});
