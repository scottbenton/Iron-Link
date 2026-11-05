import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { formatDocumentTitle, useDocumentTitle } from "../useDocumentTitle";

describe("formatDocumentTitle", () => {
  it("puts the page before the app's name", () => {
    expect(formatDocumentTitle("Ironlands", "Iron Link")).toBe(
      "Ironlands | Iron Link",
    );
  });

  it("is the app's name alone without a page title", () => {
    expect(formatDocumentTitle(undefined, "Iron Link")).toBe("Iron Link");
    expect(formatDocumentTitle("  ", "Iron Link")).toBe("Iron Link");
  });
});

describe("useDocumentTitle", () => {
  it("sets the title and puts the app's name back on unmount", () => {
    const { rerender, unmount } = renderHook(
      ({ title }: { title?: string }) => useDocumentTitle(title),
      { initialProps: { title: "Your Games" } },
    );
    expect(document.title).toBe("Your Games | Iron Link");

    rerender({ title: "Ironlands" });
    expect(document.title).toBe("Ironlands | Iron Link");

    unmount();
    expect(document.title).toBe("Iron Link");
  });
});
