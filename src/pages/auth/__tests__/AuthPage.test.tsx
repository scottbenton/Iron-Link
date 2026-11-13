import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

import AuthPage from "../AuthPage";

const actions = vi.hoisted(() => ({
  sendOTPCodeToEmail: vi.fn(),
  verifyOTPCode: vi.fn(),
}));
vi.mock("lib/supabase.lib", () => ({ supabase: {} }));
vi.mock("stores/auth.store", () => ({
  useAuthStore: (selector: (store: typeof actions) => unknown) =>
    selector(actions),
}));
vi.mock("hooks/useSendPageViewEvents", () => ({
  PageCategory: { Auth: "auth" },
  useSendPageViewEvent: () => {},
}));
vi.mock("hooks/useIsLocalEnvironment", () => ({
  useIsLocalEnvironment: () => false,
}));
vi.mock("../components/SocialLoginOptions", () => ({
  SocialLoginOptions: () => null,
}));

function renderPage() {
  return render(
    <MemoryRouter>
      <AuthPage />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("AuthPage", () => {
  it("sends the code and signs in with Enter", async () => {
    const user = userEvent.setup();
    actions.sendOTPCodeToEmail.mockResolvedValue(undefined);
    actions.verifyOTPCode.mockResolvedValue(undefined);
    renderPage();

    await user.type(
      screen.getByRole("textbox", { name: "Email Address" }),
      "scott@example.com{Enter}",
    );
    expect(actions.sendOTPCodeToEmail).toHaveBeenCalledWith(
      "scott@example.com",
    );

    const code = await screen.findByRole("textbox", {
      name: "One Time Password",
    });
    expect(code).toHaveFocus();
    await user.keyboard("123456{Enter}");
    expect(actions.verifyOTPCode).toHaveBeenCalledWith(
      "scott@example.com",
      "123456",
    );
  });

  it("sends one code while a send is in flight", async () => {
    const user = userEvent.setup();
    actions.sendOTPCodeToEmail.mockReturnValue(new Promise(() => {}));
    renderPage();

    const email = screen.getByRole("textbox", { name: "Email Address" });
    await user.type(email, "scott@example.com{Enter}{Enter}");
    expect(
      screen.getByRole("button", { name: "Send One Time Password" }),
    ).toBeDisabled();
    expect(actions.sendOTPCodeToEmail).toHaveBeenCalledTimes(1);
  });

  it("does not send to an invalid email", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.type(
      screen.getByRole("textbox", { name: "Email Address" }),
      "scott{Enter}",
    );
    await waitFor(() =>
      expect(
        screen.getByText("Please enter a valid email"),
      ).toBeInTheDocument(),
    );
    expect(actions.sendOTPCodeToEmail).not.toHaveBeenCalled();
  });
});
