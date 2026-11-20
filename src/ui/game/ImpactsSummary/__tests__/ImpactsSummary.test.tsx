import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ImpactsSummary } from "../ImpactsSummary";

// jsdom has no PointerEvent; Base UI's checkbox dispatches one on click.
if (!("PointerEvent" in window)) {
  Object.assign(window, { PointerEvent: MouseEvent });
}

const groups = [
  {
    key: "misfortunes",
    label: "misfortunes",
    impacts: [
      { key: "wounded", label: "wounded" },
      { key: "shaken", label: "shaken" },
    ],
  },
];

describe("ImpactsSummary", () => {
  it("lists marked impacts, or None", () => {
    const { rerender } = render(
      <ImpactsSummary groups={groups} value={{ wounded: true }} />,
    );
    expect(
      screen.getByRole("list", { name: "Active Impacts" }),
    ).toHaveTextContent("Wounded");
    expect(screen.queryByRole("button", { name: "Edit Impacts" })).toBeNull();
    rerender(<ImpactsSummary groups={groups} value={{}} />);
    expect(screen.getByText("None")).toBeInTheDocument();
  });

  it("saves each tick at once and closes with Done", async () => {
    const user = userEvent.setup();
    const onImpactChange = vi.fn();
    render(
      <ImpactsSummary
        groups={groups}
        value={{ wounded: true }}
        onImpactChange={onImpactChange}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Edit Impacts" }));
    const shaken = screen.getByRole("checkbox", { name: "Shaken" });
    await user.click(shaken);
    expect(onImpactChange).toHaveBeenCalledWith("shaken", true);
    // Enter on a checkbox does not close the dialog: it is not a form.
    shaken.focus();
    await user.keyboard("{Enter}");
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Done" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  it("reverts a failed tick and keeps the error", async () => {
    const user = userEvent.setup();
    render(
      <ImpactsSummary
        groups={groups}
        value={{}}
        onImpactChange={() => Promise.reject(new Error("offline"))}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Edit Impacts" }));
    await user.click(screen.getByRole("checkbox", { name: "Wounded" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Wounded could not be saved",
    );
    expect(screen.getByRole("checkbox", { name: "Wounded" })).not.toBeChecked();
  });

  it("says Debilities for Ironsworn", () => {
    render(
      <ImpactsSummary
        groups={groups}
        value={{}}
        wording="ironsworn"
        onImpactChange={() => {}}
      />,
    );
    expect(screen.getByText("Active Debilities")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Edit Debilities" }),
    ).toBeInTheDocument();
  });
});
