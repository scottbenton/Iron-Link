import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useWorldCategoriesStore } from "stores/worldCategories.store";
import { useWorldEntriesStore } from "stores/worldEntries.store";

import type { WorldFieldCondition } from "lib/worldFieldRules";

import type { IWorldEntry } from "services/worldEntries.service";
import { WorldFieldType } from "services/worldFieldDefinitions.service";

import { WorldFieldConditionEditor } from "../WorldFieldConditionEditor";
import { field, linkedEntry, optionList, translate } from "./fixtures";

const LOCATIONS = "11111111-1111-4111-8111-111111111111";
const NPCS = "22222222-2222-4222-8222-222222222222";
const getFieldOptions = vi.fn();

function entry(id: string, name: string, categoryId: string): IWorldEntry {
  return { id, name, categoryId } as IWorldEntry;
}

beforeEach(() => {
  getFieldOptions.mockReset().mockResolvedValue(["Planet", "Settlement"]);
  useWorldCategoriesStore.setState({ getFieldOptions });
  useWorldEntriesStore.setState({
    entryState: {
      entries: {
        brinehold: entry("brinehold", "Brinehold", LOCATIONS),
        greyport: entry("greyport", "Greyport", LOCATIONS),
        kira: entry("kira", "Kira", NPCS),
      },
      permissions: {},
      loading: false,
    },
  });
});

function renderCondition(
  condition: WorldFieldCondition,
  fields: Parameters<typeof WorldFieldConditionEditor>[0]["fields"],
) {
  const onChange = vi.fn();
  render(
    <WorldFieldConditionEditor
      condition={condition}
      fields={fields}
      disabled={false}
      onChange={onChange}
      onRemove={vi.fn()}
    />,
  );
  return onChange;
}

async function operatorNames(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("combobox", { name: "Comparison" }));
  const names = screen
    .getAllByRole("option")
    .map((option) => option.textContent);
  await user.keyboard("{Escape}");
  return names;
}

vi.mock("lib/supabase.lib", () => ({ supabase: {} }));
vi.mock("react-i18next", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react-i18next")>()),
  useTranslation: () => ({ t: translate }),
}));

describe("WorldFieldConditionEditor", () => {
  it("chooses the nearest ancestor selector using UUIDs for repeated labels", async () => {
    const user = userEvent.setup();
    const first = optionList({ label: "Type" });
    const second = optionList({
      id: "bbbbbbbb-0000-4000-8000-000000000000",
      label: "Type",
    });
    const onChange = vi.fn();
    const condition = {
      source: "ancestor" as const,
      fieldId: first.id,
      operator: "equals" as const,
      value: "Reaches",
      ancestor: { fieldId: first.id, value: "Area" },
    };
    render(
      <WorldFieldConditionEditor
        condition={condition}
        fields={[first, second]}
        disabled={false}
        onChange={onChange}
        onRemove={vi.fn()}
      />,
    );
    expect(
      screen.getByRole("combobox", { name: "Read value from" }),
    ).toHaveTextContent("Nearest matching ancestor");
    await user.click(
      screen.getByRole("combobox", { name: "Ancestor selector field" }),
    );
    await user.click(
      screen.getByRole("option", { name: "Type (Option list, 2)" }),
    );
    expect(onChange).toHaveBeenCalledWith({
      ...condition,
      // The selector value is picked from that field's own options.
      ancestor: { fieldId: second.id, value: "" },
    });
  });

  it("offers the operators for each source and never reads long text", async () => {
    const user = userEvent.setup();
    const text = field({ id: "text", label: "Name" });
    const tags = optionList({ id: "tags", label: "Tags" }, { multiple: true });
    const notes = field({
      id: "notes",
      label: "Notes",
      type: WorldFieldType.RichText,
    });
    renderCondition(
      { source: "entry", fieldId: text.id, operator: "equals", value: "" },
      [text, tags, notes],
    );
    expect(await operatorNames(user)).toEqual([
      "Equals",
      "Does not equal",
      "Is empty",
      "Is not empty",
    ]);
    await user.click(screen.getByRole("combobox", { name: "Source field" }));
    expect(screen.queryByRole("option", { name: "Notes" })).toBeNull();
    await user.keyboard("{Escape}");
  });

  it("offers contains for fields that allow more than one", async () => {
    const user = userEvent.setup();
    const tags = optionList({ id: "tags", label: "Tags" }, { multiple: true });
    const onChange = renderCondition(
      { source: "entry", fieldId: tags.id, operator: "contains", value: "" },
      [tags],
    );
    expect(await operatorNames(user)).toEqual([
      "Contains",
      "Does not contain",
      "Is empty",
      "Is not empty",
    ]);
    await user.click(
      screen.getByRole("combobox", { name: "Comparison value" }),
    );
    await user.click(await screen.findByRole("option", { name: "Planet" }));
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ operator: "contains", value: "Planet" }),
    );
    expect(getFieldOptions).toHaveBeenCalledWith(tags.id);
  });

  it("keeps a valid operator and clears the value when the source changes", async () => {
    const user = userEvent.setup();
    const type = optionList({ id: "type", label: "Type" });
    const tags = optionList({ id: "tags", label: "Tags" }, { multiple: true });
    const onChange = renderCondition(
      { source: "entry", fieldId: type.id, operator: "isEmpty" },
      [type, tags],
    );
    await user.click(screen.getByRole("combobox", { name: "Source field" }));
    await user.click(screen.getByRole("option", { name: "Tags" }));
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ fieldId: tags.id, operator: "isEmpty" }),
    );
  });

  it("picks only listed values from a strict list", async () => {
    const user = userEvent.setup();
    const region = optionList(
      { id: "region", label: "Region" },
      { allowOther: false },
    );
    const onChange = renderCondition(
      { source: "entry", fieldId: region.id, operator: "equals", value: "" },
      [region],
    );
    const input = screen.getByRole("combobox", { name: "Comparison value" });
    await user.type(input, "Planett");
    await user.tab();
    expect(onChange).not.toHaveBeenCalled();
    await user.clear(input);
    await user.type(input, "Plan");
    await user.click(await screen.findByRole("option", { name: "Planet" }));
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ value: "Planet" }),
    );
  });

  it("accepts a new value for Text and open lists", async () => {
    const user = userEvent.setup();
    const type = optionList({ id: "type", label: "Type" });
    const onChange = renderCondition(
      { source: "entry", fieldId: type.id, operator: "equals", value: "" },
      [type],
    );
    await waitFor(() => expect(getFieldOptions).toHaveBeenCalled());
    await user.type(
      screen.getByRole("combobox", { name: "Comparison value" }),
      "Derelict{Enter}",
    );
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ value: "Derelict" }),
    );
  });

  it("picks an entry from the linked category and shows its name", async () => {
    const user = userEvent.setup();
    const home = linkedEntry(LOCATIONS, { id: "home", label: "Home" });
    const onChange = renderCondition(
      {
        source: "entry",
        fieldId: home.id,
        operator: "equals",
        value: "greyport",
      },
      [home],
    );
    const input = screen.getByRole("combobox", { name: "Comparison value" });
    expect(input).toHaveValue("Greyport");
    expect(getFieldOptions).not.toHaveBeenCalled();
    await user.click(input);
    expect(
      screen.getAllByRole("option").map((option) => option.textContent),
    ).toEqual(["Brinehold", "Greyport"]);
    await user.click(screen.getByRole("option", { name: "Brinehold" }));
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ value: "brinehold" }),
    );
  });

  it("restricts ancestor selectors to single option lists and linked entries", async () => {
    const user = userEvent.setup();
    const type = optionList({ id: "type", label: "Type" });
    const tags = optionList({ id: "tags", label: "Tags" }, { multiple: true });
    const name = field({ id: "name", label: "Name" });
    const region = linkedEntry(LOCATIONS, { id: "region", label: "Region" });
    renderCondition(
      {
        source: "ancestor",
        fieldId: name.id,
        operator: "isNotEmpty",
        ancestor: { fieldId: type.id, value: "" },
      },
      [type, tags, name, region],
    );
    await user.click(
      screen.getByRole("combobox", { name: "Ancestor selector field" }),
    );
    expect(
      screen.getAllByRole("option").map((option) => option.textContent),
    ).toEqual(["Type", "Region"]);
  });
});
