import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { HeadingOffset } from "components/HeadingLevel";

import { TestWrapper } from "tests/TestWrapper";

import { WorldViewLayout } from "../WorldViewLayout";

describe("WorldViewLayout", () => {
  it("makes the title the page's h1 on the world's own page", () => {
    render(
      <WorldViewLayout layout="page" breadcrumbs={null} title="Ironlands" />,
      { wrapper: TestWrapper },
    );
    expect(
      screen.getByRole("heading", { level: 1, name: "Ironlands" }),
    ).toBeInTheDocument();
  });

  it("nests the title under the Notes column in a Notes tab", () => {
    render(
      <HeadingOffset offset={2}>
        <WorldViewLayout
          layout="embedded"
          breadcrumbs={null}
          title="Ironlands"
        />
      </HeadingOffset>,
      { wrapper: TestWrapper },
    );
    expect(
      screen.getByRole("heading", { level: 3, name: "Ironlands" }),
    ).toBeInTheDocument();
  });
});
