import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import { LiveRegion } from "components/Layout/LiveRegion";

import { toast } from "ui/components/Toast";

import { Providers } from "../../Providers";
import {
  createErrorSnackbar,
  createInfoSnackbar,
  createSuccessSnackbar,
  createWarningSnackbar,
} from "../useSnackbar";

// Pins what the app's snackbars do today (notistack through
// SnackbarProvider), so the switch to the library's toasts keeps it. Queries
// go by text, role and name only, never by notistack or MUI markup.

beforeAll(() => {
  // HeadProvider draws the favicon into a blob URL, which jsdom lacks.
  URL.createObjectURL = vi.fn(() => "blob:favicon");
  URL.revokeObjectURL = vi.fn();
});

afterEach(() => {
  vi.useRealTimers();
  // Toasts live in module state, so one test's open errors would show in
  // the next test's Toaster; the app mounts a single Toaster.
  act(() => toast.dismissAll());
});

function renderApp() {
  return render(
    <Providers>
      <LiveRegion id={"live-region"} />
    </Providers>,
  );
}

function liveRegion() {
  return document.getElementById("live-region");
}

// The message as shown, leaving out the live region's copy of it.
function shown(text: string) {
  return screen
    .queryAllByText(text)
    .filter((element) => !liveRegion()?.contains(element));
}

async function findShown(text: string) {
  await waitFor(() => expect(shown(text)).toHaveLength(1));
  return shown(text)[0];
}

async function waitForGone(text: string) {
  await waitFor(() => expect(shown(text)).toHaveLength(0));
}

describe("app snackbars", () => {
  it.each([
    ["info", createInfoSnackbar],
    ["success", createSuccessSnackbar],
    ["warning", createWarningSnackbar],
    ["error", createErrorSnackbar],
  ])(
    "shows a %s message and reads it through the app's live region",
    async (_, create) => {
      renderApp();
      act(() => create("Character saved"));

      expect(await findShown("Character saved")).toBeVisible();
      await waitFor(() =>
        expect(liveRegion()).toHaveTextContent("Character saved"),
      );
    },
  );

  it("dismisses through its Dismiss notification button", async () => {
    const user = userEvent.setup();
    renderApp();
    act(() => createErrorSnackbar("Failed to update track"));
    await findShown("Failed to update track");

    await user.click(
      screen.getByRole("button", { name: "Dismiss notification" }),
    );
    await waitForGone("Failed to update track");
  });

  it("hides an info message after ten seconds", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    renderApp();
    act(() => createInfoSnackbar("Invite link copied"));
    await findShown("Invite link copied");

    await act(async () => {
      vi.advanceTimersByTime(9000);
    });
    expect(shown("Invite link copied")).toHaveLength(1);

    await act(async () => {
      vi.advanceTimersByTime(2000);
    });
    await act(async () => {
      vi.advanceTimersByTime(1000);
    });
    await waitForGone("Invite link copied");
  });

  it("keeps an error until it is dismissed", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    renderApp();
    act(() => createErrorSnackbar("An error occurred"));
    await findShown("An error occurred");

    await act(async () => {
      vi.advanceTimersByTime(60000);
    });
    expect(shown("An error occurred")).toHaveLength(1);
  });

  it("does not show the same message twice while it is open", async () => {
    renderApp();
    act(() => {
      createErrorSnackbar("An error occurred");
      createErrorSnackbar("An error occurred");
    });
    await findShown("An error occurred");
    // Give a second copy time to appear.
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });
    expect(shown("An error occurred")).toHaveLength(1);
  });
});
