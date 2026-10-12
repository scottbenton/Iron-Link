import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";

import { RadioCard } from "../RadioCard";
import { RadioCardGroup } from "../RadioCardGroup";

const OPTIONS = ["forge", "isles", "blank", "custom"] as const;
type Option = (typeof OPTIONS)[number];

function Harness({
  initial = null,
  disabledOptions = [],
  onChange = vi.fn(),
}: {
  initial?: Option | null;
  disabledOptions?: Option[];
  onChange?: (option: Option) => void;
}) {
  const [value, setValue] = useState<Option | null>(initial);
  return (
    <RadioCardGroup
      label="Setting"
      options={[...OPTIONS]}
      value={value}
      isOptionDisabled={(option) => disabledOptions.includes(option)}
      onChange={(option) => {
        onChange(option);
        setValue(option);
      }}
      renderCard={(option, control) => (
        <RadioCard
          {...control}
          title={option.toUpperCase()}
          description={`About ${option}`}
          footer={
            option === "custom" ? <button>Footer action</button> : undefined
          }
        />
      )}
    />
  );
}

const radio = (name: string) => screen.getByRole("radio", { name });

describe("RadioCardGroup", () => {
  it("exposes a labelled radio group of described cards", () => {
    render(<Harness initial="isles" />);
    const group = screen.getByRole("radiogroup", { name: "Setting" });
    expect(within(group).getAllByRole("radio")).toHaveLength(4);
    expect(radio("ISLES")).toHaveAttribute("aria-checked", "true");
    expect(radio("FORGE")).toHaveAttribute("aria-checked", "false");
    expect(radio("FORGE")).toHaveAccessibleDescription("About forge");
    // A footer sits outside the selectable area, so it keeps its own button.
    expect(
      within(radio("CUSTOM")).queryByRole("button", { name: "Footer action" }),
    ).toBeNull();
    expect(
      screen.getByRole("button", { name: "Footer action" }),
    ).toBeInTheDocument();
  });

  it("shows the check mark only on the selected card in a slot every card reserves", async () => {
    const user = userEvent.setup();
    render(<Harness initial="forge" />);
    const slots = screen.getAllByTestId("radio-card-check");
    expect(slots).toHaveLength(4);
    const checked = () =>
      slots
        .filter((slot) => slot.querySelector("svg"))
        .map((slot) => slot.closest('[role="radio"]')?.textContent);
    expect(checked()).toEqual([expect.stringContaining("FORGE")]);
    await user.click(radio("BLANK"));
    expect(checked()).toEqual([expect.stringContaining("BLANK")]);
    expect(radio("BLANK")).toHaveAttribute("aria-checked", "true");
  });

  it("makes only the selected card a Tab stop, or the first available one", () => {
    const view = render(<Harness initial="blank" />);
    const tabStops = () =>
      screen
        .getAllByRole("radio")
        .filter((card) => card.getAttribute("tabindex") === "0");
    expect(tabStops()).toEqual([radio("BLANK")]);
    view.unmount();
    render(<Harness disabledOptions={["forge"]} />);
    expect(tabStops()).toEqual([radio("ISLES")]);
  });

  it("moves the selection with arrow keys, Home and End, skipping disabled cards", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <Harness
        initial="forge"
        disabledOptions={["isles"]}
        onChange={onChange}
      />,
    );
    expect(radio("ISLES")).toBeDisabled();
    act(() => radio("FORGE").focus());
    await user.keyboard("{ArrowRight}");
    expect(radio("BLANK")).toHaveAttribute("aria-checked", "true");
    expect(radio("BLANK")).toHaveFocus();
    await user.keyboard("{ArrowDown}");
    expect(radio("CUSTOM")).toHaveFocus();
    await user.keyboard("{ArrowRight}");
    expect(radio("FORGE")).toHaveFocus();
    await user.keyboard("{ArrowLeft}");
    expect(radio("CUSTOM")).toHaveFocus();
    await user.keyboard("{Home}");
    expect(radio("FORGE")).toHaveAttribute("aria-checked", "true");
    await user.keyboard("{End}");
    expect(radio("CUSTOM")).toHaveAttribute("aria-checked", "true");
    expect(onChange.mock.calls.map(([option]) => option)).toEqual([
      "blank",
      "custom",
      "forge",
      "custom",
      "forge",
      "custom",
    ]);
  });
});
