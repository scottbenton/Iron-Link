import { fireEvent, render, screen } from "@testing-library/react";
import { useContext } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { WorldOracleCatalog } from "lib/worldOracleCatalog";

import { WorldOracleContextProvider } from "../WorldOracleContextProvider";
import { WorldOracleContext } from "../worldOracleContext";

const state = vi.hoisted(() => ({
  worldId: "world-a",
  catalog: null as WorldOracleCatalog | null,
  loading: true,
  error: undefined as string | undefined,
  allPackages: false,
  setAllPackages: vi.fn(),
  refresh: vi.fn(),
}));
vi.mock("stores/worldResources.store", () => ({
  useWorldResourcesStore: () => state,
}));

function OracleStatus() {
  const context = useContext(WorldOracleContext)!;
  return (
    <>
      <output aria-label="Oracle status">
        {context.worldId}:{context.loading ? "loading" : "ready"}:
        {context.catalog ? "catalog" : "none"}:{context.error ?? "no-error"}:
        {context.allPackages ? "all" : "linked"}
      </output>
      <button onClick={() => context.setAllPackages(true)}>All packages</button>
      <button onClick={context.retry}>Retry</button>
    </>
  );
}
const provider = (worldId = "world-a") => (
  <WorldOracleContextProvider worldId={worldId}>
    <OracleStatus />
  </WorldOracleContextProvider>
);

beforeEach(() => {
  vi.clearAllMocks();
  Object.assign(state, {
    worldId: "world-a",
    catalog: null,
    loading: true,
    error: undefined,
    allPackages: false,
  });
});

describe("WorldOracleContextProvider", () => {
  it("exposes the resource state and delegates controls to its world", () => {
    state.catalog = {} as WorldOracleCatalog;
    state.loading = false;
    state.error = "Example failure";
    state.allPackages = true;
    render(provider());
    expect(screen.getByLabelText("Oracle status")).toHaveTextContent(
      "world-a:ready:catalog:Example failure:all",
    );
    fireEvent.click(screen.getByText("All packages"));
    fireEvent.click(screen.getByText("Retry"));
    expect(state.setAllPackages).toHaveBeenCalledWith("world-a", true);
    expect(state.refresh).toHaveBeenCalledWith("world-a");
  });

  it("hides another world's state and mounting/focusing never initiates fetches", () => {
    state.catalog = {} as WorldOracleCatalog;
    state.loading = false;
    state.error = "Other world error";
    state.allPackages = true;
    render(provider("world-b"));
    expect(screen.getByLabelText("Oracle status")).toHaveTextContent(
      "world-b:loading:none:no-error:linked",
    );
    fireEvent.focus(window);
    expect(state.refresh).not.toHaveBeenCalled();
    expect(state.setAllPackages).not.toHaveBeenCalled();
  });
});
