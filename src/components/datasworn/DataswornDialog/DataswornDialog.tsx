import { Dialog } from "ui/components/Dialog";

import { useAppState } from "stores/appState.store";

import { DataswornDialogContent } from "./DataswornDialogContent";

// A move, oracle or asset opened from a rules link, over whatever page is
// open. A library dialog leaves the toasts, and the recent roll cards among
// them, in reach, so it needs no copy of its own.
export function DataswornDialog() {
  const { isOpen, openId } = useAppState((state) => state.dataswornDialogState);

  const handleClose = useAppState((state) => state.closeDataswornDialog);
  return (
    <Dialog open={isOpen} onClose={handleClose} size="md">
      <DataswornDialogContent id={openId ?? ""} />
    </Dialog>
  );
}
