import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ConfirmProvider } from "material-ui-confirm";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { WorldCategoryFields } from "../WorldCategoryFields";
import { category, field, translate } from "./fixtures";

const actions = vi.hoisted(() => ({
  categories: {},
  createFieldDefinition: vi.fn(),
  updateFieldDefinition: vi.fn(),
  deleteFieldDefinition: vi.fn(),
  reorderFieldDefinitions: vi.fn(),
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
vi.mock("../../WorldOracleBindingPicker", () => ({
  WorldOracleBindingPicker: () => null,
}));

beforeEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

describe("WorldCategoryFields", () => {
  it("lets guides add and edit but hides delete; readers get configuration only", async () => {
    const user = userEvent.setup();
    actions.getCategoryCounts.mockResolvedValue({
      entryCount: 0,
      valueCounts: {},
    });
    const view = render(
      <WorldCategoryFields
        configurationReady
        category={category}
        fields={[field()]}
        canEdit
        canDelete={false}
      />,
      { wrapper: ConfirmProvider },
    );
    expect(screen.getByRole("button", { name: "Add field" })).toBeEnabled();
    expect(
      screen.getByRole("button", { name: "Edit Description" }),
    ).toBeEnabled();
    await user.click(screen.getByRole("button", { name: "Edit Description" }));
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Delete field" }),
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    view.rerender(
      <WorldCategoryFields
        configurationReady
        category={category}
        fields={[field()]}
        canEdit={false}
        canDelete={false}
      />,
    );
    expect(
      screen.queryByRole("button", { name: "Add field" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Edit Description" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Configure Description" }),
    ).toBeEnabled();
  });

  it("warns with the stored value count and honors canceled deletion", async () => {
    const user = userEvent.setup();
    const definition = field();
    actions.getCategoryCounts.mockResolvedValue({
      entryCount: 3,
      valueCounts: { [definition.id]: 3 },
    });
    render(
      <WorldCategoryFields
        configurationReady
        category={category}
        fields={[definition]}
        canEdit
        canDelete
      />,
      { wrapper: ConfirmProvider },
    );
    await user.click(screen.getByRole("button", { name: "Edit Description" }));
    await user.click(
      await screen.findByRole("button", { name: "Delete field" }),
    );
    expect(await screen.findByText(/3 stored values/)).toBeInTheDocument();
    // Only the confirmation is exposed while it sits over the editor.
    // Clicks inside it use fireEvent: user-event's synchronous focus patch
    // makes the two MUI focus traps recurse in jsdom.
    fireEvent.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "Cancel",
      }),
    );
    await waitFor(() =>
      expect(screen.queryByText(/3 stored values/)).not.toBeInTheDocument(),
    );
    expect(actions.deleteFieldDefinition).not.toHaveBeenCalled();
    await waitFor(() =>
      expect(screen.getByRole("dialog")).toHaveTextContent("Edit field"),
    );
    await user.click(screen.getByRole("button", { name: "Delete field" }));
    fireEvent.click(await screen.findByRole("button", { name: "Delete" }));
    await waitFor(() =>
      expect(actions.deleteFieldDefinition).toHaveBeenCalledWith(definition.id),
    );
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
  });

  it("blocks deletion when a condition references the field, before prompting", async () => {
    const user = userEvent.setup();
    const source = field({ label: "Type" });
    const dependent = field({ id: "dependent", label: "Region", sortOrder: 1 });
    dependent.configuration.rules = [
      {
        conditions: [
          {
            source: "ancestor",
            fieldId: source.id,
            operator: "isNotEmpty",
            ancestor: { fieldId: source.id, value: "Area" },
          },
        ],
      },
    ];
    render(
      <WorldCategoryFields
        configurationReady
        category={category}
        fields={[source, dependent]}
        canEdit
        canDelete
      />,
      { wrapper: ConfirmProvider },
    );
    actions.getCategoryCounts.mockResolvedValue({
      entryCount: 0,
      valueCounts: {},
    });
    await user.click(screen.getByRole("button", { name: "Edit Type" }));
    await user.click(
      await screen.findByRole("button", { name: "Delete field" }),
    );
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "conditions in Region",
    );
    expect(screen.getAllByRole("dialog")).toHaveLength(1);
    expect(screen.getByRole("dialog")).toHaveTextContent("Edit field");
    expect(actions.deleteFieldDefinition).not.toHaveBeenCalled();
  });

  it("reorders all field IDs with one atomic call", async () => {
    const user = userEvent.setup();
    const first = field({ label: "Type" });
    const second = field({ id: "second", label: "Region", sortOrder: 1 });
    const reorder =
      actions.reorderFieldDefinitions.mockResolvedValue(undefined);
    render(
      <WorldCategoryFields
        configurationReady
        category={category}
        fields={[first, second]}
        canEdit
        canDelete
      />,
      { wrapper: ConfirmProvider },
    );
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(
      function (this: HTMLElement) {
        const top = this.closest('[aria-label="Region field"]') ? 100 : 0;
        return {
          top,
          bottom: top + 80,
          left: 0,
          right: 400,
          width: 400,
          height: 80,
          x: 0,
          y: top,
          toJSON: () => ({}),
        };
      },
    );
    screen.getByRole("button", { name: "Reorder Region" }).focus();
    await user.keyboard("[Space]");
    await user.keyboard("[ArrowUp]");
    await user.keyboard("[Space]");
    await waitFor(() =>
      expect(reorder).toHaveBeenCalledWith(category.id, [second.id, first.id]),
    );
  });

  it("creates a new field for a repeated label and normalizes suggestions", async () => {
    const user = userEvent.setup();
    actions.createFieldDefinition.mockResolvedValue("created");
    render(
      <WorldCategoryFields
        configurationReady
        category={category}
        fields={[field()]}
        canEdit
        canDelete
      />,
      { wrapper: ConfirmProvider },
    );
    await user.click(screen.getByRole("button", { name: "Add field" }));
    await user.type(
      screen.getByRole("textbox", { name: "Field label" }),
      "Description",
    );
    await user.type(
      screen.getByRole("combobox", { name: "Suggestions" }),
      "Planet{Enter} Star {Enter}",
    );
    await user.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() =>
      expect(actions.createFieldDefinition).toHaveBeenCalled(),
    );
    const [categoryId, draft] = actions.createFieldDefinition.mock.calls[0];
    expect(categoryId).toBe(category.id);
    expect(draft.label).toBe("Description");
    expect(draft.configuration.suggestions).toEqual(["Planet", "Star"]);
  });
});
