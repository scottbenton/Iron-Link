import { Dialog, DialogContent } from "@mui/material";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { TestWrapper } from "tests/TestWrapper";

import { DialogTitleWithCloseButton } from "../DialogTitleWithCloseButton";

describe("DialogTitleWithCloseButton", () => {
  it("names the dialog by its title alone", () => {
    render(
      <Dialog open>
        <DialogTitleWithCloseButton
          onClose={() => {}}
          actions={<button type="button">Back</button>}
        >
          Face Danger
        </DialogTitleWithCloseButton>
        <DialogContent>Body</DialogContent>
      </Dialog>,
      { wrapper: TestWrapper },
    );

    expect(
      screen.getByRole("dialog", { name: "Face Danger" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: "Face Danger" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Close Dialog" }),
    ).toBeInTheDocument();
  });
});
