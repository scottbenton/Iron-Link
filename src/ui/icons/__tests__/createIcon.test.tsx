import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Icon } from "../Icon";
import { createIcon } from "../createIcon";

const RuneIcon = createIcon("RuneIcon", {
  regular: <path data-testid="regular" d="M0,0H256" />,
  bold: <path data-testid="bold" d="M0,0H256" />,
});

describe("createIcon", () => {
  it("draws the weight asked for", () => {
    const { getByTestId } = render(<Icon icon={RuneIcon} weight="bold" />);
    expect(getByTestId("bold")).toBeInTheDocument();
  });

  it("falls back to regular for a weight it has no drawing for", () => {
    const { getByTestId } = render(<Icon icon={RuneIcon} weight="thin" />);
    expect(getByTestId("regular")).toBeInTheDocument();
  });

  it("takes one drawing for every weight", () => {
    const DotIcon = createIcon("DotIcon", <circle cx={128} cy={128} r={64} />);
    const { container } = render(<Icon icon={DotIcon} weight="fill" />);
    expect(container.querySelector("circle")).not.toBeNull();
    expect(DotIcon.displayName).toBe("DotIcon");
  });
});
