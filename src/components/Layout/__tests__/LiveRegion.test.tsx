import { Dialog, DialogContent } from "@mui/material";
import { act, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { DialogTitleWithCloseButton } from "components/DialogTitleWithCloseButton";

import { LiveRegion } from "ui/components/Announcer";

import { useAppState } from "stores/appState.store";

import { TestWrapper } from "tests/TestWrapper";

// Pins how announcements reach screen readers today, so moving the library
// onto the same store keeps it: one call (useSetAnnouncement), a page
// region, and a region of its own in every modal dialog.

function announce(message: string) {
  act(() => useAppState.getState().setAnnouncement(message));
}

function pageRegion() {
  return document.getElementById("live-region")!;
}

beforeEach(() => {
  useAppState.setState({ announcement: null, announcementId: 0 });
});

afterEach(() => {
  useAppState.setState({ announcement: null, announcementId: 0 });
});

describe("announcements", () => {
  it("reads an announcement in the page's polite live region", async () => {
    render(<LiveRegion id={"live-region"} />, { wrapper: TestWrapper });
    expect(pageRegion()).toHaveAttribute("aria-live", "polite");
    expect(pageRegion()).toBeEmptyDOMElement();

    announce("Strong hit on Face Danger");
    await waitFor(() =>
      expect(pageRegion()).toHaveTextContent("Strong hit on Face Danger"),
    );
  });

  it("reads the same message again by clearing the region first", async () => {
    render(<LiveRegion id={"live-region"} />, { wrapper: TestWrapper });
    announce("Momentum 3");
    await waitFor(() => expect(pageRegion()).toHaveTextContent("Momentum 3"));

    announce("Momentum 3");
    // Cleared, then written again, so a screen reader reads the repeat.
    expect(pageRegion()).toBeEmptyDOMElement();
    await waitFor(() => expect(pageRegion()).toHaveTextContent("Momentum 3"));
  });

  it("does not read an earlier announcement when a region mounts later", async () => {
    announce("Weak hit");
    render(<LiveRegion id={"live-region"} />, { wrapper: TestWrapper });
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 200));
    });
    expect(pageRegion()).toBeEmptyDOMElement();
  });

  it("reads announcements inside an open modal dialog through its own region", async () => {
    render(
      <>
        <LiveRegion id={"live-region"} />
        <Dialog open>
          <DialogTitleWithCloseButton onClose={() => {}}>
            Add Asset
          </DialogTitleWithCloseButton>
          <DialogContent>Body</DialogContent>
        </Dialog>
      </>,
      { wrapper: TestWrapper },
    );
    const dialog = screen.getByRole("dialog", { name: "Add Asset" });
    const dialogRegion = dialog.querySelector("[aria-live=polite]");
    expect(dialogRegion).not.toBeNull();
    expect(dialogRegion).toBeEmptyDOMElement();

    announce("Added Ironclad");
    await waitFor(() =>
      expect(within(dialog).getByText("Added Ironclad")).toBeInTheDocument(),
    );
  });
});
