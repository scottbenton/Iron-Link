import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { WorldFieldConditionEditor } from "../WorldFieldConditionEditor";
import { field, translate } from "./fixtures";

vi.mock("lib/supabase.lib", () => ({ supabase: {} }));
vi.mock("react-i18next", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react-i18next")>()),
  useTranslation: () => ({ t: translate }),
}));

describe("WorldFieldConditionEditor", () => {
  it("chooses the nearest ancestor selector using UUIDs for repeated labels", async () => {
    const user = userEvent.setup();
    const first = field({ label: "Type" });
    const second = field({
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
    await user.click(screen.getByRole("option", { name: "Type (Text, 2)" }));
    expect(onChange).toHaveBeenCalledWith({
      ...condition,
      ancestor: { fieldId: second.id, value: "Area" },
    });
  });
});
