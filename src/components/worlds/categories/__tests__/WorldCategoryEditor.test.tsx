import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { WorldCategoryDetails } from "../WorldCategoryDetails";
import { WorldCategoryEditor } from "../WorldCategoryEditor";
import { category, field, translate } from "./fixtures";

const actions = vi.hoisted(() => ({ updateCategory: vi.fn() }));
vi.mock("lib/supabase.lib", () => ({ supabase: {} }));
vi.mock("react-i18next", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react-i18next")>()),
  useTranslation: () => ({ t: translate }),
}));
vi.mock("stores/worldCategories.store", () => ({
  useWorldCategoriesStore: (selector: (store: typeof actions) => unknown) =>
    selector(actions),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("WorldCategoryEditor", () => {
  it("creates a category only once it has a name", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockResolvedValue(undefined);
    const onClose = vi.fn();
    render(<WorldCategoryEditor onSave={onSave} onClose={onClose} />);
    const create = screen.getByRole("button", { name: "Create category" });
    const name = screen.getByRole("textbox", { name: /Category name/ });
    expect(create).toBeDisabled();
    await user.type(name, " ");
    expect(create).toBeDisabled();
    await user.type(name, "Creatures");
    await user.click(screen.getByRole("checkbox", { name: "Supports maps" }));
    await user.click(create);
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Creatures", supportsMap: true }),
    );
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it("keeps the form open with a visible save error", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <WorldCategoryEditor
        onSave={vi.fn().mockRejectedValue(new Error("Please reconnect."))}
        onClose={onClose}
      />,
    );
    await user.type(
      screen.getByRole("textbox", { name: /Category name/ }),
      "Creatures",
    );
    await user.click(screen.getByRole("button", { name: "Create category" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Please reconnect.",
    );
    expect(onClose).not.toHaveBeenCalled();
  });
});

describe("WorldCategoryDetails", () => {
  it("selects a subtitle by UUID when labels repeat", async () => {
    const user = userEvent.setup();
    actions.updateCategory.mockResolvedValue(undefined);
    const first = field({ label: "Type" });
    const second = field({
      id: "bbbbbbbb-0000-4000-8000-000000000000",
      label: "Type",
    });
    render(
      <WorldCategoryDetails
        category={category}
        fields={[first, second]}
        readOnly={false}
        disabled={false}
      />,
    );
    await user.click(
      screen.getByRole("combobox", { name: "Entry subtitle field" }),
    );
    await user.click(screen.getByRole("option", { name: "Type (Text, 2)" }));
    expect(actions.updateCategory).toHaveBeenCalledWith(category.id, {
      subtitleFieldDefinitionId: second.id,
    });
  });

  it("does not save an unchanged or blank name", async () => {
    const user = userEvent.setup();
    actions.updateCategory.mockResolvedValue(undefined);
    render(
      <WorldCategoryDetails
        category={category}
        fields={[]}
        readOnly={false}
        disabled={false}
      />,
    );
    const name = screen.getByRole("textbox", { name: /Category name/ });
    await user.clear(name);
    await user.type(name, category.name);
    await user.clear(name);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    expect(actions.updateCategory).not.toHaveBeenCalled();
  });

  it("reverts a toggle and shows the error when saving fails", async () => {
    const user = userEvent.setup();
    actions.updateCategory.mockRejectedValue(new Error("Please reconnect."));
    render(
      <WorldCategoryDetails
        category={category}
        fields={[]}
        readOnly={false}
        disabled={false}
      />,
    );
    const maps = screen.getByRole("checkbox", { name: "Supports maps" });
    await user.click(maps);
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Please reconnect.",
    );
    expect(maps).not.toBeChecked();
  });

  it("shows configuration without allowing readers to change it", () => {
    render(
      <WorldCategoryDetails
        category={category}
        fields={[]}
        readOnly
        disabled={false}
      />,
    );
    expect(
      screen.getByRole("textbox", { name: /Category name/ }),
    ).toBeDisabled();
    expect(
      screen.getByRole("checkbox", { name: "Supports maps" }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Choose category icon" }),
    ).toBeDisabled();
  });
});
