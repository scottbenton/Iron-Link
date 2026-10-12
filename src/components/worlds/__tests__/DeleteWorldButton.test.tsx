import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ConfirmProvider } from "material-ui-confirm";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { DeleteWorldButton } from "../DeleteWorldButton";
import { translate } from "../categories/__tests__/fixtures";

const state = vi.hoisted(() => ({
  count: vi.fn(),
  deleteWorld: vi.fn(),
}));
vi.mock("react-i18next", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react-i18next")>()),
  useTranslation: () => ({ t: translate }),
}));
vi.mock("stores/world.store", () => ({
  useWorldStore: (selector: (store: typeof state) => unknown) =>
    selector(state),
}));
vi.mock("services/worlds.service", () => ({
  WorldsService: { countGamesLinkedToWorld: state.count },
}));
beforeEach(() => {
  vi.clearAllMocks();
  state.count.mockResolvedValue(0);
  state.deleteWorld.mockResolvedValue(undefined);
});

describe("World deletion", () => {
  it.each([0, 1, 3])(
    "warns about %s linked games before deleting only the selected world",
    async (count) => {
      state.count.mockResolvedValue(count);
      const onDeleted = vi.fn();
      const user = userEvent.setup();
      render(
        <DeleteWorldButton
          worldId="world-a"
          worldName="Our world"
          onDeleted={onDeleted}
        />,
        { wrapper: ConfirmProvider },
      );
      await user.click(screen.getByRole("button", { name: "Delete World" }));
      expect(screen.getByRole("dialog")).toHaveTextContent(
        'delete "Our world"',
      );
      if (count)
        expect(screen.getByRole("dialog")).toHaveTextContent(
          `${count} ${count === 1 ? "game is" : "games are"} linked`,
        );
      else expect(screen.getByRole("dialog")).not.toHaveTextContent("linked");
      expect(state.deleteWorld).not.toHaveBeenCalled();
      await user.click(screen.getByRole("button", { name: "Delete" }));
      await waitFor(() => expect(onDeleted).toHaveBeenCalledOnce());
      expect(state.deleteWorld).toHaveBeenCalledExactlyOnceWith("world-a");
    },
  );

  it("cancels without deleting", async () => {
    const user = userEvent.setup();
    render(<DeleteWorldButton worldId="world-a" worldName="Our world" />, {
      wrapper: ConfirmProvider,
    });
    await user.click(screen.getByRole("button", { name: "Delete World" }));
    await user.click(await screen.findByRole("button", { name: "Cancel" }));
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    expect(state.deleteWorld).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Delete World" })).toBeEnabled();
  });
});
