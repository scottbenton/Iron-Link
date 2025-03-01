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
import { DialogRootProps, Group } from "@chakra-ui/react";
import { ReactNode } from "react";

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
  return (
    <DialogRoot
      role={role}
      open={open}
      onOpenChange={() => onClose && onClose()}
      lazyMount
      scrollBehavior={scrollOutside ? "outside" : "inside"}
      size={size}
    >
      <DialogBackdrop />
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent>
        <DialogCloseTrigger />
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
            {content}
          </DialogBody>
        )}
        {actions && (
          <DialogFooter>
            <Group justifyContent={"flex-end"}>{actions}</Group>
          </DialogFooter>
        )}
      </DialogContent>
    </DialogRoot>
  );
}
