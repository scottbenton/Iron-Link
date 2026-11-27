import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ListRowButton } from "../ListRowButton";

describe("ListRowButton", () => {
  it("keeps a rendered link a link", () => {
    render(
      <ListRowButton render={<a href="/reference/face_danger" />} current>
        <span data-row-name="">Face Danger</span>
      </ListRowButton>,
    );
    const link = screen.getByRole("link", { name: "Face Danger" });
    expect(link).toHaveAttribute("href", "/reference/face_danger");
    expect(link).toHaveAttribute("aria-current", "page");
    expect(link).not.toHaveAttribute("tabindex");
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("is a button without a link", () => {
    render(
      <ListRowButton current>
        <span data-row-name="">Roll Action</span>
      </ListRowButton>,
    );
    expect(screen.getByRole("button", { name: "Roll Action" })).toHaveAttribute(
      "aria-current",
      "true",
    );
  });
});
