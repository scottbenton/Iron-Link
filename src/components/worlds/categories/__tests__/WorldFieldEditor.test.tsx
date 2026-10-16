import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { WorldFieldCondition } from "lib/worldFieldRules";

import { WorldFieldType } from "services/worldFieldDefinitions.service";

import { WorldFieldEditor } from "../WorldFieldEditor";
import {
  category,
  field,
  linkedEntry,
  optionList,
  translate,
} from "./fixtures";

const locations = {
  ...category,
  id: "11111111-1111-4111-8111-111111111111",
};
const npcs = {
  ...category,
  id: "22222222-2222-4222-8222-222222222222",
  name: "NPCs",
};
const otherWorld = {
  ...category,
  id: "33333333-3333-4333-8333-333333333333",
  worldId: "world-2",
  name: "Other world",
};

vi.mock("lib/supabase.lib", () => ({ supabase: {} }));
vi.mock("react-i18next", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react-i18next")>()),
  useTranslation: () => ({ t: translate }),
}));
vi.mock("../../WorldOracleBindingPicker", () => ({
  WorldOracleBindingPicker: ({ label }: { label?: string }) => (
    <div>{label ?? "Oracle"} picker</div>
  ),
}));

// A field whose rule reads its own value, beside Guide-only fields of every
// kind, so tests can check which of them its conditions may read.
function renderGuideOnlySources(gmOnly: boolean) {
  const target = optionList({ label: "Public type", gmOnly });
  const secret = optionList({
    id: "secret",
    label: "Secret type",
    gmOnly: true,
  });
  const name = field({
    id: "name",
    label: "Secret name",
    gmOnly: true,
  });
  const tags = optionList(
    { id: "tags", label: "Secret tags", gmOnly: true },
    { multiple: true },
  );
  const notes = field({
    id: "notes",
    label: "Secret notes",
    type: WorldFieldType.RichText,
    gmOnly: true,
  });
  target.configuration.rules = [
    {
      conditions: [
        {
          source: "ancestor",
          fieldId: target.id,
          operator: "equals",
          value: "Planet",
          ancestor: { fieldId: target.id, value: "Area" },
        },
      ],
    },
  ];
  const onSave = vi.fn().mockResolvedValue(undefined);
  render(
    <WorldFieldEditor
      worldId="world-1"
      categories={[category]}
      field={target}
      fields={[target, secret, name, tags, notes]}
      valueCount={0}
      multiValueCount={0}
      readOnly={false}
      onSave={onSave}
      onClose={vi.fn()}
    />,
  );
  return { secret, onSave };
}

describe("WorldFieldEditor", () => {
  it("hides Guide-only sources and ancestor selectors from a public field", async () => {
    const user = userEvent.setup();
    renderGuideOnlySources(false);
    await user.click(screen.getByRole("button", { name: /Rule 1:/ }));
    await user.click(screen.getByRole("combobox", { name: "Source field" }));
    expect(
      screen.queryByRole("option", { name: "Secret type" }),
    ).not.toBeInTheDocument();
    await user.keyboard("{Escape}");
    await user.click(
      screen.getByRole("combobox", { name: "Ancestor selector field" }),
    );
    expect(
      screen.queryByRole("option", { name: "Secret type" }),
    ).not.toBeInTheDocument();
  });

  it("offers a Guide-only field compatible Guide-only sources and ancestor selectors", async () => {
    const user = userEvent.setup();
    renderGuideOnlySources(true);
    await user.click(screen.getByRole("button", { name: /Rule 1:/ }));
    await user.click(screen.getByRole("combobox", { name: "Source field" }));
    expect(
      screen.getByRole("option", { name: "Secret name" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: "Secret tags" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("option", { name: "Secret notes" }),
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole("option", { name: "Secret type" }));
    await user.click(
      screen.getByRole("combobox", { name: "Ancestor selector field" }),
    );
    // Only single option lists and linked entries can select an ancestor.
    expect(
      screen.queryByRole("option", { name: "Secret name" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("option", { name: "Secret tags" }),
    ).not.toBeInTheDocument();
  });

  it("saves a Guide-only field's conditions on Guide-only sources", async () => {
    const user = userEvent.setup();
    const { secret, onSave } = renderGuideOnlySources(true);
    await user.click(screen.getByRole("button", { name: /Rule 1:/ }));
    await user.click(screen.getByRole("combobox", { name: "Source field" }));
    await user.click(screen.getByRole("option", { name: "Secret type" }));
    await user.click(
      screen.getByRole("combobox", { name: "Ancestor selector field" }),
    );
    await user.click(screen.getByRole("option", { name: "Secret type" }));
    // Values are picked per field, so they reset with it and must be chosen.
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
    await user.type(
      screen.getByRole("combobox", { name: "Comparison value" }),
      "Planet{Enter}",
    );
    await user.type(
      screen.getByRole("combobox", { name: "Ancestor selector equals" }),
      "Area{Enter}",
    );
    expect(screen.getByRole("button", { name: "Save" })).toBeEnabled();
    await user.click(screen.getByRole("checkbox", { name: "Guide only" }));
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
    expect(
      screen
        .getAllByRole("alert")
        .some((alert) => alert.textContent?.includes("Guide-only source")),
    ).toBe(true);
    await user.click(screen.getByRole("checkbox", { name: "Guide only" }));
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        gmOnly: true,
        configuration: expect.objectContaining({
          rules: [
            expect.objectContaining({
              conditions: [
                expect.objectContaining({
                  fieldId: secret.id,
                  value: "Planet",
                  ancestor: { fieldId: secret.id, value: "Area" },
                }),
              ],
            }),
          ],
        }),
      }),
      false,
    );
  });

  it("reorders conditional rules by keyboard drag and saves the new precedence", async () => {
    const user = userEvent.setup();
    const source = field({ id: "source", label: "Type" });
    const target = field({ id: "target", label: "Description" });
    target.configuration.rules = ["Planet", "Star"].map((value) => ({
      conditions: [
        {
          source: "entry" as const,
          fieldId: source.id,
          operator: "equals" as const,
          value,
        },
      ],
      visible: true,
    }));
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(
      <WorldFieldEditor
        worldId="world-1"
        categories={[category]}
        field={target}
        fields={[source, target]}
        valueCount={0}
        multiValueCount={0}
        readOnly={false}
        onSave={onSave}
        onClose={vi.fn()}
      />,
    );
    const rect = vi
      .spyOn(HTMLElement.prototype, "getBoundingClientRect")
      .mockImplementation(function (this: HTMLElement) {
        const top = this.closest('[aria-label="Rule 2"]') ? 100 : 0;
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
      });
    try {
      act(() => screen.getByRole("button", { name: "Reorder rule 2" }).focus());
      await user.keyboard("[Space][ArrowUp][Space]");
      expect(
        screen.queryByRole("button", { name: "Move up" }),
      ).not.toBeInTheDocument();
      await user.click(screen.getByRole("button", { name: "Save" }));
      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({
          configuration: expect.objectContaining({
            rules: [
              target.configuration.rules[1],
              target.configuration.rules[0],
            ],
          }),
        }),
        false,
      );
    } finally {
      rect.mockRestore();
    }
  });

  it("only saves an actual change so an untouched default stays inherited", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockResolvedValue(undefined);
    const definition = field();
    render(
      <WorldFieldEditor
        worldId="world-1"
        categories={[category]}
        field={definition}
        fields={[]}
        valueCount={0}
        multiValueCount={0}
        readOnly={false}
        onSave={onSave}
        onClose={vi.fn()}
      />,
    );
    const save = screen.getByRole("button", { name: "Save" });
    const label = screen.getByRole("textbox", { name: "Field label" });
    expect(save).toBeDisabled();
    fireEvent.click(save);
    await user.type(label, " ");
    expect(save).toBeDisabled();
    expect(onSave).not.toHaveBeenCalled();
    await user.type(label, "updated");
    expect(save).toBeEnabled();
    await user.clear(label);
    await user.type(label, definition.label);
    expect(save).toBeDisabled();
    await user.type(label, " updated");
    await user.click(save);
    expect(onSave).toHaveBeenCalledOnce();
  });

  it("names dependent public fields before making their source Guide-only", async () => {
    const user = userEvent.setup();
    const source = field({ label: "Location Type" });
    const dependent = field({ id: "dependent", label: "Region" });
    dependent.configuration.rules = [
      {
        conditions: [
          {
            source: "entry",
            fieldId: source.id,
            operator: "equals",
            value: "Area",
          },
        ],
      },
    ];
    render(
      <WorldFieldEditor
        worldId="world-1"
        categories={[category]}
        field={source}
        fields={[source, dependent]}
        valueCount={0}
        multiValueCount={0}
        readOnly={false}
        onSave={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    await user.click(screen.getByRole("checkbox", { name: "Guide only" }));
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
    expect(screen.getByRole("alert")).toHaveTextContent("conditions in Region");
  });

  it("blocks a source type change that invalidates an ancestor selector", async () => {
    const user = userEvent.setup();
    const source = optionList({ label: "Location Type" });
    const dependent = field({ id: "dependent", label: "Region" });
    dependent.configuration.rules = [
      {
        conditions: [
          {
            source: "ancestor",
            fieldId: dependent.id,
            operator: "equals",
            value: "Reaches",
            ancestor: { fieldId: source.id, value: "Area" },
          },
        ],
      },
    ];
    render(
      <WorldFieldEditor
        worldId="world-1"
        categories={[category]}
        field={source}
        fields={[source, dependent]}
        valueCount={0}
        multiValueCount={0}
        readOnly={false}
        onSave={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Change type" }));
    await user.click(screen.getByRole("radio", { name: "Text" }));
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
    expect(screen.getByRole("alert")).toHaveTextContent("conditions in Region");
  });

  it("summarizes existing rules collapsed and supports a field's own value as a condition", async () => {
    const user = userEvent.setup();
    const definition = field({ label: "Type" });
    definition.configuration.rules = [
      {
        conditions: [
          {
            source: "entry",
            fieldId: definition.id,
            operator: "equals",
            value: "Planet",
          },
        ],
        helpText: "A world",
      },
    ];
    render(
      <WorldFieldEditor
        worldId="world-1"
        categories={[category]}
        field={definition}
        fields={[definition]}
        valueCount={0}
        multiValueCount={0}
        readOnly={false}
        onSave={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    expect(
      screen.queryByRole("combobox", { name: "Source field" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
    await user.click(
      screen.getByRole("button", { name: /Rule 1: Type Equals/ }),
    );
    expect(
      await screen.findByRole("combobox", { name: "Source field" }),
    ).toHaveTextContent("Type");
  });

  it("requires Guide visibility for rules that read a Guide-only source", async () => {
    const user = userEvent.setup();
    const source = field({ id: "source", label: "Secret type", gmOnly: true });
    const target = field();
    target.configuration.rules = [
      {
        conditions: [
          {
            source: "entry",
            fieldId: source.id,
            operator: "equals",
            value: "Planet",
          },
        ],
        visible: true,
      },
    ];
    render(
      <WorldFieldEditor
        worldId="world-1"
        categories={[category]}
        field={target}
        fields={[target, source]}
        valueCount={0}
        multiValueCount={0}
        readOnly={false}
        onSave={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
    expect(screen.getByRole("alert")).toHaveTextContent("Guide-only source");
    await user.click(screen.getByRole("checkbox", { name: "Guide only" }));
    expect(screen.getByRole("button", { name: "Save" })).toBeEnabled();
  });

  it("removes oracle bindings when converting a field to a linked entry", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockResolvedValue(undefined);
    const binding = {
      packageId: "classic",
      oracleId: "character/name",
      resolvedOracleId: "character/name",
    };
    const source = field({ id: "source", label: "Type" });
    const original = field({
      id: "target",
      binding,
      configuration: {
        ...field().configuration,
        rules: [
          {
            conditions: [
              {
                source: "entry",
                fieldId: source.id,
                operator: "equals",
                value: "Planet",
              },
            ],
            binding,
          },
        ],
      },
    });
    render(
      <WorldFieldEditor
        worldId="world-1"
        categories={[locations]}
        field={original}
        fields={[source, original]}
        valueCount={0}
        multiValueCount={0}
        readOnly={false}
        onSave={onSave}
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByText("Oracle picker")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Change type" }));
    await user.click(screen.getByRole("radio", { name: "Linked entry" }));
    expect(screen.queryByText("Oracle picker")).toBeNull();
    await user.click(screen.getByRole("combobox", { name: /Category/ }));
    await user.click(screen.getByRole("option", { name: "Locations" }));
    await user.click(screen.getByRole("button", { name: /Rule 1:/ }));
    expect(
      screen.queryByRole("checkbox", { name: "Use a different oracle" }),
    ).toBeNull();
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        type: WorldFieldType.Select,
        binding: null,
        configuration: expect.objectContaining({
          suggestions: [],
          targetCategoryId: locations.id,
          multiple: false,
          allowOther: false,
          rules: [expect.not.objectContaining({ binding })],
        }),
      }),
      false,
    );
  });
});

describe("WorldFieldEditor field types", () => {
  const props = {
    worldId: "world-1",
    categories: [locations, npcs, otherWorld],
    fields: [],
    valueCount: 0,
    multiValueCount: 0,
    readOnly: false,
    onClose: vi.fn(),
  };

  it("offers three purpose cards as a keyboard radio group for a new field", async () => {
    const user = userEvent.setup();
    render(<WorldFieldEditor {...props} onSave={vi.fn()} />);
    const group = screen.getByRole("radiogroup", { name: "Field type" });
    const radios = within(group).getAllByRole("radio");
    expect(radios.map((radio) => radio.textContent)).toEqual([
      expect.stringContaining("Text"),
      expect.stringContaining("Option list"),
      expect.stringContaining("Linked entry"),
    ]);
    expect(
      screen.getByRole("radio", { name: "Text" }),
    ).toHaveAccessibleDescription(
      "A short line, like a name or a rolled result. Can roll from an oracle.",
    );
    for (const name of [
      "Long text",
      "Select",
      "Dropdown",
      "Link",
      "Tags",
      "Rich text",
    ])
      expect(screen.queryByRole("radio", { name })).toBeNull();
    expect(screen.getByRole("radio", { name: "Text" })).toBeChecked();
    // Only the selected card is a Tab stop; arrows move the selection.
    expect(
      radios.filter((radio) => radio.getAttribute("tabindex") === "0"),
    ).toEqual([screen.getByRole("radio", { name: "Text" })]);
    act(() => screen.getByRole("radio", { name: "Text" }).focus());
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("radio", { name: "Option list" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "Option list" })).toHaveFocus();
    await user.keyboard("{ArrowLeft}{ArrowLeft}");
    expect(screen.getByRole("radio", { name: "Linked entry" })).toBeChecked();
  });

  it("keeps Long text on offer for an existing Long text field", async () => {
    const user = userEvent.setup();
    render(
      <WorldFieldEditor
        {...props}
        field={field({ type: WorldFieldType.RichText })}
        onSave={vi.fn()}
      />,
    );
    expect(
      screen.getByRole("region", { name: "Field type" }),
    ).toHaveTextContent("Long text");
    await user.click(screen.getByRole("button", { name: "Change type" }));
    expect(screen.getByRole("radio", { name: "Long text" })).toBeChecked();
    expect(
      screen.queryByRole("checkbox", { name: "Full width" }),
    ).not.toBeInTheDocument();
  });

  it("shows only the settings each kind uses", async () => {
    const user = userEvent.setup();
    render(<WorldFieldEditor {...props} onSave={vi.fn()} />);
    expect(screen.getByText("Oracle picker")).toBeInTheDocument();
    expect(screen.queryByRole("combobox", { name: "Options" })).toBeNull();
    expect(
      screen.getByRole("checkbox", { name: "Full width" }),
    ).not.toBeChecked();

    await user.click(screen.getByRole("radio", { name: "Option list" }));
    expect(screen.queryByRole("checkbox", { name: "Full width" })).toBeNull();
    expect(screen.getByText("Oracle picker")).toBeInTheDocument();
    expect(
      screen.getByRole("checkbox", { name: "Allow more than one" }),
    ).not.toBeChecked();
    expect(
      screen.getByRole("checkbox", { name: "Allow other values" }),
    ).toBeChecked();
    expect(screen.getByRole("combobox", { name: "Options" })).toBeVisible();

    await user.click(screen.getByRole("radio", { name: "Linked entry" }));
    expect(screen.queryByText("Oracle picker")).toBeNull();
    expect(screen.queryByRole("combobox", { name: "Options" })).toBeNull();
    expect(
      screen.queryByRole("checkbox", { name: "Allow other values" }),
    ).toBeNull();
    expect(
      screen.getByRole("checkbox", { name: "Allow more than one" }),
    ).toBeInTheDocument();
  });

  it("saves a full width Text field", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(<WorldFieldEditor {...props} onSave={onSave} />);
    await user.type(
      screen.getByRole("textbox", { name: "Field label" }),
      "Goal",
    );
    await user.click(screen.getByRole("checkbox", { name: "Full width" }));
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        type: WorldFieldType.Text,
        configuration: expect.objectContaining({ fullWidth: true }),
      }),
      false,
    );
  });

  it("saves an option list's options and settings", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(<WorldFieldEditor {...props} onSave={onSave} />);
    await user.type(
      screen.getByRole("textbox", { name: "Field label" }),
      "Region",
    );
    await user.click(screen.getByRole("radio", { name: "Option list" }));
    await user.click(
      screen.getByRole("checkbox", { name: "Allow more than one" }),
    );
    await user.click(
      screen.getByRole("checkbox", { name: "Allow other values" }),
    );
    await user.type(
      screen.getByRole("combobox", { name: "Options" }),
      "Myriads{Enter}Reaches{Enter}",
    );
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        label: "Region",
        type: WorldFieldType.Select,
        configuration: expect.objectContaining({
          suggestions: ["Myriads", "Reaches"],
          multiple: true,
          allowOther: false,
        }),
      }),
      false,
    );
  });

  it("requires a same-world category for a linked entry", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(<WorldFieldEditor {...props} onSave={onSave} />);
    await user.type(
      screen.getByRole("textbox", { name: "Field label" }),
      "Home",
    );
    await user.click(screen.getByRole("radio", { name: "Linked entry" }));
    await user.click(
      screen.getByRole("checkbox", { name: "Allow more than one" }),
    );
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
    await user.click(screen.getByRole("combobox", { name: /Category/ }));
    expect(screen.queryByRole("option", { name: "Other world" })).toBeNull();
    await user.click(screen.getByRole("option", { name: "Locations" }));
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        type: WorldFieldType.Select,
        binding: null,
        configuration: expect.objectContaining({
          targetCategoryId: locations.id,
          multiple: true,
          allowOther: false,
          suggestions: [],
        }),
      }),
      false,
    );
  });

  it("summarizes an existing field and disables kinds that would lose its values", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(
      <WorldFieldEditor
        {...props}
        field={field()}
        valueCount={7}
        onSave={onSave}
      />,
    );
    expect(screen.queryByRole("radiogroup")).toBeNull();
    expect(
      screen.getByRole("region", { name: "Field type" }),
    ).toHaveTextContent("Text");
    await user.click(screen.getByRole("button", { name: "Change type" }));
    expect(screen.getByRole("radio", { name: "Text" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "Option list" })).toBeEnabled();
    const linked = screen.getByRole("radio", { name: "Linked entry" });
    expect(linked).toBeDisabled();
    expect(linked).toHaveAccessibleDescription(
      expect.stringContaining("Has 7 values. Create a new field instead."),
    );
    // Arrow keys skip the cards that cannot be chosen.
    act(() => screen.getByRole("radio", { name: "Text" }).focus());
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("radio", { name: "Option list" })).toBeChecked();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("radio", { name: "Text" })).toBeChecked();

    const linkedCard = linked.closest(".MuiCard-root") as HTMLElement;
    await user.click(
      within(linkedCard).getByRole("button", { name: "Create new field" }),
    );
    expect(screen.getByRole("radio", { name: "Linked entry" })).toBeChecked();
    expect(screen.getByRole("alert")).toHaveTextContent("7 stored values");
    expect(screen.queryByRole("button", { name: "Save" })).toBeNull();
    await user.click(screen.getByRole("combobox", { name: /Category/ }));
    await user.click(screen.getByRole("option", { name: "Locations" }));
    // Only the dialog's own action remains once a new field is the outcome.
    await user.click(screen.getByRole("button", { name: "Create new field" }));
    await waitFor(() =>
      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({
          type: WorldFieldType.Select,
          configuration: expect.objectContaining({
            targetCategoryId: locations.id,
          }),
        }),
        true,
      ),
    );
  });

  it("changes Text into any single option list in place, but not a multiple one", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(
      <WorldFieldEditor
        {...props}
        field={field()}
        valueCount={7}
        onSave={onSave}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Change type" }));
    await user.click(screen.getByRole("radio", { name: "Option list" }));
    await user.click(
      screen.getByRole("checkbox", { name: "Allow other values" }),
    );
    expect(screen.queryByRole("alert")).toBeNull();
    await user.click(
      screen.getByRole("checkbox", { name: "Allow more than one" }),
    );
    expect(screen.getByRole("alert")).toHaveTextContent("7 stored values");
    expect(screen.queryByRole("button", { name: "Save" })).toBeNull();
    await user.click(
      screen.getByRole("checkbox", { name: "Allow more than one" }),
    );
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        type: WorldFieldType.Select,
        configuration: expect.objectContaining({
          multiple: false,
          allowOther: false,
        }),
      }),
      false,
    );
  });

  it("keeps the current type after looking at the cards", async () => {
    const user = userEvent.setup();
    const original = optionList(
      { label: "Region" },
      { suggestions: ["Myriads"], allowOther: false },
    );
    render(<WorldFieldEditor {...props} field={original} onSave={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: "Change type" }));
    await user.click(screen.getByRole("radio", { name: "Text" }));
    await user.click(screen.getByRole("button", { name: "Keep current type" }));
    expect(screen.queryByRole("radiogroup")).toBeNull();
    expect(
      screen.getByRole("region", { name: "Field type" }),
    ).toHaveTextContent("Option list");
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Myriads" })).toBeInTheDocument();
  });

  it("limits and cleans up options", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(<WorldFieldEditor {...props} onSave={onSave} />);
    await user.type(
      screen.getByRole("textbox", { name: "Field label" }),
      "Type",
    );
    await user.click(screen.getByRole("radio", { name: "Option list" }));
    const options = screen.getByRole("combobox", { name: "Options" });
    expect(options).toHaveAttribute("maxlength", "1000");
    await user.type(options, " Ruin {Enter}Ruin{Enter}   {Enter}Wilds{Enter}");
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        configuration: expect.objectContaining({
          suggestions: ["Ruin", "Wilds"],
        }),
      }),
      false,
    );
  });

  it("allows any kind while no values are stored", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(<WorldFieldEditor {...props} field={field()} onSave={onSave} />);
    await user.click(screen.getByRole("button", { name: "Change type" }));
    for (const radio of screen.getAllByRole("radio"))
      expect(radio).toBeEnabled();
    await user.click(screen.getByRole("radio", { name: "Linked entry" }));
    expect(
      screen.queryByRole("textbox", { name: /key/i }),
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole("combobox", { name: /Category/ }));
    await user.click(screen.getByRole("option", { name: "Locations" }));
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        type: WorldFieldType.Select,
        configuration: expect.objectContaining({
          targetCategoryId: locations.id,
        }),
      }),
      false,
    );
  });

  it("keeps Allow more than one while entries store several values", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(
      <WorldFieldEditor
        {...props}
        field={optionList({ label: "Tags" }, { multiple: true })}
        valueCount={7}
        multiValueCount={2}
        onSave={onSave}
      />,
    );
    expect(
      screen.getByRole("checkbox", { name: "Allow more than one" }),
    ).toBeDisabled();
    expect(
      screen.getByText(
        "2 entries store more than one value. Create a new field instead.",
      ),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Create new field" }));
    expect(
      screen.getByRole("checkbox", { name: "Allow more than one" }),
    ).not.toBeChecked();
    expect(screen.getByRole("alert")).toHaveTextContent(
      "2 entries store more than one value",
    );
    await user.click(screen.getByRole("button", { name: "Create new field" }));
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        configuration: expect.objectContaining({ multiple: false }),
      }),
      true,
    );
  });

  it("lets a multi option list become single when no entry stores several values", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(
      <WorldFieldEditor
        {...props}
        field={optionList({ label: "Tags" }, { multiple: true })}
        valueCount={7}
        onSave={onSave}
      />,
    );
    await user.click(
      screen.getByRole("checkbox", { name: "Allow more than one" }),
    );
    expect(screen.queryByRole("alert")).toBeNull();
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        configuration: expect.objectContaining({ multiple: false }),
      }),
      false,
    );
  });

  it("protects stored links when their category changes", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockResolvedValue(undefined);
    const reference = linkedEntry(locations.id);
    render(
      <WorldFieldEditor
        {...props}
        categories={[locations, npcs]}
        field={reference}
        fields={[reference]}
        valueCount={5}
        onSave={onSave}
      />,
    );
    expect(
      screen.getByRole("region", { name: "Field type" }),
    ).toHaveTextContent("Linked entry · Locations");
    await user.click(screen.getByRole("combobox", { name: /Category/ }));
    await user.click(screen.getByRole("option", { name: "NPCs" }));
    expect(screen.getByRole("alert")).toHaveTextContent("5 stored values");
    expect(screen.queryByRole("button", { name: "Save" })).toBeNull();
    await user.click(screen.getByRole("button", { name: "Create new field" }));
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        configuration: expect.objectContaining({ targetCategoryId: npcs.id }),
      }),
      true,
    );
  });
});

describe("WorldFieldEditor condition values", () => {
  const ENTRY = "44444444-4444-4444-4444-444444444444";
  const props = {
    worldId: "world-1",
    categories: [locations],
    valueCount: 0,
    multiValueCount: 0,
    readOnly: false,
    onSave: vi.fn(),
    onClose: vi.fn(),
  };
  const ruleWith = (condition: WorldFieldCondition) => [
    { conditions: [condition], visible: true },
  ];

  it.each([
    ["an empty Text value", undefined, ""],
    ["an empty linked entry", "linked", ""],
    ["a linked entry that is not an entry ID", "linked", "Brinehold"],
  ])("blocks saving a condition with %s", (_, kind, value) => {
    const source =
      kind === "linked"
        ? linkedEntry(locations.id, { id: "source", label: "Home" })
        : field({ id: "source", label: "Name" });
    const target = field({ id: "target", label: "Notes" });
    target.configuration.rules = ruleWith({
      source: "entry",
      fieldId: source.id,
      operator: "equals",
      value,
    });
    render(
      <WorldFieldEditor {...props} field={target} fields={[source, target]} />,
    );
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
    expect(
      screen.getByText(/Every rule needs at least one valid condition/),
    ).toBeInTheDocument();
  });

  it("accepts an entry ID for a linked entry, including a linked ancestor selector", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockResolvedValue(undefined);
    const home = linkedEntry(locations.id, { id: "home", label: "Home" });
    const target = field({ id: "target", label: "Notes" });
    target.configuration.rules = ruleWith({
      source: "ancestor",
      fieldId: home.id,
      operator: "equals",
      value: ENTRY,
      ancestor: { fieldId: home.id, value: "" },
    });
    const view = render(
      <WorldFieldEditor
        {...props}
        field={target}
        fields={[home, target]}
        onSave={onSave}
      />,
    );
    await user.type(
      screen.getByRole("textbox", { name: "Field label" }),
      " changed",
    );
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
    view.unmount();
    target.configuration.rules[0].conditions[0].ancestor = {
      fieldId: home.id,
      value: ENTRY,
    };
    render(
      <WorldFieldEditor
        {...props}
        field={target}
        fields={[home, target]}
        onSave={onSave}
      />,
    );
    await user.type(
      screen.getByRole("textbox", { name: "Field label" }),
      " changed",
    );
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(onSave).toHaveBeenCalled();
  });

  it.each([
    ["a compared value", "entry"],
    ["an ancestor selector value", "ancestor"],
  ])(
    "flags dependents whose %s a source's new kind cannot match",
    async (_, source) => {
      const user = userEvent.setup();
      const type = optionList({ id: "type", label: "Location Type" });
      const dependent = field({ id: "dependent", label: "Region" });
      dependent.configuration.rules = ruleWith(
        source === "entry"
          ? {
              source: "entry",
              fieldId: type.id,
              operator: "equals",
              value: "Planet",
            }
          : {
              source: "ancestor",
              fieldId: dependent.id,
              operator: "isNotEmpty",
              ancestor: { fieldId: type.id, value: "Area" },
            },
      );
      render(
        <WorldFieldEditor {...props} field={type} fields={[type, dependent]} />,
      );
      await user.click(screen.getByRole("button", { name: "Change type" }));
      await user.click(screen.getByRole("radio", { name: "Linked entry" }));
      await user.click(screen.getByRole("combobox", { name: /Category/ }));
      await user.click(screen.getByRole("option", { name: "Locations" }));
      expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
      expect(screen.getByRole("alert")).toHaveTextContent(
        "conditions in Region",
      );
    },
  );
});
