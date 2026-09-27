import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { WorldFieldType } from "services/worldFieldDefinitions.service";

import { WorldFieldEditor } from "../WorldFieldEditor";
import { field, translate } from "./fixtures";

vi.mock("lib/supabase.lib", () => ({ supabase: {} }));
vi.mock("react-i18next", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react-i18next")>()),
  useTranslation: () => ({ t: translate }),
}));
vi.mock("../../WorldOracleBindingPicker", () => ({
  WorldOracleBindingPicker: () => null,
}));

describe("WorldFieldEditor", () => {
  it("only saves an actual change so an untouched default stays inherited", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockResolvedValue(undefined);
    const definition = field();
    render(
      <WorldFieldEditor
        worldId="world-1"
        field={definition}
        fields={[]}
        valueCount={0}
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

  it("names dependent public fields before making their source GM-only", async () => {
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
        field={source}
        fields={[source, dependent]}
        valueCount={0}
        readOnly={false}
        onSave={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    await user.click(screen.getByRole("checkbox", { name: /GM only \(also/ }));
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
    expect(screen.getByRole("alert")).toHaveTextContent("conditions in Region");
  });

  it("blocks a source type change that invalidates an ancestor selector", async () => {
    const user = userEvent.setup();
    const source = field({ label: "Location Type" });
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
        field={source}
        fields={[source, dependent]}
        valueCount={0}
        readOnly={false}
        onSave={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    await user.click(screen.getByRole("combobox", { name: "Field type" }));
    await user.click(screen.getByRole("option", { name: "Number" }));
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
        field={definition}
        fields={[definition]}
        valueCount={0}
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

  it("preserves a compatible rich text to oracle text change", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(
      <WorldFieldEditor
        worldId="world-1"
        field={field({ type: WorldFieldType.RichText })}
        fields={[]}
        valueCount={7}
        readOnly={false}
        onSave={onSave}
        onClose={vi.fn()}
      />,
    );
    await user.click(screen.getByRole("combobox", { name: "Field type" }));
    await user.click(screen.getByRole("option", { name: "Oracle text" }));
    await user.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() =>
      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({ type: WorldFieldType.OracleText }),
        false,
      ),
    );
  });

  it("blocks incompatible changes with values and offers creation instead", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(
      <WorldFieldEditor
        worldId="world-1"
        field={field()}
        fields={[]}
        valueCount={7}
        readOnly={false}
        onSave={onSave}
        onClose={vi.fn()}
      />,
    );
    await user.click(screen.getByRole("combobox", { name: "Field type" }));
    await user.click(screen.getByRole("option", { name: "Number" }));
    expect(screen.getByRole("alert")).toHaveTextContent("7 stored values");
    expect(
      screen.queryByRole("button", { name: "Save" }),
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Create new field" }));
    await waitFor(() =>
      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({ type: WorldFieldType.Number }),
        true,
      ),
    );
  });

  it("allows incompatible changes when no values exist and keeps keys out of editable inputs", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(
      <WorldFieldEditor
        worldId="world-1"
        field={field()}
        fields={[]}
        valueCount={0}
        readOnly={false}
        onSave={onSave}
        onClose={vi.fn()}
      />,
    );
    await user.click(screen.getByRole("combobox", { name: "Field type" }));
    await user.click(screen.getByRole("option", { name: "Number" }));
    expect(
      screen.queryByRole("textbox", { name: /key/i }),
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() =>
      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({ type: WorldFieldType.Number }),
        false,
      ),
    );
  });

  it("requires GM visibility for rules that read a GM-only source", async () => {
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
        field={target}
        fields={[target, source]}
        valueCount={0}
        readOnly={false}
        onSave={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
    expect(screen.getByRole("alert")).toHaveTextContent("GM-only source");
    await user.click(screen.getByRole("checkbox", { name: /GM only \(also/ }));
    expect(screen.getByRole("button", { name: "Save" })).toBeEnabled();
  });
});
