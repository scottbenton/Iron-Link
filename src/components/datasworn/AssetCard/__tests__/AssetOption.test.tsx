import { Datasworn } from "@datasworn-community/core";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AssetOption } from "../AssetOption";

const textAssetOptionWithDefault: Datasworn.TextField = {
  field_type: "text",
  label: "Test Label",
  value: "Default Value",
};
const textAssetOptionWithoutDefault: Datasworn.TextField = {
  field_type: "text",
  label: "Test Label",
  value: null,
};

const selectEnhancementFieldWithDefault: Datasworn.SelectEnhancementField = {
  label: "Test Select",
  field_type: "select_enhancement",
  value: "choice3",
  choices: {
    choice1: { label: "Choice 1", choice_type: "choice" },
    choice2: { label: "Choice 2", choice_type: "choice" },
    choiceGroup: {
      name: "Choice Group",
      choice_type: "choice_group",
      choices: {
        choice3: { label: "Choice 3", choice_type: "choice" },
        choice4: { label: "Choice 4", choice_type: "choice" },
      },
    },
  },
};
const selectEnhancementFieldWithoutDefault: Datasworn.SelectEnhancementField = {
  label: "Test Select",
  field_type: "select_enhancement",
  value: null,
  choices: {
    choice1: { label: "Choice 1", choice_type: "choice" },
    choice2: { label: "Choice 2", choice_type: "choice" },
    choiceGroup: {
      name: "Choice Group",
      choice_type: "choice_group",
      choices: {
        choice3: { label: "Choice 3", choice_type: "choice" },
        choice4: { label: "Choice 4", choice_type: "choice" },
      },
    },
  },
};

const selectValueFieldWithDefault: Datasworn.SelectValueField = {
  label: "Test Select",
  field_type: "select_value",
  value: "heart",
  choices: {
    edge: {
      label: "Edge",
      choice_type: "choice",
      using: "stat",
      stat: "edge",
    },
    heart: {
      label: "Heart",
      choice_type: "choice",
      using: "stat",
      stat: "heart",
    },
  },
};
const selectValueFieldWithoutDefault: Datasworn.SelectValueField = {
  label: "Test Select",
  field_type: "select_value",
  value: null,
  choices: {
    edge: {
      label: "Edge",
      choice_type: "choice",
      using: "stat",
      stat: "edge",
    },
    heart: {
      label: "Heart",
      choice_type: "choice",
      using: "stat",
      stat: "heart",
    },
  },
};

describe("AssetOption", () => {
  it("renders a text field with default value", () => {
    const { getByLabelText } = render(
      <AssetOption
        assetOption={textAssetOptionWithDefault}
        assetOptionKey="testKey"
      />,
    );
    const input = getByLabelText("Test Label");
    expect(input).toBeInTheDocument();
    expect(input).toHaveValue("Default Value");
    expect(input).toBeDisabled();
  });
  it("renders a text field with no value", () => {
    const { getByLabelText } = render(
      <AssetOption
        assetOption={textAssetOptionWithoutDefault}
        assetOptionKey="testKey"
      />,
    );
    const input = getByLabelText("Test Label");
    expect(input).toBeInTheDocument();
    expect(input).toHaveValue("");
    expect(input).toBeDisabled();
  });
  it("renders a text field with the user's value", () => {
    const onChange = vi.fn();
    const { getByLabelText } = render(
      <AssetOption
        assetOption={textAssetOptionWithDefault}
        assetOptionKey="testKey"
        value={"User Value"}
        onAssetOptionChange={onChange}
      />,
    );
    const input = getByLabelText("Test Label");
    expect(input).toBeInTheDocument();
    expect(input).toHaveValue("User Value");
    expect(input).not.toBeDisabled();

    fireEvent.change(input, { target: { value: "New Value" } });
    expect(onChange).toHaveBeenCalledWith("testKey", "New Value");
  });

  it("renders a select enhancement field with default value", () => {
    const { getByLabelText } = render(
      <AssetOption
        assetOption={selectEnhancementFieldWithDefault}
        assetOptionKey="testKey"
      />,
    );
    const inputBox = getByLabelText("Test Select");

    expect(inputBox).toBeInTheDocument();
    expect(inputBox).toHaveTextContent("Choice 3");
  });
  it("renders a select enhancement field without default value", () => {
    render(
      <AssetOption
        assetOption={selectEnhancementFieldWithoutDefault}
        assetOptionKey="testKey"
        onAssetOptionChange={() => {}}
      />,
    );
    const inputBox = screen.getByLabelText("Test Select");
    expect(inputBox).toBeInTheDocument();
    expect(inputBox).not.toHaveTextContent("Choice");
  });
  it("renders a select enhancement field with the user's value", () => {
    const onChange = vi.fn();
    const { getByLabelText, getByRole } = render(
      <AssetOption
        assetOption={selectEnhancementFieldWithDefault}
        assetOptionKey="testKey"
        value={"choice4"}
        onAssetOptionChange={onChange}
      />,
    );
    const button = getByLabelText("Test Select");
    expect(button).toHaveTextContent("Choice 4");
    fireEvent.mouseDown(button);

    const listBox = within(getByRole("listbox"));
    const option = listBox.getByText("Choice 1");
    fireEvent.click(option);
    expect(button).toHaveTextContent("Choice 1");
  });

  it("renders a select value field with default value", () => {
    const { getByLabelText } = render(
      <AssetOption
        assetOption={selectValueFieldWithDefault}
        assetOptionKey="testKey"
      />,
    );
    const inputBox = getByLabelText("Test Select");

    expect(inputBox).toBeInTheDocument();
    expect(inputBox).toHaveTextContent("Heart");
  });
  it("renders a select value field without default value", () => {
    render(
      <AssetOption
        assetOption={selectValueFieldWithoutDefault}
        assetOptionKey="testKey"
        onAssetOptionChange={() => {}}
      />,
    );
    const inputBox = screen.getByLabelText("Test Select");
    expect(inputBox).toBeInTheDocument();
    expect(inputBox).not.toHaveTextContent("Heart");
    expect(inputBox).not.toHaveTextContent("Edge");
  });
  it("renders a select value field with the user's value", () => {
    const onChange = vi.fn();
    const { getByLabelText, getByRole } = render(
      <AssetOption
        assetOption={selectValueFieldWithDefault}
        assetOptionKey="testKey"
        value={"edge"}
        onAssetOptionChange={onChange}
      />,
    );
    const button = getByLabelText("Test Select");
    expect(button).toHaveTextContent("Edge");
    fireEvent.mouseDown(button);

    const listBox = within(getByRole("listbox"));
    const option = listBox.getByText("Heart");
    fireEvent.click(option);
    expect(button).toHaveTextContent("Heart");
  });
});
