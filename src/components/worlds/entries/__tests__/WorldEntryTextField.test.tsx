import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { field } from "../../categories/__tests__/fixtures";
import { WorldEntryTextField } from "../WorldEntryTextField";

const climate = {
  ...field({ id: "climate", label: "Climate" }),
  visible: true,
  helpText: "",
};

let onSave: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.useFakeTimers();
  onSave = vi.fn();
});

afterEach(() => {
  vi.useRealTimers();
});

function renderField(value: string, canEdit = true) {
  const { rerender } = render(
    <WorldEntryTextField
      field={climate}
      value={value}
      canEdit={canEdit}
      onSave={onSave}
    />,
  );
  return (next: string, nextCanEdit = true) =>
    rerender(
      <WorldEntryTextField
        field={climate}
        value={next}
        canEdit={nextCanEdit}
        onSave={onSave}
      />,
    );
}

const input = () => screen.getByRole("textbox", { name: "Climate" });
const type = (text: string) =>
  fireEvent.change(input(), { target: { value: text } });
const pause = () => act(() => vi.advanceTimersByTime(1100));

describe("WorldEntryTextField", () => {
  it("shows a remote change on leaving once its own edit is saved", () => {
    const setStored = renderField("");
    fireEvent.focus(input());
    type("A");
    pause();
    expect(onSave).toHaveBeenCalledWith("A");
    setStored("A");

    setStored("B");
    expect(input()).toHaveValue("A");
    fireEvent.blur(input());
    expect(input()).toHaveValue("B");
  });

  it("keeps and saves unsaved typing over a remote change", () => {
    const setStored = renderField("Cold");
    fireEvent.focus(input());
    type("Cold and wet");
    setStored("Warm");
    expect(input()).toHaveValue("Cold and wet");

    fireEvent.blur(input());
    expect(onSave).toHaveBeenCalledWith("Cold and wet");
    expect(input()).toHaveValue("Cold and wet");
    setStored("Cold and wet");
    expect(input()).toHaveValue("Cold and wet");
  });

  it("trims a saved draft on leaving", () => {
    const setStored = renderField("");
    fireEvent.focus(input());
    type("Cold ");
    pause();
    expect(onSave).toHaveBeenCalledWith("Cold");
    setStored("Cold");
    expect(input()).toHaveValue("Cold ");
    fireEvent.blur(input());
    expect(input()).toHaveValue("Cold");

    fireEvent.focus(input());
    type("Cold and wet  ");
    fireEvent.blur(input());
    expect(onSave).toHaveBeenLastCalledWith("Cold and wet");
    expect(input()).toHaveValue("Cold and wet");
  });

  it("shows a saved edit whose change has not arrived yet on leaving", () => {
    renderField("Cold");
    fireEvent.focus(input());
    type("Warm ");
    pause();
    fireEvent.blur(input());
    expect(input()).toHaveValue("Warm");
  });

  it("follows remote changes again after losing and regaining edit rights while focused", () => {
    const setStored = renderField("Cold");
    fireEvent.focus(input());
    setStored("Cold", false);
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();

    setStored("Warm", true);
    expect(input()).toHaveValue("Warm");
    setStored("Mild", true);
    expect(input()).toHaveValue("Mild");
  });
});
