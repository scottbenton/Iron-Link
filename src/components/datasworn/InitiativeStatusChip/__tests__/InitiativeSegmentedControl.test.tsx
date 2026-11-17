import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";

import { TestWrapper } from "tests/TestWrapper";

import { InitiativeStatus } from "repositories/character.repository";

import { InitiativeSegmentedControl } from "../InitiativeSegmentedControl";

function Harness(props: { onChange: (status: InitiativeStatus) => void }) {
  const { onChange } = props;
  const [status, setStatus] = useState(InitiativeStatus.OutOfCombat);
  return (
    <InitiativeSegmentedControl
      status={status}
      handleStatusChange={(newStatus) => {
        setStatus(newStatus);
        onChange(newStatus);
      }}
    />
  );
}

describe("InitiativeSegmentedControl", () => {
  it("sets each status from its radio", () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />, { wrapper: TestWrapper });

    expect(
      screen.getByRole("radiogroup", { name: "Initiative" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Out of Combat" })).toBeChecked();

    fireEvent.click(screen.getByRole("radio", { name: "Has Initiative" }));
    expect(onChange).toHaveBeenLastCalledWith(InitiativeStatus.HasInitiative);
    expect(screen.getByRole("radio", { name: "Has Initiative" })).toBeChecked();

    fireEvent.click(screen.getByRole("radio", { name: "No Initiative" }));
    expect(onChange).toHaveBeenLastCalledWith(
      InitiativeStatus.DoesNotHaveInitiative,
    );

    fireEvent.click(screen.getByRole("radio", { name: "Out of Combat" }));
    expect(onChange).toHaveBeenLastCalledWith(InitiativeStatus.OutOfCombat);
    expect(onChange).toHaveBeenCalledTimes(3);
  });

  it("only shows the status to those who cannot change it", () => {
    render(
      <InitiativeSegmentedControl status={InitiativeStatus.HasInitiative} />,
      { wrapper: TestWrapper },
    );
    expect(screen.getByRole("radio", { name: "Has Initiative" })).toBeChecked();
    for (const radio of screen.getAllByRole("radio")) {
      expect(radio).toBeDisabled();
    }
  });
});
