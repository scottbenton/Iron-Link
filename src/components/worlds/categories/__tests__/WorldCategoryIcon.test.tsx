import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { WorldCategoryIcon } from "../WorldCategoryIcon";

describe("WorldCategoryIcon", () => {
  it("renders no placeholder when the user chooses no icon", () => {
    const view = render(<WorldCategoryIcon icon={null} />);
    expect(view.container).toBeEmptyDOMElement();
    view.rerender(<WorldCategoryIcon icon={{ key: null, color: null }} />);
    expect(view.container).toBeEmptyDOMElement();
    view.rerender(
      <WorldCategoryIcon icon={{ key: "UnknownImportedIcon", color: null }} />,
    );
    expect(view.container.querySelector("svg")).not.toBeNull();
  });
});
