/**
 * The oracle text field, app and library side by side (migration slice 4):
 * when it offers a roll, what a roll writes and what it says. The library
 * field never rolls itself; the app hands it a roller.
 */
import { fireEvent, render, screen } from "@testing-library/react";
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

import { useAppState } from "stores/appState.store";

import { TestWrapper } from "tests/TestWrapper";

import { IOracleTableRoll } from "services/gameLog.service";

import {
  OracleTextField,
  OracleTextFieldOracleConfig,
} from "../OracleTextField";

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

function renderApp(props: {
  oracleId?: string;
  oracleConfig?: OracleTextFieldOracleConfig;
}) {
  const onChange = vi.fn();
  render(<OracleTextField label="Name" onChange={onChange} {...props} />, {
    wrapper: TestWrapper,
  });
  return onChange;
}

function rollApp(props: {
  oracleId?: string;
  oracleConfig?: OracleTextFieldOracleConfig;
}) {
  const onChange = renderApp(props);
  fireEvent.click(
    screen.getByRole("button", { name: "Consult the Oracle for Name" }),
  );
  return {
    value: onChange.mock.calls[0]?.[0],
    announcement: useAppState.getState().announcement,
  };
}

describe("app OracleTextField", () => {
  it("offers a roll only when one of its oracles exists", () => {
    const cases: [
      { oracleId?: string; oracleConfig?: OracleTextFieldOracleConfig },
      boolean,
    ][] = [
      [{}, false],
      [{ oracleId: "oracle_rollable:given" }, true],
      [{ oracleId: "oracle_collection:names" }, true],
      [{ oracleId: "oracle_rollable:missing" }, false],
      [{ oracleConfig: { tableIds: ["oracle_rollable:missing"] } }, false],
      [
        {
          oracleConfig: {
            tableIds: [
              "oracle_rollable:missing",
              { tableIds: ["oracle_rollable:family"] },
            ],
          },
        },
        true,
      ],
    ];
    for (const [props, offered] of cases) {
      renderApp(props);
      expect(
        !!screen.queryByRole("button", { name: "Consult the Oracle for Name" }),
      ).toBe(offered);
      document.body.innerHTML = "";
    }
  });

  it("writes and announces one oracle's result", () => {
    expect(rollApp({ oracleId: "oracle_rollable:given" })).toEqual({
      value: "Kai",
      announcement: "Updated Name to Kai",
    });
  });

  it("joins every table, nested ones too, with the separator", () => {
    expect(
      rollApp({
        oracleConfig: {
          joinTables: true,
          tableIds: [
            "oracle_rollable:given",
            {
              joinTables: true,
              joinSeparator: "-",
              tableIds: ["oracle_rollable:family", "oracle_rollable:epithet"],
            },
          ],
        },
      }).value,
    ).toBe("Kai Vale-the Bold");
  });

  it("picks one table at random when it does not join them", () => {
    const random = vi.spyOn(Math, "random");
    const oracleConfig = {
      tableIds: ["oracle_rollable:given", "oracle_rollable:family"],
    };
    random.mockReturnValue(0.99);
    expect(rollApp({ oracleConfig }).value).toBe("Vale");
    document.body.innerHTML = "";
    random.mockReturnValue(0);
    expect(rollApp({ oracleConfig }).value).toBe("Kai");
  });

  it("writes and announces an empty result when the roll fails", () => {
    mockUseRollOracle.mockReturnValue(
      () => undefined as unknown as IOracleTableRoll,
    );
    expect(rollApp({ oracleId: "oracle_rollable:given" })).toEqual({
      value: "",
      announcement: "Updated Name to ",
    });
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

  it("announces a result as the app does", () => {
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
