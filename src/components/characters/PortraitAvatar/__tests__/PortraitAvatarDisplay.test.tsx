import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

// The app's i18n setup, so "Portrait of {{name}}" is interpolated.
import "i18n/config";

import { PortraitAvatarDisplay } from "../PortraitAvatarDisplay";

describe("PortraitAvatarDisplay", () => {
  it("is one image named for the character", () => {
    render(<PortraitAvatarDisplay name="Kira" portraitUrl="kira.png" />);

    expect(
      screen.getByRole("img", { name: "Portrait of Kira" }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("img")).toHaveLength(1);
  });

  it("reads the name, not its first letter, without a picture", () => {
    render(<PortraitAvatarDisplay name="Kira" />);

    expect(
      screen.getByRole("img", { name: "Portrait of Kira" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("heading")).toBeNull();
  });

  it("is hidden when the name is shown beside it", () => {
    render(
      <PortraitAvatarDisplay name="Kira" portraitUrl="kira.png" decorative />,
    );

    expect(screen.queryByRole("img")).toBeNull();
  });
});
