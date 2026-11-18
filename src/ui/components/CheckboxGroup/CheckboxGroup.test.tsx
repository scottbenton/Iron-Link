import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Checkbox } from "../Checkbox";
import { Radio, RadioGroup } from "../RadioGroup";
import { CheckboxGroup } from "./CheckboxGroup";

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
