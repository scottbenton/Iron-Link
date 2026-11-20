import { act, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { AnnouncerProvider } from "../../Announcer";
import { Toaster } from "../Toaster";
import { toast } from "../toast";

function getToastItems() {
  return Array.from(
    document.querySelectorAll<HTMLElement>("[data-sonner-toast]"),
  );
}

async function flush() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

describe("Toaster", () => {
  afterEach(async () => {
    act(() => toast.dismissAll());
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 250));
    });
  });

  it("stacks toasts collapsed, newest in front, and fans them out while focus is inside", async () => {
    render(
      <AnnouncerProvider>
        <button type="button">Outside</button>
        <Toaster />
      </AnnouncerProvider>,
    );

    act(() => {
      toast.info("Invite link copied");
      toast.success("Character saved");
      toast.warning("Starsmith is off");
    });
    await flush();

    const items = getToastItems();
    expect(items).toHaveLength(3);
    // Collapsed: Sonner draws the stack, not an expanded list.
    for (const item of items) {
      expect(item).toHaveAttribute("data-expanded", "false");
    }
    const front = items.find((item) => item.dataset.front === "true");
    expect(front).toHaveTextContent("Starsmith is off");
    expect(front).toHaveAttribute("data-index", "0");
    expect(items.filter((item) => item.dataset.front === "false")).toHaveLength(
      2,
    );

    // Keyboard focus on an older toast's button fans the stack out.
    const older = items.find((item) => item.dataset.index === "2");
    const olderDismiss = older?.querySelector<HTMLButtonElement>(
      "button[aria-label=Dismiss]",
    );
    expect(older).toHaveTextContent("Invite link copied");
    expect(olderDismiss).toBeTruthy();
    act(() => olderDismiss?.focus());
    await flush();
    for (const item of getToastItems()) {
      expect(item).toHaveAttribute("data-expanded", "true");
    }

    // Leaving the stack collapses it again.
    act(() => screen.getByRole("button", { name: "Outside" }).focus());
    await flush();
    for (const item of getToastItems()) {
      expect(item).toHaveAttribute("data-expanded", "false");
    }
  });

  // useSonner drops a dismissed toast at once, while the toast itself stays
  // on the page for its exit, so the focused Dismiss button was still inside
  // when focus was last checked and the stack stayed fanned out.
  it("collapses again once a toast closed with its own Dismiss is gone", async () => {
    render(
      <AnnouncerProvider>
        <Toaster />
      </AnnouncerProvider>,
    );
    act(() => {
      toast.info("Invite link copied");
      toast.success("Character saved");
      toast.warning("Starsmith is off");
    });
    await flush();

    const front = getToastItems().find((item) => item.dataset.front === "true");
    const dismiss = front?.querySelector<HTMLButtonElement>(
      "button[aria-label=Dismiss]",
    );
    act(() => dismiss?.focus());
    await flush();
    expect(front).toHaveAttribute("data-expanded", "true");

    act(() => dismiss?.click());
    await waitFor(() => {
      const items = getToastItems();
      expect(items).toHaveLength(2);
      for (const item of items) {
        expect(item).toHaveAttribute("data-expanded", "false");
      }
    });
  });

  // The stack's styles reach the card through this path; a Sonner update
  // that moves it would leave the older toasts as bare boxes again.
  it("renders the card where the stack styles expect it", async () => {
    render(
      <AnnouncerProvider>
        <Toaster />
      </AnnouncerProvider>,
    );
    act(() => {
      toast.info("Invite link copied");
    });
    await flush();
    const [item] = getToastItems();
    const content = item.querySelector("[data-content]");
    const title = content?.querySelector("[data-title]");
    expect(content?.parentElement).toBe(item);
    expect(title?.parentElement).toBe(content);
    expect(title?.firstElementChild).toHaveTextContent("Invite link copied");
  });

  it("keeps Sonner's own live region quiet", async () => {
    render(
      <AnnouncerProvider>
        <Toaster label="Notifications" />
      </AnnouncerProvider>,
    );
    act(() => {
      toast.info("Invite link copied");
    });
    await flush();
    const region = screen.getByRole("region", { name: "Notifications" });
    expect(region).toHaveAttribute("aria-live", "off");
  });
});
