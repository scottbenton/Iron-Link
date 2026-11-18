import { User, UserCircleGear, UsersThree } from "@phosphor-icons/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { FormEvent, useState } from "react";

import { Grid, HStack } from "styled-system/jsx";

import { Button } from "../Button";
import { Checkbox } from "../Checkbox";
import {
  Dialog,
  DialogActions,
  DialogBody,
  DialogClose,
  DialogHeader,
} from "../Dialog";
import { NumberField } from "../NumberField";
import { RadioCard, RadioCardGroup } from "../RadioCard";
import { Select } from "../Select";
import { TextField } from "../TextField";
import { Form, FormActions } from "./Form";

const meta = {
  title: "Components/Form",
  component: Form,
  args: { children: null },
} satisfies Meta<typeof Form>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Enter in a field submits. `required` fields are checked on submit, and
 * server errors show on the fields they name.
 */
export const CharacterForm: Story = {
  render: function Render() {
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [saved, setSaved] = useState<string | null>(null);
    return (
      <Form
        errors={errors}
        onSubmit={(event) => {
          const data = new FormData(event.currentTarget);
          const name = String(data.get("name") ?? "").trim();
          if (name.toLowerCase() === "kayu") {
            setErrors({
              name: "A character in this game already has that name.",
            });
            return;
          }
          setErrors({});
          setSaved(name);
        }}
      >
        <Grid columns={{ base: 1, sm: 2 }} gap="4" maxWidth="520px">
          <TextField
            name="name"
            label="Character Name"
            required
            description="Try Kayu to see a server error."
          />
          <TextField name="pronouns" label="Pronouns" placeholder="they/them" />
        </Grid>
        <FormActions>
          <Button type="submit" variant="primary">
            Save Character
          </Button>
        </FormActions>
        {saved && <p role="status">Saved {saved}.</p>}
      </Form>
    );
  },
};

type GameType = "solo" | "co-op" | "guided";
type Ruleset = "ironsworn" | "starforged" | "sundered-isles";

/**
 * Several controls inside a Dialog that is itself the form: Enter in the
 * name submits, and Create Game is the submit button.
 */
export const FormExample: Story = {
  name: "Form example",
  render: function Render() {
    const [open, setOpen] = useState(true);
    const [name, setName] = useState("");
    const [ruleset, setRuleset] = useState<Ruleset | null>(null);
    const [type, setType] = useState<GameType>("solo");
    const [momentum, setMomentum] = useState<number | null>(2);
    const [showRolls, setShowRolls] = useState(true);
    const [submitted, setSubmitted] = useState(false);
    const [creating, setCreating] = useState(false);
    const [result, setResult] = useState<string | null>(null);

    const nameError =
      submitted && !name.trim()
        ? "Give your game a name before you create it."
        : undefined;
    const rulesetError =
      submitted && !ruleset
        ? "Choose a ruleset to create the game."
        : undefined;

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (creating) return;
      setSubmitted(true);
      if (!name.trim() || !ruleset) return;
      setCreating(true);
      window.setTimeout(() => {
        setCreating(false);
        setOpen(false);
        setResult(`Created ${name.trim()}, a ${type} game.`);
      }, 800);
    };

    return (
      <>
        <HStack gap="3">
          <Button variant="primary" onClick={() => setOpen(true)}>
            Create Game
          </Button>
          {result && <span role="status">{result}</span>}
        </HStack>
        <Dialog
          open={open}
          onClose={() => setOpen(false)}
          onSubmit={handleSubmit}
          size="md"
        >
          <DialogHeader title="Create Game" />
          <DialogBody>
            <TextField
              label="Game Name"
              required
              value={name}
              onValueChange={setName}
              error={nameError}
              placeholder="The Iron Vow"
            />
            <Select<Ruleset>
              label="Ruleset"
              required
              placeholder="Choose a ruleset"
              value={ruleset}
              onValueChange={setRuleset}
              error={rulesetError}
              options={[
                { value: "ironsworn", label: "Ironsworn" },
                { value: "starforged", label: "Starforged" },
                { value: "sundered-isles", label: "Sundered Isles" },
              ]}
            />
            <RadioCardGroup<GameType>
              label="Game type"
              value={type}
              onValueChange={setType}
              minCardWidth="160px"
            >
              <RadioCard<GameType> value="solo" title="Solo" icon={<User />} />
              <RadioCard<GameType>
                value="co-op"
                title="Co-op"
                icon={<UsersThree />}
              />
              <RadioCard<GameType>
                value="guided"
                title="Guided"
                icon={<UserCircleGear />}
              />
            </RadioCardGroup>
            <NumberField
              label="Starting momentum"
              min={-6}
              max={10}
              showSign
              value={momentum}
              onValueChange={setMomentum}
            />
            <Checkbox
              label="Show roll cards in dialogs"
              checked={showRolls}
              onCheckedChange={setShowRolls}
            />
          </DialogBody>
          <DialogActions>
            <DialogClose render={<Button variant="ghost" />}>
              Cancel
            </DialogClose>
            <Button
              type="submit"
              variant="primary"
              loading={creating}
              loadingLabel="Creating Game"
            >
              Create Game
            </Button>
          </DialogActions>
        </Dialog>
      </>
    );
  },
};
