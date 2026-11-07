import posthog from "posthog-js";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  AnalyticsService,
  NEW_ACCOUNT_WINDOW_MS,
  isNewAccount,
} from "../analytics.service";

vi.mock("posthog-js", () => ({
  default: {
    init: vi.fn(),
    identify: vi.fn(),
    reset: vi.fn(),
    capture: vi.fn(),
    captureException: vi.fn(),
  },
}));

const now = Date.parse("2026-11-07T12:00:00Z");

describe("isNewAccount", () => {
  it("counts an account created within the window", () => {
    expect(isNewAccount("2026-11-07T11:59:00Z", now)).toBe(true);
    expect(
      isNewAccount(new Date(now - NEW_ACCOUNT_WINDOW_MS).toISOString(), now),
    ).toBe(true);
  });

  it("doesn't count an older account, a future date or a bad date", () => {
    expect(
      isNewAccount(
        new Date(now - NEW_ACCOUNT_WINDOW_MS - 1).toISOString(),
        now,
      ),
    ).toBe(false);
    expect(isNewAccount("2026-11-07T12:01:00Z", now)).toBe(false);
    expect(isNewAccount("not a date", now)).toBe(false);
  });
});

describe("AnalyticsService.logAccountCreatedIfNew", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.mocked(posthog.capture).mockClear();
  });

  it("sends app:account_create once per account on this device", () => {
    const createdAt = new Date().toISOString();
    AnalyticsService.logAccountCreatedIfNew("user-1", createdAt);
    AnalyticsService.logAccountCreatedIfNew("user-1", createdAt);
    expect(posthog.capture).toHaveBeenCalledTimes(1);
    expect(posthog.capture).toHaveBeenCalledWith("app:account_create");
  });

  it("sends nothing for an older account", () => {
    AnalyticsService.logAccountCreatedIfNew("user-1", "2020-01-01T00:00:00Z");
    expect(posthog.capture).not.toHaveBeenCalled();
  });
});
