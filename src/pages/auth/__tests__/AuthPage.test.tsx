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
const local = vi.hoisted(() => ({ isLocal: false }));
vi.mock("hooks/useIsLocalEnvironment", () => ({
  useIsLocalEnvironment: () => local.isLocal,
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
  local.isLocal = false;
});

async function sendCode(user: ReturnType<typeof userEvent.setup>) {
  actions.sendOTPCodeToEmail.mockResolvedValue(undefined);
  await user.type(
    screen.getByRole("textbox", { name: "Email Address" }),
    "scott@example.com{Enter}",
  );
  return screen.findByRole("textbox", { name: "One Time Password" });
}

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
    ).toHaveAttribute("aria-disabled", "true");
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

  it("names the page and the email form", () => {
    renderPage();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Login or Create an Account",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: "Sign in with Email" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Get a one time password sent to your email."),
    ).toBeInTheDocument();
    expect(document.title).toBe("Login or Create an Account | Iron Link");
    expect(
      screen.getByRole("link", { name: "Privacy Policy" }),
    ).toHaveAttribute("href", "/privacy");
  });

  it("asks for an email before sending", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(
      screen.getByRole("button", { name: "Send One Time Password" }),
    );
    // The error shows on the field and describes it.
    expect(await screen.findByText("Email is required")).toBeInTheDocument();
    expect(
      screen.getByRole("textbox", { name: "Email Address" }),
    ).toHaveAccessibleDescription("Email is required");
    expect(actions.sendOTPCodeToEmail).not.toHaveBeenCalled();
  });

  it("shows why a send failed and keeps the email form", async () => {
    const user = userEvent.setup();
    actions.sendOTPCodeToEmail.mockRejectedValue(new Error("Rate limited"));
    renderPage();

    await user.type(
      screen.getByRole("textbox", { name: "Email Address" }),
      "scott@example.com{Enter}",
    );
    expect(
      await screen.findByText("Error sending OTP: Rate limited"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("textbox", { name: "Email Address" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Send One Time Password" }),
    ).toBeEnabled();
  });

  it("tells the player where the code went", async () => {
    const user = userEvent.setup();
    renderPage();

    await sendCode(user);
    expect(
      screen.getByText(
        "A one time password has been sent to scott@example.com. Please enter it here to complete your login.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Sign in with Email" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("textbox", { name: "One Time Password" }),
    ).toHaveAttribute("inputmode", "numeric");
    expect(
      screen.queryByRole("link", { name: /^here/ }),
    ).not.toBeInTheDocument();
  });

  it("points to the fake inbox in a local environment", async () => {
    local.isLocal = true;
    const user = userEvent.setup();
    renderPage();

    await sendCode(user);
    expect(screen.getByRole("link", { name: /^here/ })).toHaveAttribute(
      "href",
      "http://localhost:54324",
    );
  });

  it("signs in once while a sign in is in flight", async () => {
    const user = userEvent.setup();
    actions.verifyOTPCode.mockReturnValue(new Promise(() => {}));
    renderPage();

    await sendCode(user);
    await user.keyboard("123456{Enter}{Enter}");
    expect(screen.getByRole("button", { name: "Sign In" })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
    expect(actions.verifyOTPCode).toHaveBeenCalledTimes(1);
  });

  // Current behaviour, recorded as a bug in the migration's changes list:
  // the error message only renders on the email step, so a failed or empty
  // code shows nothing.
  it("does not show sign in errors on the code step", async () => {
    const user = userEvent.setup();
    actions.verifyOTPCode.mockRejectedValue(new Error("Token expired"));
    renderPage();

    const code = await sendCode(user);
    await user.click(screen.getByRole("button", { name: "Sign In" }));
    expect(screen.queryByText("OTP is required")).not.toBeInTheDocument();

    await user.type(code, "123456{Enter}");
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Sign In" })).toBeEnabled(),
    );
    expect(actions.verifyOTPCode).toHaveBeenCalledTimes(1);
    expect(
      screen.queryByText("Error verifying OTP: Token expired"),
    ).not.toBeInTheDocument();
  });
});
