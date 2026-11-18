import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { translate } from "components/worlds/categories/__tests__/fixtures";

import type { WorldOracleChangePreview } from "services/worldOracleChanges.service";

import {
  type WorldOracleChangesRequest,
  useWorldOracleChangesDialog,
} from "../useWorldOracleChangesDialog";

vi.mock("lib/supabase.lib", () => ({ supabase: {} }));
vi.mock("react-i18next", async (original) => ({
  ...(await original<typeof import("react-i18next")>()),
  useTranslation: () => ({ t: translate }),
}));

const preview = (changed: boolean): WorldOracleChangePreview =>
  ({
    worldId: "world-a",
    worldName: "Ironlands",
    changes: changed
      ? [
          {
            worldId: "world-a",
            fieldId: "region",
            ruleIndex: 1,
            previousOracleId: "oracle_rollable:starforged/oracles/region",
            nextOracleId: "oracle_rollable:starsmith/oracles/region",
          },
        ]
      : [],
    configuration: {
      fieldDefinitions: {
        region: { id: "region", label: "Region", categoryId: "sectors" },
      },
      categories: { sectors: { id: "sectors", name: "Sectors" } },
    },
    oracleLabels: {
      "oracle_rollable:starsmith/oracles/region": "Starsmith Region",
    },
  }) as unknown as WorldOracleChangePreview;

let confirm: (request: WorldOracleChangesRequest) => Promise<boolean>;
function Harness() {
  const dialog = useWorldOracleChangesDialog();
  confirm = dialog.confirm;
  return <>{dialog.dialog}</>;
}

function request(
  overrides: Partial<WorldOracleChangesRequest>,
): WorldOracleChangesRequest {
  return {
    title: "Change Game Ruleset",
    confirmLabel: "Save",
    loadPreviews: () => Promise.resolve([preview(false)]),
    save: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe("useWorldOracleChangesDialog", () => {
  it("saves straight away when no field would roll a different oracle", async () => {
    render(<Harness />);
    const save = vi.fn().mockResolvedValue(undefined);
    let saved: boolean | undefined;
    await act(async () => {
      saved = await confirm(request({ save }));
    });
    expect(saved).toBe(true);
    expect(save).toHaveBeenCalledWith([]);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("asks what each moved field rolls, defaulting to the new oracle", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const save = vi.fn().mockResolvedValue(undefined);
    let result: Promise<boolean> | undefined;
    await act(async () => {
      result = confirm(
        request({
          loadPreviews: () => Promise.resolve([preview(true)]),
          save,
        }),
      );
    });
    const dialog = await screen.findByRole("dialog", {
      name: "Change Game Ruleset",
    });
    const field = within(dialog).getByRole("group", {
      name: "Sectors: Region, rule 2",
    });
    expect(
      within(field).getByRole("radio", { name: /Use the new oracle/ }),
    ).toBeChecked();
    // Labels fall back to the oracle's path when the catalog lacks it.
    expect(
      within(field).getByText("starforged/oracles/region"),
    ).toBeInTheDocument();
    expect(within(field).getByText("Starsmith Region")).toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: "Save" }));
    expect(save).toHaveBeenCalledWith([
      {
        worldId: "world-a",
        fieldId: "region",
        ruleIndex: 1,
        previousOracleId: "oracle_rollable:starforged/oracles/region",
        nextOracleId: "oracle_rollable:starsmith/oracles/region",
        keep: false,
      },
    ]);
    await expect(result).resolves.toBe(true);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("confirms anyway when asked, and offers a retry when the check fails", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const loadPreviews = vi
      .fn()
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValue([preview(false)]);
    vi.spyOn(console, "error").mockImplementation(() => {});
    let result: Promise<boolean> | undefined;
    act(() => {
      result = confirm(
        request({ title: "Unlink World", alwaysConfirm: true, loadPreviews }),
      );
    });
    const dialog = await screen.findByRole("dialog", { name: "Unlink World" });
    await user.click(
      await within(dialog).findByRole("button", { name: "Retry" }),
    );
    expect(loadPreviews).toHaveBeenCalledTimes(2);
    await user.click(within(dialog).getByRole("button", { name: "Cancel" }));
    await expect(result).resolves.toBe(false);
  });
});
