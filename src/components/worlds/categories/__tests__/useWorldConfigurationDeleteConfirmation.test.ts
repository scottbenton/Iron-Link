import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useWorldConfigurationDeleteConfirmation } from "../useWorldConfigurationDeleteConfirmation";

const request = {
  title: "Delete category",
  description: "Cannot be undone",
  confirmationText: "Delete",
};

describe("World deletion confirmation lifecycle", () => {
  it("cancels a pending request on unmount", async () => {
    const hook = renderHook(useWorldConfigurationDeleteConfirmation);
    let pending!: Promise<{ confirmed: boolean }>;
    act(() => {
      pending = hook.result.current.confirm(request);
    });
    expect(hook.result.current.request).toEqual(request);
    hook.unmount();
    await expect(pending).resolves.toEqual({ confirmed: false });
  });

  it("cancels a late request after unmount instead of leaving an orphaned promise", async () => {
    const hook = renderHook(useWorldConfigurationDeleteConfirmation);
    const confirmAfterCount = hook.result.current.confirm;
    hook.unmount();
    await expect(confirmAfterCount(request)).resolves.toEqual({
      confirmed: false,
    });
  });
});
