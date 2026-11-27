import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { TestWrapper } from "tests/TestWrapper";

import HomePage from "../HomePage";

// Characterization tests for the home page (slice 6).

const auth = vi.hoisted(() => ({ status: 1 }));
const pageView = vi.hoisted(() => vi.fn());

vi.mock("lib/supabase.lib", () => ({ supabase: {} }));
vi.mock("lib/audio.lib", () => ({
  dieRollSound: { play: () => Promise.resolve() },
  messageReceivedSound: { play: () => Promise.resolve() },
}));
vi.mock("stores/auth.store", async (importOriginal) => {
  const original = await importOriginal<typeof import("stores/auth.store")>();
  return {
    ...original,
    useAuthStatus: () => auth.status,
    useUID: () => undefined,
  };
});
vi.mock("hooks/useSendPageViewEvents", () => ({
  PageCategory: { Home: "home" },
  useSendPageViewEvent: pageView,
}));

function renderPage() {
  return render(
    <TestWrapper>
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    </TestWrapper>,
  );
}

beforeEach(() => {
  auth.status = 1; // Unauthenticated
  pageView.mockClear();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("HomePage", () => {
  it("has one h1 and a heading for each section", () => {
    renderPage();

    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Share every vow. Sync every roll.",
      }),
    ).toBeInTheDocument();
    expect(
      screen
        .getAllByRole("heading", { level: 2 })
        .map((heading) => heading.textContent),
    ).toEqual([
      "Most Ironsworn and Starforged tools are built for one.",
      "A sheet that plays fast",
      "One view of the whole game",
    ]);
    expect(pageView).toHaveBeenCalledWith("home");
  });

  it("sends signed out visitors to sign in", () => {
    renderPage();
    expect(screen.getByRole("link", { name: "Start playing" })).toHaveAttribute(
      "href",
      "/auth",
    );
  });

  it("sends signed in players to their games", () => {
    auth.status = 2; // Authenticated
    renderPage();
    expect(
      screen.getByRole("link", { name: "Go to your games" }),
    ).toHaveAttribute("href", "/games");
  });

  it("links to the source code in a new tab", () => {
    renderPage();
    const github = screen.getByRole("link", { name: /^Open source/ });
    expect(github).toHaveAttribute(
      "href",
      "https://github.com/scottbenton/Iron-Link",
    );
    expect(github).toHaveAttribute("target", "_blank");
    expect(github).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("describes both screenshots", () => {
    renderPage();
    expect(
      screen.getByRole("img", {
        name: "Screenshot of a solo game with a character overview, notes, and the reference sidebar all visible.",
      }),
    ).toHaveAttribute("src", "/images/SoloGame.webp");
    expect(
      screen.getByRole("img", {
        name: "Screenshot of a guided game with characters, notes, and the game's log all visible.",
      }),
    ).toHaveAttribute("src", "/images/GuidedGame.webp");
  });

  it("lists the features, rulesets and licensing", () => {
    renderPage();
    for (const text of [
      "Guided character creation",
      "Full moves & oracle reference",
      "Progress tracks & clocks",
      "Synced across your devices",
      "Ironsworn",
      "Starforged",
      "Sundered Isles",
      "One link invites your table",
      "Shared notes & journals",
      "GM optional",
    ]) {
      expect(screen.getByText(text)).toBeInTheDocument();
    }

    const footerLinks = [
      ["open source", "https://github.com/scottbenton/Iron-Link"],
      ["Ironsworn and Ironsworn: Starforged", "https://www.ironswornrpg.com"],
      [
        "Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International license",
        "https://creativecommons.org/licenses/by-nc-sa/4.0/",
      ],
    ];
    for (const [name, href] of footerLinks) {
      const link = screen.getByRole("link", { name: new RegExp(`^${name}`) });
      expect(link).toHaveAttribute("href", href);
      expect(link).toHaveAttribute("target", "_blank");
    }
  });

  it("shows the demo log and track before anyone rolls", () => {
    renderPage();
    expect(screen.getByText("Game Log")).toBeInTheDocument();
    expect(screen.getByText("Kira")).toBeInTheDocument();
    expect(screen.getByText("Vesh")).toBeInTheDocument();
    expect(
      screen.getByText("We camp at the ridge. Kira, you have first watch."),
    ).toBeInTheDocument();
    expect(screen.getByText("Escort the caravan")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Your roll will appear here. Beat both challenge dice for a strong hit.",
      ),
    ).toBeInTheDocument();
  });

  it("rolls a stat into the demo log, and the table answers", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    // Every die lands on 1: 1 + 3 beats both challenge dice.
    vi.spyOn(Math, "random").mockReturnValue(0);
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderPage();

    for (const stat of ["Edge", "Heart", "Iron", "Shadow", "Wits"]) {
      expect(
        screen.getByRole("button", { name: new RegExp(`^Roll ${stat}`) }),
      ).toBeInTheDocument();
    }

    await user.click(screen.getByRole("button", { name: /^Roll Iron/ }));

    expect(screen.getByText("Ivar (you)")).toBeInTheDocument();
    expect(
      screen.queryByText(
        "Your roll will appear here. Beat both challenge dice for a strong hit.",
      ),
    ).not.toBeInTheDocument();
    expect(screen.getAllByText(/Strong Hit/i).length).toBeGreaterThan(0);

    await act(async () => {
      vi.advanceTimersByTime(1600);
    });
    expect(
      screen.getByText("Nice! That opens the pass for us."),
    ).toBeInTheDocument();

    await act(async () => {
      vi.advanceTimersByTime(1800);
    });
    expect(
      screen.getByText("Marking our progress on the journey."),
    ).toBeInTheDocument();

    // Four entries at most: the opening roll has scrolled away.
    const log = screen.getByText("Game Log").closest("div")!
      .parentElement as HTMLElement;
    expect(within(log).queryByText("2 min ago")).not.toBeInTheDocument();
  });
});
