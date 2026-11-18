import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useWorldOracleChangesStore } from "stores/worldOracleChanges.store";

import type { IWorldOracleChange } from "services/worldOracleChanges.service";

import { WorldFieldOracleChangesMenu } from "../WorldFieldOracleChangesMenu";
import { translate } from "./fixtures";

const announce = vi.hoisted(() => vi.fn());
const resolveChange = vi.hoisted(() => vi.fn());
vi.mock("lib/supabase.lib", () => ({ supabase: {} }));
vi.mock("react-i18next", async (original) => ({
  ...(await original<typeof import("react-i18next")>()),
  useTranslation: () => ({ t: translate }),
}));
vi.mock("stores/appState.store", () => ({
  useSetAnnouncement: () => announce,
}));
vi.mock("providers/SnackbarProvider", () => ({
  useSnackbar: () => ({ error: vi.fn() }),
}));
vi.mock("services/worldOracleChanges.service", () => ({
  WorldOracleChangesService: { resolveChange },
}));

const changes = ["field", "rule"].map(
  (id) => ({ id, fieldId: "region" }) as IWorldOracleChange,
);

beforeEach(() => {
  useWorldOracleChangesStore.getState().reset();
  announce.mockReset();
  resolveChange.mockReset().mockResolvedValue(true);
});

describe("WorldFieldOracleChangesMenu", () => {
  it.each([
    ["Follow the playsets", false, "Region follows the playsets"],
    ["Always roll the old oracle", true, "Region rolls its old oracle again"],
  ])("%s settles every flagged binding", async (item, keep, message) => {
    const user = userEvent.setup();
    render(
      <WorldFieldOracleChangesMenu
        label="Region"
        changes={changes}
        disabled={false}
        onChooseAnother={vi.fn()}
      />,
    );
    await user.click(
      screen.getByRole("button", { name: "Fix oracle change for Region" }),
    );
    await user.click(screen.getByRole("menuitem", { name: item }));
    expect(resolveChange.mock.calls).toEqual([
      ["field", keep],
      ["rule", keep],
    ]);
    expect(announce).toHaveBeenCalledWith(message);
  });

  it("opens the field editor to choose another oracle", async () => {
    const user = userEvent.setup();
    const onChooseAnother = vi.fn();
    render(
      <WorldFieldOracleChangesMenu
        label="Region"
        changes={changes}
        disabled={false}
        onChooseAnother={onChooseAnother}
      />,
    );
    await user.click(
      screen.getByRole("button", { name: "Fix oracle change for Region" }),
    );
    await user.click(
      screen.getByRole("menuitem", { name: "Choose another oracle" }),
    );
    expect(onChooseAnother).toHaveBeenCalled();
    expect(resolveChange).not.toHaveBeenCalled();
  });
});
