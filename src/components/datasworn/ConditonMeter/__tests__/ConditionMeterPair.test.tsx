/**
 * Meters, app and library side by side (migration slice 4): how a value is
 * written, what its steppers are called and what a step says.
 */
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AnnouncerProvider } from "ui/components/Announcer";
import { ConditionMeter as LibraryConditionMeter } from "ui/game/ConditionMeter/ConditionMeter";
import { formatSigned } from "ui/game/shared/format";

import { useAppState } from "stores/appState.store";

import { formatSignedValue } from "lib/formatSignedValue";

import { TestWrapper } from "tests/TestWrapper";

import { ConditionMeter } from "../ConditionMeter";

describe("signed values, app and library", () => {
  it("agree away from zero, apart from the minus sign", () => {
    expect(
      [-3, -1, 0, 1, 3].map((value) => ({
        value,
        app: formatSignedValue(value),
        library: formatSigned(value),
      })),
    ).toEqual([
      { value: -3, app: "-3", library: "−3" },
      { value: -1, app: "-1", library: "−1" },
      { value: 0, app: "+0", library: "0" },
      { value: 1, app: "+1", library: "+1" },
      { value: 3, app: "+3", library: "+3" },
    ]);
  });
});

describe("meter steps, app and library", () => {
  function stepApp(value: number, button: RegExp) {
    const { unmount } = render(
      <ConditionMeter
        label="Health"
        defaultValue={value}
        value={value}
        min={-2}
        max={5}
        onChange={vi.fn()}
      />,
      { wrapper: TestWrapper },
    );
    const control = screen.getByRole("button", { name: button });
    const name = control.getAttribute("aria-label");
    fireEvent.click(control);
    const announcement = useAppState.getState().announcement;
    unmount();
    return { name, announcement };
  }

  function stepLibrary(value: number, button: RegExp) {
    const announce = vi.fn();
    render(
      <AnnouncerProvider announce={announce}>
        <LibraryConditionMeter
          label="Health"
          value={value}
          min={-2}
          max={5}
          onChange={vi.fn()}
        />
      </AnnouncerProvider>,
    );
    const control = screen.getByRole("button", { name: button });
    const name = control.getAttribute("aria-label");
    fireEvent.click(control);
    return { name, announcement: announce.mock.calls[0]?.[0] };
  }

  const steps = [
    {
      from: 1,
      button: /subtract/i,
      app: { name: "subtract 1 from Health", announcement: "Health is now +0" },
      library: {
        name: "Subtract 1 from Health",
        announcement: "Health is now 0",
      },
    },
    {
      from: 0,
      button: /subtract/i,
      app: { name: "subtract 1 from Health", announcement: "Health is now -1" },
      library: {
        name: "Subtract 1 from Health",
        announcement: "Health is now −1",
      },
    },
    {
      from: -1,
      button: /add 1/i,
      app: { name: "add 1 to Health", announcement: "Health is now +0" },
      library: { name: "Add 1 to Health", announcement: "Health is now 0" },
    },
    {
      from: 3,
      button: /add 1/i,
      app: { name: "add 1 to Health", announcement: "Health is now +4" },
      library: { name: "Add 1 to Health", announcement: "Health is now +4" },
    },
  ];

  it.each(steps)("from $from", ({ from, button, app, library }) => {
    expect(stepApp(from, button)).toEqual(app);
    expect(stepLibrary(from, button)).toEqual(library);
  });
});
