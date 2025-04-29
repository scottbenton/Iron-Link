import { BrandedContent } from "@/components/common/Dialog/BrandedContent";
import { useAppState } from "@/stores/appState.store";
import { Dialog } from "@chakra-ui/react";

import { DataswornDialogContent } from "./DataswornDialogContent";

export function DataswornDialog() {
  const { isOpen, openId } = useAppState((state) => state.dataswornDialogState);

  const handleClose = useAppState((state) => state.closeDataswornDialog);

  return (
    <Dialog.Root
      open={isOpen}
      onOpenChange={handleClose}
      lazyMount
      scrollBehavior={"inside"}
      placement={"center"}
    >
      <Dialog.Backdrop />
      <BrandedContent>
        <DataswornDialogContent id={openId ?? ""} onClose={handleClose} />
      </BrandedContent>
    </Dialog.Root>
  );
}
