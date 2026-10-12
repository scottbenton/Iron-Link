import { enqueueSnackbar } from "notistack";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  ErrorNoun,
  ErrorReason,
  ErrorVerb,
  getRepositoryError,
} from "../RepositoryErrors";

vi.mock("notistack", () => ({ enqueueSnackbar: vi.fn() }));
vi.mock("services/analytics.service", () => ({
  AnalyticsService: { logError: vi.fn() },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

const invalidParentMessage =
  "That entry can't be placed there. Choose an entry in the same category that isn't the entry itself or one of its nested entries.";

describe("repository errors", () => {
  it("recognises a refused world entry parent by its code and hint", () => {
    const error = getRepositoryError(
      {
        code: "23514",
        hint: "invalid_parent",
        details: null,
        message: "An entry cannot be placed inside one of its descendants",
      },
      ErrorVerb.Update,
      ErrorNoun.WorldEntry,
      false,
      400,
    );
    expect(error.reason).toBe(ErrorReason.InvalidParent);
    expect(enqueueSnackbar).toHaveBeenCalledWith(invalidParentMessage, {
      variant: "error",
    });
  });

  it("leaves other check violations as bad requests", () => {
    const error = getRepositoryError(
      {
        code: "23514",
        hint: "nested_entries_exist",
        details: null,
        message:
          "Move nested entries to the top level before turning off nesting",
      },
      ErrorVerb.Update,
      ErrorNoun.WorldCategory,
      false,
      400,
    );
    expect(error.reason).toBe(ErrorReason.BadRequest);
    expect(enqueueSnackbar).toHaveBeenCalledWith(
      "Bad request: Failed to update category",
      { variant: "error" },
    );
  });
});
