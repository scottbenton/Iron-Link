import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";

import { Button } from "../../Button";
import { Dialog } from "../Dialog";
import { DialogActions } from "../DialogActions";
import { DialogBody } from "../DialogBody";
import { DialogHeader } from "../DialogHeader";

function Nested(props: { outer: () => void; inner: () => void }) {
  const { outer, inner } = props;
  const [open, setOpen] = useState(false);
  return (
    <Dialog open onClose={() => {}} onSubmit={outer}>
      <DialogHeader title="Outer" />
      <DialogBody>
        <Button onClick={() => setOpen(true)}>Open inner</Button>
        <Dialog open={open} onClose={() => setOpen(false)} onSubmit={inner}>
          <DialogHeader title="Inner" />
          <DialogActions>
            <Button type="submit">Save inner</Button>
          </DialogActions>
        </Dialog>
      </DialogBody>
    </Dialog>
  );
}

describe("Dialog", () => {
  it("submits only the dialog whose form was submitted", async () => {
    const user = userEvent.setup();
    const outer = vi.fn();
    const inner = vi.fn();
    render(<Nested outer={outer} inner={inner} />);

    await user.click(screen.getByRole("button", { name: "Open inner" }));
    const dialog = await screen.findByRole("dialog", { name: "Inner" });
    await user.click(
      within(dialog).getByRole("button", { name: "Save inner" }),
    );

    expect(inner).toHaveBeenCalledTimes(1);
    expect(outer).not.toHaveBeenCalled();
  });
});
