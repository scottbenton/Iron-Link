import { useContext } from "react";

import { DialogExtrasContext } from "components/Layout/dialogExtrasContext";

import { Dialog } from "ui/components/Dialog";

import { useAppState } from "stores/appState.store";

import { DataswornDialogContent } from "./DataswornDialogContent";

// A move, oracle or asset opened from a rules link, over whatever page is
// open. The recent roll cards come along, since the modal hides the page's.
export function DataswornDialog() {
  const { isOpen, openId } = useAppState((state) => state.dataswornDialogState);
  const DialogExtras = useContext(DialogExtrasContext);

  const handleClose = useAppState((state) => state.closeDataswornDialog);
  return (
    <Dialog open={isOpen} onClose={handleClose} size="md">
      {DialogExtras && <DialogExtras />}
      <DataswornDialogContent id={openId ?? ""} />
    </Dialog>
  );
}
