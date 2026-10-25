import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { WorldCategoryDetails } from "../WorldCategoryDetails";
import { WorldCategoryEditor } from "../WorldCategoryEditor";
import { category, field, translate } from "./fixtures";

const actions = vi.hoisted(() => ({
  updateCategory: vi.fn(),
  getCategoryCounts: vi.fn(),
}));
vi.mock("lib/supabase.lib", () => ({ supabase: {} }));
vi.mock("react-i18next", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react-i18next")>()),
  useTranslation: () => ({ t: translate }),
}));
vi.mock("stores/worldCategories.store", () => ({
  useWorldCategoriesStore: (selector: (store: typeof actions) => unknown) =>
    selector(actions),
}));

const counts = (nestedEntryCount: number) => ({
  entryCount: 4,
  nestedEntryCount,
  valueCounts: {},
  multiValueCounts: {},
});

beforeEach(() => {
  vi.clearAllMocks();
  actions.getCategoryCounts.mockResolvedValue(counts(0));
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
    await user.click(screen.getByRole("checkbox", { name: "Nesting" }));
    await user.click(create);
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Creatures", supportsHierarchy: true }),
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
    const nesting = screen.getByRole("checkbox", { name: "Nesting" });
    await waitFor(() => expect(actions.getCategoryCounts).toHaveBeenCalled());
    await user.click(nesting);
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Please reconnect.",
    );
    expect(nesting).toBeChecked();
  });

  // Release guard until #237 and #238 bring Maps and Bonds back.
  it("does not offer Maps or Bonds yet, and keeps their stored values", async () => {
    const user = userEvent.setup();
    actions.updateCategory.mockResolvedValue(undefined);
    render(
      <WorldCategoryDetails
        category={{ ...category, supportsMap: true, supportsBonds: true }}
        fields={[]}
        readOnly={false}
        disabled={false}
      />,
    );
    expect(
      screen.queryByRole("checkbox", { name: "Maps" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("checkbox", { name: "Bonds" }),
    ).not.toBeInTheDocument();
    await waitFor(() => expect(actions.getCategoryCounts).toHaveBeenCalled());
    await user.click(screen.getByRole("checkbox", { name: "Nesting" }));
    expect(actions.updateCategory).toHaveBeenCalledWith(category.id, {
      supportsHierarchy: false,
    });
  });

  it("keeps nesting on while entries are nested", async () => {
    actions.getCategoryCounts.mockResolvedValue(counts(3));
    render(
      <WorldCategoryDetails
        category={category}
        fields={[]}
        readOnly={false}
        disabled={false}
      />,
    );
    const nesting = screen.getByRole("checkbox", {
      name: "Nesting",
    });
    await waitFor(() => expect(nesting).toBeDisabled());
    expect(nesting).toHaveAccessibleDescription(
      "Entries can sit inside other entries, like a settlement on a planet. Move 3 entries out of their parent entries first.",
    );
    expect(actions.getCategoryCounts).toHaveBeenCalledWith(category.id);
  });

  it("allows turning nesting off once no entries are nested", async () => {
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
    await waitFor(() => expect(actions.getCategoryCounts).toHaveBeenCalled());
    await user.click(screen.getByRole("checkbox", { name: "Nesting" }));
    expect(actions.updateCategory).toHaveBeenCalledWith(category.id, {
      supportsHierarchy: false,
    });
  });

  it("does not count entries when nesting is off", async () => {
    const user = userEvent.setup();
    actions.updateCategory.mockResolvedValue(undefined);
    render(
      <WorldCategoryDetails
        category={{ ...category, supportsHierarchy: false }}
        fields={[]}
        readOnly={false}
        disabled={false}
      />,
    );
    await user.click(screen.getByRole("checkbox", { name: "Nesting" }));
    expect(actions.updateCategory).toHaveBeenCalledWith(category.id, {
      supportsHierarchy: true,
    });
    expect(actions.getCategoryCounts).not.toHaveBeenCalled();
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
    expect(screen.getByRole("checkbox", { name: "Nesting" })).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Choose category icon" }),
    ).toBeDisabled();
    expect(actions.getCategoryCounts).not.toHaveBeenCalled();
  });
});
