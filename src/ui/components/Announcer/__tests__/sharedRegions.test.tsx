import { act, render, screen, waitFor, within } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it } from "vitest";

import { ConfirmDialog } from "../../ConfirmDialog";
import { Dialog, DialogBody, DialogHeader } from "../../Dialog";
import { Drawer, DrawerBody, DrawerHeader } from "../../Drawer";
import { AnnouncerProvider } from "../AnnouncerProvider";
import { LiveRegion } from "../LiveRegion";
import { useAnnounce } from "../useAnnounce";

// One announcement store: an app-owned one handed to AnnouncerProvider, read
// by the page's region and by the region every modal renders.

function useExternalStore() {
  const [state, setState] = useState({
    message: null as string | null,
    nonce: 0,
  });
  const announce = (message: string) =>
    setState((previous) => ({ message, nonce: previous.nonce + 1 }));
  return { ...state, announce };
}

let announceFromTest: (message: string) => void = () => {};

function AnnounceHandle() {
  announceFromTest = useAnnounce();
  return null;
}

function App(props: { modal: "dialog" | "drawer" | "confirm" | null }) {
  const { modal } = props;
  const store = useExternalStore();
  return (
    <AnnouncerProvider
      announce={store.announce}
      message={store.message}
      nonce={store.nonce}
    >
      <AnnounceHandle />
      <LiveRegion id="page-region" />
      <Dialog open={modal === "dialog"} onClose={() => {}}>
        <DialogHeader title="Add Asset" />
        <DialogBody>Pick one</DialogBody>
      </Dialog>
      <Drawer open={modal === "drawer"} onClose={() => {}}>
        <DrawerHeader title="Notes" />
        <DrawerBody>Notes go here</DrawerBody>
      </Drawer>
      <ConfirmDialog
        open={modal === "confirm"}
        title="Delete World"
        onConfirm={() => {}}
        onCancel={() => {}}
      />
    </AnnouncerProvider>
  );
}

function announce(message: string) {
  act(() => announceFromTest(message));
}

describe("shared live regions", () => {
  it("reads the app's store in the page region", async () => {
    render(<App modal={null} />);
    announce("Strong hit");
    await waitFor(() =>
      expect(document.getElementById("page-region")).toHaveTextContent(
        "Strong hit",
      ),
    );
  });

  it.each([
    ["dialog", "Add Asset"],
    ["drawer", "Notes"],
    ["confirm", "Delete World"],
  ] as const)(
    "gives the %s its own region on the same store",
    async (modal, name) => {
      render(<App modal={modal} />);
      const popup = await screen.findByRole(
        modal === "confirm" ? "alertdialog" : "dialog",
        { name },
      );
      const region = within(popup).getByRole("status");
      expect(region).toBeEmptyDOMElement();

      announce("Momentum 3");
      await waitFor(() => expect(region).toHaveTextContent("Momentum 3"));
    },
  );

  it("renders its own page region without an app store", async () => {
    function Internal() {
      return (
        <AnnouncerProvider>
          <AnnounceHandle />
        </AnnouncerProvider>
      );
    }
    render(<Internal />);
    announce("Weak hit");
    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent("Weak hit"),
    );
  });
});
