import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { WorldCategoryIcon } from "../WorldCategoryIcon";

const iconSetImports = vi.hoisted(() => ({ count: 0 }));
vi.mock("@iconify-json/game-icons", () => {
  iconSetImports.count += 1;
  return { icons: { icons: {} } };
});

describe("WorldCategoryIcon with a bundled icon", () => {
  it("draws a template icon without loading the icon set", async () => {
    const view = render(
      <WorldCategoryIcon icon={{ key: "GiCompass", color: null }} />,
    );
    expect(view.container.querySelector("path")).not.toBeNull();
    expect(
      view.container.querySelector('[data-testid="CategoryOutlinedIcon"]'),
    ).toBeNull();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(iconSetImports.count).toBe(0);
  });
});
