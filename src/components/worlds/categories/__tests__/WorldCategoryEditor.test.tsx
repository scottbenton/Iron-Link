import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { WorldCategoryEditor } from "../WorldCategoryEditor";
import { category, field, translate } from "./fixtures";

vi.mock("lib/supabase.lib", () => ({ supabase: {} }));
vi.mock("react-i18next", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react-i18next")>()),
  useTranslation: () => ({ t: translate }),
}));

describe("WorldCategoryEditor", () => {
  it("only saves an actual change so an untouched default stays inherited", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(
      <WorldCategoryEditor
        category={category}
        fields={[]}
        onSave={onSave}
        onClose={vi.fn()}
      />,
    );
    const save = screen.getByRole("button", { name: "Save" });
    const name = screen.getByRole("textbox", { name: "Category name" });
    expect(save).toBeDisabled();
    fireEvent.click(save);
    await user.type(name, " ");
    expect(save).toBeDisabled();
    expect(onSave).not.toHaveBeenCalled();
    await user.type(name, "updated");
    expect(save).toBeEnabled();
    await user.clear(name);
    await user.type(name, category.name);
    expect(save).toBeDisabled();
    await user.type(name, " updated");
    await user.click(save);
    expect(onSave).toHaveBeenCalledOnce();
  });

  it("selects a subtitle by UUID when labels repeat and saves capability flags", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockResolvedValue(undefined);
    const first = field({ label: "Type" });
    const second = field({
      id: "bbbbbbbb-0000-4000-8000-000000000000",
      label: "Type",
    });
    render(
      <WorldCategoryEditor
        category={category}
        fields={[first, second]}
        onSave={onSave}
        onClose={vi.fn()}
      />,
    );
    await user.click(
      screen.getByRole("combobox", { name: "Entry subtitle field" }),
    );
    await user.click(screen.getByRole("option", { name: "Type (Text, 2)" }));
    await user.click(screen.getByRole("checkbox", { name: "Supports maps" }));
    await user.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() =>
      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({
          subtitleFieldDefinitionId: second.id,
          supportsMap: true,
        }),
      ),
    );
  });

  it("keeps the form open with a visible save error", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <WorldCategoryEditor
        category={category}
        fields={[]}
        onSave={vi.fn().mockRejectedValue(new Error("Please reconnect."))}
        onClose={onClose}
      />,
    );
    await user.type(
      screen.getByRole("textbox", { name: "Category name" }),
      " updated",
    );
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Please reconnect.",
    );
    expect(onClose).not.toHaveBeenCalled();
  });

  it("shows configuration without allowing readers to save", () => {
    render(
      <WorldCategoryEditor
        category={category}
        fields={[]}
        readOnly
        onSave={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    expect(
      screen.getByRole("textbox", { name: "Category name" }),
    ).toBeDisabled();
    expect(
      screen.queryByRole("button", { name: "Save" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Close" })).toBeEnabled();
  });
});
