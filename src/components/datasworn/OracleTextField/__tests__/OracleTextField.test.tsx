/**
 * The oracle text field: the app's roller decides when a roll is offered and
 * what it gives, and the library field writes and announces it. The library
 * field never rolls itself; the app hands it a roller.
 */
import { fireEvent, render, renderHook, screen } from "@testing-library/react";
import {
  MockedFunction,
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import { AnnouncerProvider } from "ui/components/Announcer";
import { OracleTextField as LibraryOracleTextField } from "ui/game/OracleTextField";

import { getOracleCollection } from "hooks/datasworn/useOracleCollection";
import { getOracleRollable } from "hooks/datasworn/useOracleRollable";
import { useRollOracle } from "hooks/useRollOracle";

import { IOracleTableRoll } from "services/gameLog.service";

import { OracleTextFieldOracleConfig } from "../oracleTextFieldRoll";
import { useOracleTextFieldRoll } from "../useOracleTextFieldRoll";

vi.mock("hooks/datasworn/useOracleRollable", () => ({
  getOracleRollable: vi.fn(),
}));
vi.mock("hooks/datasworn/useOracleCollection", () => ({
  getOracleCollection: vi.fn(),
}));
vi.mock("hooks/useRollOracle", () => ({ useRollOracle: vi.fn() }));

const mockGetOracleRollable = getOracleRollable as MockedFunction<
  typeof getOracleRollable
>;
const mockGetOracleCollection = getOracleCollection as MockedFunction<
  typeof getOracleCollection
>;
const mockUseRollOracle = useRollOracle as MockedFunction<typeof useRollOracle>;

// Oracles that exist, and what each rolls.
const results: Record<string, string> = {
  "oracle_rollable:given": "Kai",
  "oracle_rollable:family": "Vale",
  "oracle_rollable:epithet": "the Bold",
  "oracle_collection:names": "",
};

beforeEach(() => {
  mockGetOracleRollable.mockImplementation((id) =>
    id in results && id.startsWith("oracle_rollable")
      ? ({ _id: id } as never)
      : undefined,
  );
  mockGetOracleCollection.mockImplementation((id) =>
    id.startsWith("oracle_collection") ? ({ _id: id } as never) : undefined,
  );
  mockUseRollOracle.mockReturnValue(
    (id: string) =>
      (id in results
        ? ({ result: results[id] } as IOracleTableRoll)
        : undefined) as IOracleTableRoll,
  );
});

afterEach(() => {
  vi.restoreAllMocks();
});

function rollWith(oracle: string | OracleTextFieldOracleConfig | undefined) {
  const { result } = renderHook(() => useOracleTextFieldRoll(oracle));
  return result.current;
}

describe("useOracleTextFieldRoll", () => {
  it("offers a roll only when one of its oracles exists", () => {
    const cases: [string | OracleTextFieldOracleConfig | undefined, boolean][] =
      [
        [undefined, false],
        ["oracle_rollable:given", true],
        ["oracle_collection:names", true],
        ["oracle_rollable:missing", false],
        [{ tableIds: ["oracle_rollable:missing"] }, false],
        [
          {
            tableIds: [
              "oracle_rollable:missing",
              { tableIds: ["oracle_rollable:family"] },
            ],
          },
          true,
        ],
      ];
    for (const [oracle, offered] of cases) {
      expect(rollWith(oracle).canRoll).toBe(offered);
    }
  });

  it("rolls one oracle's result", () => {
    expect(rollWith("oracle_rollable:given").roll()).toBe("Kai");
  });

  it("joins every table, nested ones too, with the separator", () => {
    expect(
      rollWith({
        joinTables: true,
        tableIds: [
          "oracle_rollable:given",
          {
            joinTables: true,
            joinSeparator: "-",
            tableIds: ["oracle_rollable:family", "oracle_rollable:epithet"],
          },
        ],
      }).roll(),
    ).toBe("Kai Vale-the Bold");
  });

  it("picks one table at random when it does not join them", () => {
    const random = vi.spyOn(Math, "random");
    const config = {
      tableIds: ["oracle_rollable:given", "oracle_rollable:family"],
    };
    random.mockReturnValue(0.99);
    expect(rollWith(config).roll()).toBe("Vale");
    random.mockReturnValue(0);
    expect(rollWith(config).roll()).toBe("Kai");
  });

  it("gives nothing when the roll fails", () => {
    mockUseRollOracle.mockReturnValue(
      () => undefined as unknown as IOracleTableRoll,
    );
    expect(rollWith("oracle_rollable:given").roll()).toBeUndefined();
  });
});

describe("library OracleTextField", () => {
  function rollLibrary(result: string | undefined) {
    const announce = vi.fn();
    const onValueChange = vi.fn();
    render(
      <AnnouncerProvider announce={announce}>
        <LibraryOracleTextField
          label="Name"
          oracleName="Given Name"
          onRoll={() => result}
          onValueChange={onValueChange}
        />
      </AnnouncerProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Roll Given Name" }));
    return {
      value: onValueChange.mock.calls[0]?.[0],
      announcement: announce.mock.calls[0]?.[0],
    };
  }

  it("writes and announces a result", () => {
    expect(rollLibrary("Kai")).toEqual({
      value: "Kai",
      announcement: "Updated Name to Kai",
    });
  });

  it("leaves the field and stays quiet when the roll gives nothing", () => {
    expect(rollLibrary(undefined)).toEqual({
      value: undefined,
      announcement: undefined,
    });
  });
});
