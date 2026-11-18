import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { TextField } from "../TextField";

describe("FieldShell", () => {
  it("puts help under the label and the error under the control", () => {
    render(
      <TextField
        label="Character Name"
        description="Shown on your sheet."
        error="That name is taken."
      />,
    );
    const input = screen.getByRole("textbox", { name: "Character Name" });
    const help = screen.getByText("Shown on your sheet.");
    const error = screen.getByText("That name is taken.");
    const follows = (a: Node, b: Node) =>
      Boolean(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);
    expect(follows(help, input)).toBe(true);
    expect(follows(input, error)).toBe(true);
    expect(input).toHaveAccessibleDescription(
      expect.stringContaining("Shown on your sheet."),
    );
    expect(input).toHaveAccessibleDescription(
      expect.stringContaining("That name is taken."),
    );
  });
});
