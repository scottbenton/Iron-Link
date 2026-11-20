import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AnnouncerProvider } from "../../../components/Announcer";
import { OracleTextField } from "../OracleTextField";

describe("OracleTextField", () => {
  it("rolls the oracle into the field and names the button after it", async () => {
    const onValueChange = vi.fn();
    render(
      <AnnouncerProvider>
        <OracleTextField
          label="Name"
          oracleName="Settlement Name"
          onRoll={() => "Bleakhold"}
          onValueChange={onValueChange}
        />
      </AnnouncerProvider>,
    );
    const button = screen.getByRole("button", {
      name: "Roll Settlement Name",
    });
    act(() => fireEvent.click(button));
    expect(screen.getByRole("textbox", { name: "Name" })).toHaveValue(
      "Bleakhold",
    );
    expect(onValueChange).toHaveBeenCalledWith("Bleakhold");
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 200));
    });
    expect(document.body).toHaveTextContent("Updated Name to Bleakhold");
  });

  it("leaves the text alone when the roll gives nothing, and has no die when read-only", () => {
    const { rerender } = render(
      <AnnouncerProvider>
        <OracleTextField
          label="Name"
          oracleName="Settlement Name"
          defaultValue="Ironhome"
          onRoll={() => undefined}
        />
      </AnnouncerProvider>,
    );
    act(() =>
      fireEvent.click(
        screen.getByRole("button", { name: "Roll Settlement Name" }),
      ),
    );
    expect(screen.getByRole("textbox")).toHaveValue("Ironhome");

    rerender(
      <AnnouncerProvider>
        <OracleTextField
          label="Name"
          oracleName="Settlement Name"
          defaultValue="Ironhome"
          readOnly
          onRoll={() => undefined}
        />
      </AnnouncerProvider>,
    );
    expect(
      screen.queryByRole("button", { name: "Roll Settlement Name" }),
    ).toBeNull();
  });
});
