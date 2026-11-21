/**
 * Clocks, app and library side by side (migration slice 4): the dial's
 * wedges, what one press does and what a change says.
 */
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { wedgePath } from "ui/game/Clock/clockGeometry";
import { getDefaultClockStrings } from "ui/game/Clock/clockStrings";
import { advanceClock } from "ui/game/Clock/clockValue";

import { useAppState } from "stores/appState.store";

import { i18n } from "i18n/config";

import { TestWrapper } from "tests/TestWrapper";

import { ClockCircle } from "../ClockCircle";
import { ClockSegment } from "../ClockSegment";
import { DebouncedClockCircle } from "../DebouncedClockCircle";

const t = i18n.t.bind(i18n);
const strings = getDefaultClockStrings(t);

// A path's commands and its numbers rounded, so "z" and "Z" and float
// noise in the last place do not count.
function normalisePath(d: string): string[] {
  return d
    .trim()
    .split(/\s+/)
    .map((token) =>
      /^-?\d/.test(token)
        ? `${Math.round(Number(token) * 1000) / 1000}`
        : token.toUpperCase(),
    );
}

function renderSegmentPath(index: number, segments: number): string {
  const { container, unmount } = render(
    <svg>
      <ClockSegment index={index} segments={segments} filled={0} />
    </svg>,
    { wrapper: TestWrapper },
  );
  const d = container.querySelector("path")?.getAttribute("d") ?? "";
  unmount();
  return d;
}

describe("clock dial, app and library", () => {
  it.each([2, 3, 4, 5, 6, 8, 10, 12])(
    "draws the same %i wedges",
    (segments) => {
      for (let index = 0; index < segments; index++) {
        expect(normalisePath(renderSegmentPath(index, segments))).toEqual(
          normalisePath(wedgePath(index, segments)),
        );
      }
    },
  );

  it("differs on a one segment clock: the app's arc has no length", () => {
    expect(normalisePath(renderSegmentPath(0, 1))).toEqual(
      normalisePath("M 50 50 L 50 0 A 50 50 0 1 1 50 0 z"),
    );
    expect(wedgePath(0, 1)).toMatch(/^M 50 0 A/);
  });
});

describe("clock presses, app and library", () => {
  function pressThrough(segments: number, start: number, presses: number) {
    const onChange = vi.fn();
    render(
      <DebouncedClockCircle
        voiceLabel="Siege"
        segments={segments}
        value={start}
        onFilledSegmentsChange={onChange}
      />,
      { wrapper: TestWrapper },
    );
    const seen: { value: string | null; announcement: string | null }[] = [];
    for (let press = 0; press < presses; press++) {
      fireEvent.click(screen.getByRole("button"));
      seen.push({
        value: screen.getByRole("button").getAttribute("aria-label"),
        announcement: useAppState.getState().announcement,
      });
    }
    return seen;
  }

  it("fills a segment a press, as the library advances", () => {
    const seen = pressThrough(4, 0, 4);
    seen.forEach(({ announcement }, press) => {
      const value = advanceClock(press, 4);
      expect(announcement).toBe(
        strings.changed("Siege", strings.valueText(value!, 4)),
      );
    });
  });

  it("differs once full: the app clears the clock, the library stops", () => {
    const [{ announcement }] = pressThrough(4, 4, 1);
    expect(announcement).toBe("Cleared Siege, 0 of 4 segments filled");
    expect(advanceClock(4, 4)).toBeNull();
  });

  it("names the clock as the library reads a change", () => {
    render(<ClockCircle label="Siege" segments={6} value={3} />, {
      wrapper: TestWrapper,
    });
    expect(
      screen.getByRole("img", {
        name: strings.changed("Siege", strings.valueText(3, 6)),
      }),
    ).toBeInTheDocument();
  });
});
