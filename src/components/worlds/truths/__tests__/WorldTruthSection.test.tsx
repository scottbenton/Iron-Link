import type { Datasworn } from "@datasworn-community/core";
import starforged from "@datasworn-community/starforged/json/starforged.json";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { WorldTruthSection } from "../WorldTruthSection";

vi.mock("lib/supabase.lib", () => ({ supabase: {} }));

const cataclysm = (starforged as unknown as Datasworn.Ruleset).truths!
  .cataclysm;
const chosen = cataclysm.options[1];
const subRow = Object.values(chosen.oracles!)[0].rows[2];

const actions = () => ({
  choose: vi.fn(),
  roll: vi.fn(),
  rollSubOption: vi.fn(),
  rollUnchosen: vi.fn(),
  writeOwn: vi.fn(() => Promise.resolve()),
});

const renderSection = (
  canEdit: boolean,
  choice?: Parameters<typeof WorldTruthSection>[0]["choice"],
  questStarter?: string,
) => {
  const handlers = actions();
  render(
    <WorldTruthSection
      number={1}
      truth={cataclysm}
      choice={choice}
      questStarter={questStarter}
      canEdit={canEdit}
      actions={handlers}
    />,
  );
  return handlers;
};

describe("WorldTruthSection", () => {
  it("shows Guides every option with its quest starter and chooses on click", async () => {
    const handlers = renderSection(true, {
      truthId: cataclysm._id,
      optionId: chosen._id,
      subOptionId: subRow._id,
      customDescription: null,
    });
    expect(
      screen.getByRole("heading", { name: "1. Cataclysm" }),
    ).toBeInTheDocument();
    const cards = screen.getAllByRole("button", { pressed: false });
    expect(cards).toHaveLength(cataclysm.options.length - 1);
    expect(screen.getByRole("button", { pressed: true })).toBeInTheDocument();
    expect(screen.getAllByText("Quest starter")).toHaveLength(
      cataclysm.options.length,
    );
    expect(
      screen.getByRole("radio", { name: new RegExp(subRow.text) }),
    ).toBeChecked();

    await userEvent.click(cards[0]);
    expect(handlers.choose).toHaveBeenCalledWith(
      cataclysm._id,
      cataclysm.options[0]._id,
      null,
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Roll Cataclysm" }),
    );
    expect(handlers.roll).toHaveBeenCalledWith(cataclysm);
  });

  it("writes your own truth with a Guide-only quest starter", async () => {
    const handlers = renderSection(true);
    await userEvent.click(
      screen.getByRole("button", { name: "Write your own truth" }),
    );
    const dialog = screen.getByRole("dialog");
    await userEvent.type(
      within(dialog).getByRole("textbox", { name: /Description/ }),
      "We burned it ourselves.",
    );
    await userEvent.type(
      within(dialog).getByRole("textbox", { name: "Quest starter" }),
      "Find the spark.{Enter}",
    );
    await userEvent.click(within(dialog).getByRole("button", { name: "Save" }));
    expect(handlers.writeOwn).toHaveBeenCalledWith(
      cataclysm._id,
      "We burned it ourselves.",
      "Find the spark.",
    );
  });

  it("shows players only the chosen option, without quest starters", () => {
    renderSection(false, {
      truthId: cataclysm._id,
      optionId: chosen._id,
      subOptionId: subRow._id,
      customDescription: null,
    });
    expect(screen.queryByText("Quest starter")).not.toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.getByText(subRow.text)).toBeInTheDocument();
    expect(
      screen.queryByText(cataclysm.options[0].description.slice(0, 40), {
        exact: false,
      }),
    ).not.toBeInTheDocument();
  });

  it("tells players a truth is not chosen yet", () => {
    renderSection(false);
    expect(screen.getByText("Not chosen yet.")).toBeInTheDocument();
  });
});
