import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { Radio, RadioGroup } from "../../RadioGroup";
import { Checkbox } from "../Checkbox";

describe("Checkbox", () => {
  it("is named by its title and described by its description", () => {
    render(
      <Checkbox
        label="Wounded"
        description="You are injured and suffer -1 to health."
      />,
    );
    const checkbox = screen.getByRole("checkbox", { name: "Wounded" });
    expect(checkbox).toHaveAccessibleDescription(
      "You are injured and suffer -1 to health.",
    );
  });

  it("toggles when its description is pressed", async () => {
    const user = userEvent.setup();
    render(<Checkbox label="Shaken" description="-1 to spirit." />);
    const checkbox = screen.getByRole("checkbox", { name: "Shaken" });
    await user.click(screen.getByText("-1 to spirit."));
    expect(checkbox).toBeChecked();
  });

  it("keeps an aria-label as its name", () => {
    render(<Checkbox aria-label="Mark progress" />);
    expect(
      screen.getByRole("checkbox", { name: "Mark progress" }),
    ).toBeInTheDocument();
  });
});

describe("Radio", () => {
  it("is named by its title and chosen by pressing its description", async () => {
    const user = userEvent.setup();
    render(
      <RadioGroup label="Game type" description="You can change it later.">
        <Radio value="solo" label="Solo" description="One character." />
        <Radio value="guided" label="Guided" description="A Guide runs it." />
      </RadioGroup>,
    );
    const guided = screen.getByRole("radio", { name: "Guided" });
    expect(guided).toHaveAccessibleDescription(
      expect.stringContaining("A Guide runs it."),
    );
    await user.click(screen.getByText("A Guide runs it."));
    expect(guided).toBeChecked();
    expect(screen.getByRole("radiogroup")).toHaveAccessibleDescription(
      "You can change it later.",
    );
  });
});
