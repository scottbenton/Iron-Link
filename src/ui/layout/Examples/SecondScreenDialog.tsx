import { CopyIcon } from "@phosphor-icons/react";
import { useState } from "react";

import { Button } from "../../components/Button";
import { Checkbox } from "../../components/Checkbox";
import {
  Dialog,
  DialogActions,
  DialogBody,
  DialogClose,
  DialogHeader,
} from "../../components/Dialog";
import { Text } from "../../components/Text";

export function SecondScreenDialog(props: {
  open: boolean;
  onClose: () => void;
}) {
  const [showSidebar, setShowSidebar] = useState(true);
  return (
    <Dialog
      open={props.open}
      onClose={props.onClose}
      size="md"
      fullScreenOnMobile
    >
      <DialogHeader title="Second Screen" />
      <DialogBody>
        <Text color="muted">
          Open this link on a shared screen, such as a TV, to show your table
          the current view.
        </Text>
        <div>
          <Button startIcon={<CopyIcon />}>Copy Second Screen Link</Button>
        </div>
        <Checkbox
          label="Show character sidebar"
          checked={showSidebar}
          onCheckedChange={setShowSidebar}
        />
        <Text variant="caption" color="muted">
          Current view: Kira Vale&apos;s sheet
        </Text>
      </DialogBody>
      <DialogActions>
        <DialogClose render={<Button variant="primary">Done</Button>} />
      </DialogActions>
    </Dialog>
  );
}
