import {
  DialogBackdrop,
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogRoot,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Theme, useAppState } from "@/stores/appState.store";
import { DialogRootProps } from "@chakra-ui/react";
import { ReactNode, useState } from "react";

import { DialogContentRefContext } from "./DialogContentRefContext";

export interface DialogProps {
  trigger?: ReactNode;
  title: ReactNode;
  content?: ReactNode;
  fullContent?: ReactNode;
  actions?: ReactNode;
  open?: boolean;
  onClose?: () => void;
  scrollOutside?: boolean;
  role?: "dialog" | "alertdialog";
  size?: DialogRootProps["size"];
}

export function Dialog(props: DialogProps) {
  const {
    trigger,
    title,
    content,
    fullContent,
    actions,
    open,
    onClose,
    scrollOutside,
    role,
    size,
  } = props;

  const [dialogContentRef, setDialogContentRef] =
    useState<HTMLDivElement | null>(null);

  const theme = useAppState((state) => state.theme);

  return (
    <DialogRoot
      role={role}
      open={open}
      onOpenChange={() => onClose && onClose()}
      lazyMount
      scrollBehavior={scrollOutside ? "outside" : "inside"}
      size={size}
      placement={"center"}
    >
      <DialogBackdrop />
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent
        ref={setDialogContentRef}
        appearance={theme === Theme.Light ? "light" : "dark"}
        colorPalette={"brand"}
      >
        <DialogCloseTrigger colorPalette={"gray"} />
        <DialogHeader>
          {typeof title === "string" ? (
            <DialogTitle>{title}</DialogTitle>
          ) : (
            title
          )}
        </DialogHeader>
        {fullContent ? fullContent : null}
        {content && (
          <DialogBody position={scrollOutside ? undefined : "relative"}>
            <DialogContentRefContext.Provider
              value={{
                ref: dialogContentRef ? { current: dialogContentRef } : null,
              }}
            >
              {content}
            </DialogContentRefContext.Provider>
          </DialogBody>
        )}
        {actions && <DialogFooter px={4}>{actions}</DialogFooter>}
      </DialogContent>
    </DialogRoot>
  );
}
