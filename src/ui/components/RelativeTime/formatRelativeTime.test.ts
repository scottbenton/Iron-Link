// @vitest-environment node
import { describe, expect, it } from "vitest";

import { formatRelativeTime } from "./formatRelativeTime";

const now = new Date(2026, 10, 18, 20, 15);
const minutesBefore = (minutes: number) =>
  new Date(now.getTime() - minutes * 60_000);
const format = (date: Date) => formatRelativeTime(date, now, "Just now");

describe("formatRelativeTime", () => {
  it("counts up from just now through minutes, hours and days", () => {
    expect(format(minutesBefore(0.5))).toBe("Just now");
    expect(format(minutesBefore(5))).toBe("5 minutes ago");
    expect(format(minutesBefore(130))).toBe("2 hours ago");
    expect(format(minutesBefore(26 * 60))).toBe("yesterday");
    expect(format(minutesBefore(3 * 24 * 60))).toBe("3 days ago");
  });

  it("leaves the future to the absolute time", () => {
    expect(format(minutesBefore(-5))).toBeUndefined();
  });
});
