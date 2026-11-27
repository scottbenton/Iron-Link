import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useConfirm } from "material-ui-confirm";
import { useState } from "react";
import { beforeAll, describe, expect, it, vi } from "vitest";

import { Providers } from "../Providers";

// Pins what the app's confirm does today (material-ui-confirm configured in
// Providers), so the switch to the library's ConfirmDialog keeps it. Queries
// go by role and name only, never by MUI markup.

function Probe(props: {
  options: Parameters<ReturnType<typeof useConfirm>>[0];
}) {
  const { options } = props;
  const confirm = useConfirm();
  const [result, setResult] = useState("none");
  return (
    <>
      <button
        type="button"
        onClick={() =>
          confirm(options).then(({ confirmed }) =>
            setResult(confirmed ? "confirmed" : "cancelled"),
          )
        }
      >
        Ask
      </button>
      <output aria-label="Result">{result}</output>
    </>
  );
}

const deleteOptions = {
  title: "Delete World",
  description: "Delete Ironlands and everything in it?",
  confirmationText: "Delete",
};

async function ask(options = deleteOptions) {
  const user = userEvent.setup();
  render(
    <Providers>
      <Probe options={options} />
    </Providers>,
  );
  await user.click(screen.getByRole("button", { name: "Ask" }));
  await screen.findByRole("heading", { name: options.title });
  return user;
}

function result() {
  return screen.getByRole("status", { name: "Result" }).textContent;
}

beforeAll(() => {
  // HeadProvider draws the favicon into a blob URL, which jsdom lacks.
  URL.createObjectURL = vi.fn(() => "blob:favicon");
  URL.revokeObjectURL = vi.fn();
});

describe("app confirm", () => {
  it("asks with the title, description and named buttons", async () => {
    await ask();

    expect(screen.getByRole("heading", { name: "Delete World" })).toBeVisible();
    expect(
      screen.getByText("Delete Ironlands and everything in it?"),
    ).toBeVisible();
    expect(screen.getByRole("button", { name: "Delete" })).toBeVisible();
    // The default cancel label comes from the app's translations.
    expect(screen.getByRole("button", { name: "Cancel" })).toBeVisible();
  });

  it("resolves confirmed when the confirm button is pressed", async () => {
    const user = await ask();
    await user.click(screen.getByRole("button", { name: "Delete" }));
    await waitFor(() => expect(result()).toBe("confirmed"));
  });

  it("resolves not confirmed when Cancel is pressed", async () => {
    const user = await ask();
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    await waitFor(() => expect(result()).toBe("cancelled"));
  });

  it("resolves not confirmed on Escape", async () => {
    const user = await ask();
    await user.keyboard("{Escape}");
    await waitFor(() => expect(result()).toBe("cancelled"));
  });

  it("uses a custom cancel label when given one", async () => {
    await ask({ ...deleteOptions, cancellationText: "Keep World" } as never);
    expect(screen.getByRole("button", { name: "Keep World" })).toBeVisible();
  });

  it("closes once answered", async () => {
    const user = await ask();
    await user.click(screen.getByRole("button", { name: "Delete" }));
    await waitFor(() =>
      expect(
        screen.queryByRole("heading", { name: "Delete World" }),
      ).not.toBeInTheDocument(),
    );
    await act(async () => {});
  });
});
