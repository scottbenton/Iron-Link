import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { RollCard } from "../RollCard";
import { withstandDamageMissMatch } from "../RollCard.fixtures";

describe("RollCard actions", () => {
  it("keeps the common actions in the row and the rest in its menu", async () => {
    const user = userEvent.setup();
    const reroll = vi.fn();
    render(
      <RollCard
        roll={withstandDamageMissMatch}
        actions={[
          { id: "copy", label: "Copy", onClick: vi.fn() },
          { id: "reroll", label: "Reroll", onClick: reroll, inMenu: true },
          {
            id: "delete",
            label: "Delete",
            onClick: vi.fn(),
            inMenu: true,
            tone: "danger",
          },
        ]}
      />,
    );

    expect(screen.getByRole("button", { name: "Copy" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Reroll" })).toBeNull();

    await user.click(
      screen.getByRole("button", {
        name: "More actions for Withstand Damage",
      }),
    );
    expect(
      await screen.findByRole("menuitem", { name: "Delete" }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("menuitem", { name: "Reroll" }));
    expect(reroll).toHaveBeenCalledOnce();
  });
});
