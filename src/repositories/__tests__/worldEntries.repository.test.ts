import { enqueueSnackbar } from "notistack";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ErrorReason } from "../errors/RepositoryErrors";
import { WorldEntriesRepository } from "../worldEntries.repository";

const mocks = vi.hoisted(() => ({
  response: { data: null, error: null, status: 200 } as {
    data: { id: string }[] | null;
    error: unknown;
    status: number;
  },
  update: vi.fn(),
  eq: vi.fn(),
  select: vi.fn(),
}));
vi.mock("lib/supabase.lib", () => ({
  supabase: {
    from: () => ({
      update: (entry: unknown) => {
        mocks.update(entry);
        return {
          eq: (column: string, value: string) => {
            mocks.eq(column, value);
            return {
              select: (columns: string) => {
                mocks.select(columns);
                return Promise.resolve(mocks.response);
              },
            };
          },
        };
      },
    }),
  },
}));
vi.mock("notistack", () => ({ enqueueSnackbar: vi.fn() }));
vi.mock("services/analytics.service", () => ({
  AnalyticsService: { logError: vi.fn() },
}));

afterEach(() => {
  vi.clearAllMocks();
});

describe("updateWorldEntry", () => {
  it("resolves once the entry row is updated", async () => {
    mocks.response = { data: [{ id: "entry" }], error: null, status: 200 };
    await expect(
      WorldEntriesRepository.updateWorldEntry("entry", { name: "Hollowmere" }),
    ).resolves.toBeUndefined();
    expect(mocks.update).toHaveBeenCalledWith({ name: "Hollowmere" });
    expect(mocks.eq).toHaveBeenCalledWith("id", "entry");
    expect(enqueueSnackbar).not.toHaveBeenCalled();
  });

  it("rejects and reports an update that changed no rows", async () => {
    mocks.response = { data: [], error: null, status: 200 };
    await expect(
      WorldEntriesRepository.updateWorldEntry("entry", {
        read_permissions: "only_guides",
      }),
    ).rejects.toMatchObject({ reason: ErrorReason.Forbidden });
    expect(enqueueSnackbar).toHaveBeenCalledWith(
      expect.stringContaining("Forbidden"),
      { variant: "error" },
    );
  });
});
