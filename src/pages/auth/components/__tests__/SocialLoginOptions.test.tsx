import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SocialLoginOptions } from "../SocialLoginOptions";

// Characterization tests for the social sign in buttons (slice 6).

const actions = vi.hoisted(() => ({
  signInWithOAuth: vi.fn(),
  waitForInitialization: vi.fn(),
}));
vi.mock("lib/supabase.lib", () => ({ supabase: {} }));
vi.mock("stores/auth.store", () => ({
  useAuthStore: (selector: (store: typeof actions) => unknown) =>
    selector(actions),
}));

function renderOptions(url = "/auth") {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <SocialLoginOptions />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  actions.waitForInitialization.mockResolvedValue(undefined);
});

describe("SocialLoginOptions", () => {
  it("starts a sign in and holds both buttons while it leaves", async () => {
    const user = userEvent.setup();
    actions.signInWithOAuth.mockReturnValue(new Promise(() => {}));
    renderOptions();

    expect(screen.getByRole("separator")).toHaveTextContent("or");
    await user.click(
      screen.getByRole("button", { name: "Continue with Google" }),
    );
    expect(actions.signInWithOAuth).toHaveBeenCalledWith("google");
    expect(
      screen.getByRole("button", { name: "Continue with Google" }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Continue with Discord" }),
    ).toBeDisabled();
  });

  it("frees the buttons when the page comes back from the back button", async () => {
    const user = userEvent.setup();
    actions.signInWithOAuth.mockReturnValue(new Promise(() => {}));
    renderOptions();

    await user.click(
      screen.getByRole("button", { name: "Continue with Discord" }),
    );
    expect(actions.signInWithOAuth).toHaveBeenCalledWith("discord");

    act(() => {
      const event = new Event("pageshow") as PageTransitionEvent;
      Object.defineProperty(event, "persisted", { value: true });
      window.dispatchEvent(event);
    });
    expect(
      screen.getByRole("button", { name: "Continue with Discord" }),
    ).toBeEnabled();
  });

  it("explains a sign in that could not start", async () => {
    const user = userEvent.setup();
    actions.signInWithOAuth.mockRejectedValue(new Error("Offline"));
    renderOptions();

    await user.click(
      screen.getByRole("button", { name: "Continue with Google" }),
    );
    expect(await screen.findByText("Could Not Sign In")).toBeInTheDocument();
    expect(
      screen.getByText("Could not start sign in: Offline"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Continue with Google" }),
    ).toBeEnabled();
  });

  it("says so when the player cancels at the provider", async () => {
    renderOptions("/auth?error=access_denied");
    expect(
      await screen.findByText("Sign in was cancelled."),
    ).toBeInTheDocument();
  });

  it("shows the provider's reason for a failed sign in", async () => {
    renderOptions(
      "/auth#error=server_error&error_description=Email+not+verified",
    );
    expect(
      await screen.findByText("Sign in failed: Email not verified"),
    ).toBeInTheDocument();
  });
});
