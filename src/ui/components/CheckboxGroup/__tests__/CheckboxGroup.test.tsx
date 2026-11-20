import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { Checkbox } from "../../Checkbox";
import { Radio, RadioGroup } from "../../RadioGroup";
import { CheckboxGroup } from "../CheckboxGroup";

describe("group help", () => {
  it("describes the group, not each choice again", () => {
    render(
      <>
        <CheckboxGroup
          label="Player permissions"
          description="Guides can always do these."
        >
          <Checkbox
            value="notes"
            label="Add shared notes"
            description="Notes every player can read."
          />
        </CheckboxGroup>
        <RadioGroup label="Game type" description="You can change it later.">
          <Radio value="solo" label="Solo" description="One character." />
        </RadioGroup>
      </>,
    );
    expect(
      screen.getByRole("group", { name: "Player permissions" }),
    ).toHaveAccessibleDescription("Guides can always do these.");
    expect(
      screen.getByRole("checkbox", { name: "Add shared notes" }),
    ).toHaveAccessibleDescription("Notes every player can read.");
    expect(
      screen.getByRole("radiogroup", { name: "Game type" }),
    ).toHaveAccessibleDescription("You can change it later.");
    expect(
      screen.getByRole("radio", { name: "Solo" }),
    ).toHaveAccessibleDescription("One character.");
  });
});

describe("select all", () => {
  function renderMeters(defaultValue: string[]) {
    render(
      <CheckboxGroup
        label="Reset meters"
        allLabel="All meters"
        allValues={["health", "spirit", "supply"]}
        defaultValue={defaultValue}
      >
        <Checkbox value="health" label="Health" />
        <Checkbox value="spirit" label="Spirit" />
        <Checkbox value="supply" label="Supply" />
      </CheckboxGroup>,
    );
  }
  const states = () =>
    ["All meters", "Health", "Spirit", "Supply"].map((name) =>
      screen.getByRole("checkbox", { name }).getAttribute("aria-checked"),
    );

  it("nests the choices in a group named by the select all box", () => {
    renderMeters([]);
    const nested = screen.getByRole("group", { name: "All meters" });
    expect(within(nested).getAllByRole("checkbox")).toHaveLength(3);
    expect(
      within(nested).queryByRole("checkbox", { name: "All meters" }),
    ).toBeNull();
  });

  it("ticks all in one press from some, then clears all", async () => {
    const user = userEvent.setup();
    renderMeters(["health"]);
    expect(states()).toEqual(["mixed", "true", "false", "false"]);
    await user.click(screen.getByText("All meters"));
    expect(states()).toEqual(["true", "true", "true", "true"]);
    await user.click(screen.getByText("All meters"));
    expect(states()).toEqual(["false", "false", "false", "false"]);
  });

  // Base UI's parent checkbox brought back the earlier choices (Health
  // alone) on the press after clearing, and needed a second press for all.
  it("ticks all in one press after clearing them", async () => {
    const user = userEvent.setup();
    renderMeters(["health"]);
    await user.click(screen.getByText("All meters"));
    await user.click(screen.getByText("All meters"));
    await user.click(screen.getByText("All meters"));
    expect(states()).toEqual(["true", "true", "true", "true"]);
  });

  it("ticks all in one press after the choices were cleared one by one", async () => {
    const user = userEvent.setup();
    renderMeters(["health", "spirit"]);
    await user.click(screen.getByText("Health"));
    await user.click(screen.getByText("Spirit"));
    await user.click(screen.getByText("All meters"));
    expect(states()).toEqual(["true", "true", "true", "true"]);
  });
});
