import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { WorldCategoryIcon } from "../WorldCategoryIcon";
import { GROUPS_CATEGORY_ICON_KEY } from "../categoryIcons";

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

  it("renders the curated Material icon directly", () => {
    const view = render(
      <WorldCategoryIcon
        icon={{ key: GROUPS_CATEGORY_ICON_KEY, color: null }}
      />,
    );
    expect(
      view.container.querySelector('[data-testid="Groups2Icon"]'),
    ).not.toBeNull();
    expect(
      view.container.querySelector('[data-testid="CategoryOutlinedIcon"]'),
    ).toBeNull();
  });
});
