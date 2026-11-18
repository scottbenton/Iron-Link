// @vitest-environment node
import { describe, expect, it } from "vitest";

import { formatGameLogRelativeTime } from "./gameLogTime";

const now = new Date(2026, 10, 18, 20, 15);
const minutesBefore = (minutes: number) =>
  new Date(now.getTime() - minutes * 60_000);
const format = (date: Date) => formatGameLogRelativeTime(date, now, "Just now");

describe("formatGameLogRelativeTime", () => {
  it("says just now within a minute, either side", () => {
    expect(format(minutesBefore(0.5))).toBe("Just now");
    expect(format(minutesBefore(-0.5))).toBe("Just now");
  });

  it("counts minutes, then hours, through today", () => {
    expect(format(minutesBefore(5))).toBe("5 minutes ago");
    expect(format(minutesBefore(59))).toBe("59 minutes ago");
    expect(format(minutesBefore(130))).toBe("2 hours ago");
  });

  it("leaves earlier days and the future to the clock time", () => {
    expect(format(minutesBefore(21 * 60))).toBeUndefined();
    expect(format(minutesBefore(-5))).toBeUndefined();
  });
});
