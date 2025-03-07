import { render } from "@testing-library/react";
import { Mock, describe, expect, it, vi } from "vitest";

import { getIsLocalEnvironment } from "lib/environment.lib";

import { AssetHeader, AssetHeaderProps } from "../AssetHeader";

vi.mock("lib/environment.lib", () => ({
  getIsLocalEnvironment: vi.fn(),
}));

describe("AssetHeader", () => {
  const defaultProps: AssetHeaderProps = {
    category: "Test Category",
    id: "test-id",
    actions: <button>Action</button>,
  };

  it("renders the category text", () => {
    (getIsLocalEnvironment as Mock).mockReturnValue(false);
    const { getByText } = render(<AssetHeader {...defaultProps} />);
    expect(getByText("Test Category")).toBeInTheDocument();
  });

  it("renders the actions when provided", () => {
    (getIsLocalEnvironment as Mock).mockReturnValue(false);
    const { getByText } = render(<AssetHeader {...defaultProps} />);
    expect(getByText("Action")).toBeInTheDocument();
  });

  it("renders the LinkIcon when isLocal is true", () => {
    (getIsLocalEnvironment as Mock).mockReturnValue(true);
    const { getByLabelText } = render(<AssetHeader {...defaultProps} />);
    expect(getByLabelText("test-id")).toBeInTheDocument();
  });

  it("does not render the LinkIcon when isLocal is false", () => {
    (getIsLocalEnvironment as Mock).mockReturnValue(false);
    const { queryByLabelText } = render(<AssetHeader {...defaultProps} />);
    expect(queryByLabelText("test-id")).toBeNull();
  });
});
